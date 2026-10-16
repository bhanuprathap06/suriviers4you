import { MonsterState } from "../state/MonsterState";
import { PlayerState } from "../state/PlayerState";
import { MapSchema } from "@colyseus/schema";
import {
  MONSTER,
  MONSTER_WAYPOINTS,
  isPointWalkable,
  getDistance,
} from "@blacksite/shared";
import type { MonsterBehavior, Vec3 } from "@blacksite/shared";

export class AISystem {
  update(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
    elapsedMissionTime: number,
  ): void {
    monster.attackCooldown = Math.max(
      0,
      monster.attackCooldown - deltaTime,
    );

    monster.aggressionLevel = 1 + elapsedMissionTime / 120;

    const state = monster.behaviorState as MonsterBehavior;
    switch (state) {
      case "PATROL":
        this.patrol(monster, players, deltaTime);
        break;
      case "INVESTIGATE":
        this.investigate(monster, players, deltaTime);
        break;
      case "SEARCH":
        this.search(monster, players, deltaTime);
        break;
      case "CHASE":
        this.chase(monster, players, deltaTime);
        break;
      case "ATTACK":
        this.attack(monster, players, deltaTime);
        break;
      case "RETURN":
        this.returnToPatrol(monster, deltaTime);
        break;
    }
  }

  private patrol(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): void {
    const wp = MONSTER_WAYPOINTS[monster.currentWaypointIndex];
    if (!wp) {
      monster.currentWaypointIndex = 0;
      return;
    }

    const dist = this.moveToward(
      monster,
      wp.position.x,
      wp.position.z,
      MONSTER.PATROL_SPEED,
      deltaTime,
    );

    if (dist < 1) {
      const connections = wp.connections;
      if (connections.length > 0) {
        monster.currentWaypointIndex =
          connections[Math.floor(Math.random() * connections.length)];
      }
    }

    const noisyPlayer = this.findNoisyPlayer(monster, players);
    if (noisyPlayer) {
      monster.investigateTarget = { x: noisyPlayer.x, z: noisyPlayer.z };
      monster.behaviorState = "INVESTIGATE";
      monster.stateTimer = MONSTER.INVESTIGATE_DURATION;
      return;
    }

    const visiblePlayer = this.findVisiblePlayer(monster, players);
    if (visiblePlayer) {
      monster.targetPlayerId = visiblePlayer.id;
      monster.behaviorState = "CHASE";
      monster.stateTimer = 0;
    }
  }

  private investigate(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): void {
    monster.stateTimer -= deltaTime;

    const visiblePlayer = this.findVisiblePlayer(monster, players);
    if (visiblePlayer) {
      monster.targetPlayerId = visiblePlayer.id;
      monster.behaviorState = "CHASE";
      monster.stateTimer = 0;
      return;
    }

    if (monster.investigateTarget) {
      const dist = this.moveToward(
        monster,
        monster.investigateTarget.x,
        monster.investigateTarget.z,
        MONSTER.SEARCH_SPEED,
        deltaTime,
      );
      if (dist < 2 || monster.stateTimer <= 0) {
        monster.behaviorState = "SEARCH";
        monster.stateTimer = MONSTER.SEARCH_DURATION;
        monster.investigateTarget = null;
      }
    } else {
      monster.behaviorState = "RETURN";
    }
  }

  private search(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): void {
    monster.stateTimer -= deltaTime;

    const visiblePlayer = this.findVisiblePlayer(monster, players);
    if (visiblePlayer) {
      monster.targetPlayerId = visiblePlayer.id;
      monster.behaviorState = "CHASE";
      return;
    }

    const noisyPlayer = this.findNoisyPlayer(monster, players);
    if (noisyPlayer) {
      monster.investigateTarget = { x: noisyPlayer.x, z: noisyPlayer.z };
      monster.behaviorState = "INVESTIGATE";
      monster.stateTimer = MONSTER.INVESTIGATE_DURATION;
      return;
    }

    const angle = Date.now() / 1000;
    const searchX = monster.x + Math.sin(angle) * 3;
    const searchZ = monster.z + Math.cos(angle) * 3;
    this.moveToward(monster, searchX, searchZ, MONSTER.SEARCH_SPEED * 0.5, deltaTime);

    if (monster.stateTimer <= 0) {
      monster.behaviorState = "RETURN";
    }
  }

  private chase(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): void {
    const target = players.get(monster.targetPlayerId);
    if (!target || target.status !== "alive") {
      monster.behaviorState = "SEARCH";
      monster.stateTimer = MONSTER.SEARCH_DURATION / 2;
      monster.targetPlayerId = "";
      return;
    }

    const dist = this.moveToward(
      monster,
      target.x,
      target.z,
      MONSTER.CHASE_SPEED * monster.aggressionLevel,
      deltaTime,
    );

    monster.lastKnownPlayerPos = { x: target.x, z: target.z };

    if (dist <= MONSTER.ATTACK_RANGE && monster.attackCooldown <= 0) {
      monster.behaviorState = "ATTACK";
      monster.stateTimer = 0.5;
      return;
    }

    const playerDist = getDistance(
      { x: monster.x, y: 0, z: monster.z },
      { x: target.x, y: 0, z: target.z },
    );
    if (playerDist > MONSTER.DETECTION_RANGE * 1.5) {
      monster.behaviorState = "SEARCH";
      monster.stateTimer = MONSTER.SEARCH_DURATION;
    }
  }

  private attack(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): { hitPlayerId: string | null } {
    monster.stateTimer -= deltaTime;
    if (monster.stateTimer <= 0) {
      const target = players.get(monster.targetPlayerId);
      if (target && target.status === "alive") {
        const dist = getDistance(
          { x: monster.x, y: 0, z: monster.z },
          { x: target.x, y: 0, z: target.z },
        );
        if (dist <= MONSTER.ATTACK_RANGE) {
          monster.attackCooldown = MONSTER.ATTACK_COOLDOWN;
          monster.behaviorState = "CHASE";
          return { hitPlayerId: target.id };
        }
      }
      monster.behaviorState = "CHASE";
    }
    return { hitPlayerId: null };
  }

  private returnToPatrol(
    monster: MonsterState,
    deltaTime: number,
  ): void {
    const wp = MONSTER_WAYPOINTS[monster.currentWaypointIndex];
    if (!wp) {
      monster.behaviorState = "PATROL";
      return;
    }
    const dist = this.moveToward(
      monster,
      wp.position.x,
      wp.position.z,
      MONSTER.PATROL_SPEED,
      deltaTime,
    );
    if (dist < 2) {
      monster.behaviorState = "PATROL";
    }
  }

  private moveToward(
    monster: MonsterState,
    targetX: number,
    targetZ: number,
    speed: number,
    deltaTime: number,
  ): number {
    const dx = targetX - monster.x;
    const dz = targetZ - monster.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return dist;

    const nx = dx / dist;
    const nz = dz / dist;
    const moveDist = Math.min(speed * deltaTime, dist);
    const newX = monster.x + nx * moveDist;
    const newZ = monster.z + nz * moveDist;

    if (isPointWalkable(newX, newZ)) {
      monster.x = newX;
      monster.z = newZ;
      monster.rotY = Math.atan2(nx, nz);
    } else if (isPointWalkable(newX, monster.z)) {
      monster.x = newX;
    } else if (isPointWalkable(monster.x, newZ)) {
      monster.z = newZ;
    }

    return dist;
  }

  private findVisiblePlayer(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
  ): PlayerState | null {
    let closest: PlayerState | null = null;
    let closestDist = Infinity;

    players.forEach((player) => {
      if (player.status !== "alive") return;
      const dist = getDistance(
        { x: monster.x, y: 0, z: monster.z },
        { x: player.x, y: 0, z: player.z },
      );
      const effectiveRange =
        MONSTER.DETECTION_RANGE * monster.aggressionLevel;
      if (dist < effectiveRange && dist < closestDist) {
        if (!player.isCrouching || dist < effectiveRange * 0.4) {
          closest = player;
          closestDist = dist;
        }
      }
    });

    return closest;
  }

  private findNoisyPlayer(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
  ): PlayerState | null {
    let noisiest: PlayerState | null = null;
    let maxNoise = 3;

    players.forEach((player) => {
      if (player.status !== "alive" || player.noiseLevel <= 0) return;
      const dist = getDistance(
        { x: monster.x, y: 0, z: monster.z },
        { x: player.x, y: 0, z: player.z },
      );
      const hearingRange = MONSTER.HEARING_RANGE * monster.aggressionLevel;
      const effectiveNoise = player.noiseLevel * (1 - dist / hearingRange);
      if (dist < hearingRange && effectiveNoise > maxNoise) {
        noisiest = player;
        maxNoise = effectiveNoise;
      }
    });

    return noisiest;
  }

  getAttackResult(
    monster: MonsterState,
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): { hitPlayerId: string | null } {
    if (monster.behaviorState === "ATTACK") {
      return this.attack(monster, players, deltaTime);
    }
    return { hitPlayerId: null };
  }
}
