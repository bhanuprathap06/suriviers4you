import { PlayerState } from "../state/PlayerState";
import { MapSchema } from "@colyseus/schema";
import { PLAYER, MONSTER, getDistance } from "@blacksite/shared";

export class CombatSystem {
  applyDamage(player: PlayerState, damage: number): void {
    if (player.status !== "alive") return;
    player.health = Math.max(0, player.health - damage);
    if (player.health <= 0) {
      player.status = "downed";
      player.downedTimer = PLAYER.DOWNED_TIMER;
    }
  }

  updateDownedPlayers(
    players: MapSchema<PlayerState>,
    deltaTime: number,
  ): string[] {
    const eliminated: string[] = [];
    players.forEach((player) => {
      if (player.status === "downed") {
        player.downedTimer -= deltaTime;
        if (player.downedTimer <= 0) {
          player.status = "eliminated";
          eliminated.push(player.id);
        }
      }
    });
    return eliminated;
  }

  attemptRevive(
    reviver: PlayerState,
    target: PlayerState,
  ): boolean {
    if (reviver.status !== "alive") return false;
    if (target.status !== "downed") return false;

    const dist = getDistance(
      { x: reviver.x, y: 0, z: reviver.z },
      { x: target.x, y: 0, z: target.z },
    );
    if (dist > PLAYER.REVIVE_DISTANCE) return false;

    target.status = "alive";
    target.health = 30;
    target.downedTimer = 0;
    return true;
  }

  healPlayer(player: PlayerState, amount: number): void {
    if (player.status !== "alive") return;
    player.health = Math.min(PLAYER.MAX_HEALTH, player.health + amount);
  }

  areAllPlayersDeadOrExtracted(
    players: MapSchema<PlayerState>,
  ): boolean {
    let allDone = true;
    players.forEach((player) => {
      if (
        player.isConnected &&
        (player.status === "alive" || player.status === "downed")
      ) {
        allDone = false;
      }
    });
    return allDone;
  }

  getExtractedCount(players: MapSchema<PlayerState>): number {
    let count = 0;
    players.forEach((player) => {
      if (player.status === "extracted") count++;
    });
    return count;
  }

  getAliveCount(players: MapSchema<PlayerState>): number {
    let count = 0;
    players.forEach((player) => {
      if (player.status === "alive" || player.status === "downed") count++;
    });
    return count;
  }
}
