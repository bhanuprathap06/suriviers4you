import { Room, Client } from "colyseus";
import { GameState } from "../state/GameState";
import { PlayerState } from "../state/PlayerState";
import { ItemState } from "../state/ItemState";
import { DoorStateSchema } from "../state/DoorState";
import { MonsterState } from "../state/MonsterState";
import { MovementSystem } from "../systems/MovementSystem";
import { AISystem } from "../systems/AISystem";
import { CombatSystem } from "../systems/CombatSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { ObjectiveSystem } from "../systems/ObjectiveSystem";
import { config } from "../config";
import crypto from "crypto";
import {
  GAME,
  PLAYER,
  MONSTER,
  MESSAGES,
  NOISE_LEVELS,
  PLAYER_SPAWNS,
  MONSTER_SPAWN,
  ITEM_SPAWNS,
  DOORS,
  OBJECTIVES,
  getDistance,
  MoveInputSchema,
  InteractSchema,
  PickupSchema,
  DropSchema,
  UseItemSchema,
  ReviveSchema,
  ReadySchema,
  StartGameSchema,
  PlayerNameSchema,
} from "@blacksite/shared";

const inviteCodeMap = new Map<string, string>();

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do {
    const bytes = crypto.randomBytes(GAME.INVITE_CODE_LENGTH);
    code = Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join("");
  } while (inviteCodeMap.has(code));
  return code;
}

export function getInviteCodeMap() {
  return inviteCodeMap;
}

export class GameRoom extends Room<GameState> {
  maxClients = GAME.MAX_PLAYERS;

  private movementSystem = new MovementSystem();
  private aiSystem = new AISystem();
  private combatSystem = new CombatSystem();
  private inventorySystem = new InventorySystem();
  private objectiveSystem = new ObjectiveSystem(this.inventorySystem);

  private missionStartTime = 0;
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private playerNames = new Map<string, string>();

  onCreate(options: Record<string, unknown>) {
    this.setState(new GameState());

    const inviteCode = generateInviteCode();
    this.state.inviteCode = inviteCode;
    inviteCodeMap.set(inviteCode, this.roomId);

    this.state.missionDuration =
      (options.missionDuration as number) || config.defaultMissionDuration;
    this.state.timeRemaining = this.state.missionDuration;
    this.state.difficulty = (options.difficulty as string) || "normal";

    this.setPatchRate(GAME.PATCH_RATE);
    this.registerMessageHandlers();

    this.setSimulationInterval(
      (dt) => this.update(dt / 1000),
      1000 / GAME.TICK_RATE,
    );

    this.autoDispose = false;
    this.clock.start();

    console.log(
      `Room created: ${this.roomId} | Invite: ${inviteCode}`,
    );
  }

  onJoin(client: Client, options: Record<string, unknown>) {
    const nameResult = PlayerNameSchema.safeParse(options.playerName);
    const playerName = nameResult.success ? nameResult.data : `Player-${client.sessionId.substring(0, 4)}`;

    if (this.state.phase !== "LOBBY") {
      const existingPlayer = this.findDisconnectedPlayer(playerName);
      if (existingPlayer) {
        this.reconnectPlayer(client, existingPlayer);
        return;
      }
      client.leave(4001);
      return;
    }

    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = playerName;
    player.isConnected = true;

    const spawnIdx = this.state.players.size % PLAYER_SPAWNS.length;
    const spawn = PLAYER_SPAWNS[spawnIdx];
    player.x = spawn.x;
    player.y = 0;
    player.z = spawn.z;

    this.state.players.set(client.sessionId, player);
    this.playerNames.set(client.sessionId, playerName);

    if (!this.state.hostId || !this.state.players.has(this.state.hostId)) {
      this.state.hostId = client.sessionId;
    }

    this.broadcast(MESSAGES.GAME_EVENT, {
      type: "player_joined",
      playerName,
      playerCount: this.state.players.size,
    });

    console.log(
      `Player joined: ${playerName} (${client.sessionId}) | Room: ${this.state.inviteCode}`,
    );
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (this.state.phase === "LOBBY" || consented) {
      this.state.players.delete(client.sessionId);
      this.playerNames.delete(client.sessionId);
      this.transferHostIfNeeded(client.sessionId);

      this.broadcast(MESSAGES.GAME_EVENT, {
        type: "player_left",
        playerName: player.name,
        playerCount: this.state.players.size,
      });

      if (this.state.players.size === 0 && this.state.phase === "LOBBY") {
        this.cleanupRoom();
      }
      return;
    }

    player.status = "disconnected";
    player.isConnected = false;

    this.broadcast(MESSAGES.GAME_EVENT, {
      type: "player_disconnected",
      playerName: player.name,
    });

    const timer = setTimeout(() => {
      const p = this.state.players.get(client.sessionId);
      if (p && !p.isConnected) {
        this.inventorySystem.dropAllItems(p, this.state.items);
        p.status = "eliminated";
        this.reconnectTimers.delete(client.sessionId);
      }
    }, GAME.RECONNECT_GRACE_SECONDS * 1000);

    this.reconnectTimers.set(client.sessionId, timer);
    this.transferHostIfNeeded(client.sessionId);
  }

  onDispose() {
    inviteCodeMap.delete(this.state.inviteCode);
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    console.log(`Room disposed: ${this.roomId}`);
  }

  private registerMessageHandlers() {
    this.onMessage(MESSAGES.MOVE, (client, data) => {
      const result = MoveInputSchema.safeParse(data);
      if (!result.success) return;
      if (this.state.phase !== "ACTIVE" && this.state.phase !== "EXTRACTION") return;

      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isConnected) return;

      if (!this.checkRateLimit(player)) return;

      const dt = 1 / GAME.TICK_RATE;
      this.movementSystem.validateAndApplyMove(
        player,
        result.data.dx,
        result.data.dz,
        result.data.rotY,
        result.data.isSprinting,
        result.data.isCrouching,
        dt,
      );
      player.lastInputSeq = result.data.seq;
    });

    this.onMessage(MESSAGES.TOGGLE_FLASHLIGHT, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.status !== "alive") return;
      player.flashlightOn = !player.flashlightOn;
    });

    this.onMessage(MESSAGES.PICKUP, (client, data) => {
      const result = PickupSchema.safeParse(data);
      if (!result.success) return;
      if (this.state.phase !== "ACTIVE" && this.state.phase !== "EXTRACTION") return;

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const success = this.inventorySystem.pickupItem(
        player,
        result.data.itemId,
        this.state.items,
      );

      if (success) {
        const item = this.state.items.get(result.data.itemId);
        if (item?.itemType === "access_card") {
          const obj = this.state.objectives.get("find_access_card");
          if (obj && !obj.completed) {
            obj.completed = true;
            obj.completedBy = player.id;
            this.broadcast(MESSAGES.OBJECTIVE_UPDATE, {
              objectiveId: "find_access_card",
              completed: true,
            });
          }
        }
        if (item?.itemType === "evidence") {
          this.objectiveSystem.attemptObjective(
            this.state,
            player,
            "collect_evidence",
          );
        }
        if (item?.itemType === "core") {
          this.objectiveSystem.attemptObjective(
            this.state,
            player,
            "retrieve_core",
          );
        }
        client.send(MESSAGES.GAME_EVENT, {
          type: "item_picked_up",
          itemId: result.data.itemId,
        });
      }
    });

    this.onMessage(MESSAGES.DROP, (client, data) => {
      const result = DropSchema.safeParse(data);
      if (!result.success) return;

      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      this.inventorySystem.dropItem(player, result.data.itemId, this.state.items);
    });

    this.onMessage(MESSAGES.USE_ITEM, (client, data) => {
      const result = UseItemSchema.safeParse(data);
      if (!result.success) return;

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const { used } = this.inventorySystem.useItem(
        player,
        result.data.itemId,
        this.state.items,
      );
      if (used) {
        client.send(MESSAGES.GAME_EVENT, {
          type: "item_used",
          itemId: result.data.itemId,
        });
      }
    });

    this.onMessage(MESSAGES.INTERACT, (client, data) => {
      const result = InteractSchema.safeParse(data);
      if (!result.success) return;
      if (this.state.phase !== "ACTIVE" && this.state.phase !== "EXTRACTION") return;

      const player = this.state.players.get(client.sessionId);
      if (!player || player.status !== "alive") return;

      this.handleInteraction(player, result.data.targetId, result.data.targetType);
    });

    this.onMessage(MESSAGES.REVIVE, (client, data) => {
      const result = ReviveSchema.safeParse(data);
      if (!result.success) return;

      const reviver = this.state.players.get(client.sessionId);
      if (!reviver) return;

      const target = this.state.players.get(result.data.targetPlayerId);
      if (!target) return;

      if (this.combatSystem.attemptRevive(reviver, target)) {
        this.broadcast(MESSAGES.GAME_EVENT, {
          type: "player_revived",
          reviverId: reviver.id,
          targetId: target.id,
        });
      }
    });

    this.onMessage(MESSAGES.READY, (client, data) => {
      const result = ReadySchema.safeParse(data);
      if (!result.success) return;
      if (this.state.phase !== "LOBBY") return;

      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.isReady = result.data.isReady;
    });

    this.onMessage(MESSAGES.START_GAME, (client, data) => {
      if (this.state.phase !== "LOBBY") return;
      if (client.sessionId !== this.state.hostId) return;

      const result = StartGameSchema.safeParse(data || {});
      if (!result.success) return;

      const playerCount = this.state.players.size;
      if (playerCount < config.minPlayersToStart) return;

      if (result.data?.config?.difficulty) {
        this.state.difficulty = result.data.config.difficulty;
      }
      if (result.data?.config?.missionDuration) {
        this.state.missionDuration = result.data.config.missionDuration;
        this.state.timeRemaining = result.data.config.missionDuration;
      }

      this.startMission();
    });
  }

  private handleInteraction(
    player: PlayerState,
    targetId: string,
    targetType: string,
  ) {
    switch (targetType) {
      case "door": {
        const door = this.state.doors.get(targetId);
        if (!door) return;
        const dist = getDistance(
          { x: player.x, y: 0, z: player.z },
          { x: door.x, y: 0, z: door.z },
        );
        if (dist > PLAYER.INTERACT_DISTANCE) return;
        if (door.locked) return;
        door.state = door.state === "open" ? "closed" : "open";
        player.noiseLevel = NOISE_LEVELS.DOOR_OPEN;
        break;
      }
      case "generator": {
        const result = this.objectiveSystem.attemptObjective(
          this.state,
          player,
          "restore_generator",
        );
        if (result.success) {
          player.noiseLevel = NOISE_LEVELS.GENERATOR_START;
          this.broadcast(MESSAGES.OBJECTIVE_UPDATE, {
            objectiveId: "restore_generator",
            completed: true,
            message: result.message,
          });
        }
        break;
      }
      case "extraction_panel": {
        const result = this.objectiveSystem.attemptObjective(
          this.state,
          player,
          "activate_extraction",
        );
        if (result.success) {
          this.state.phase = "EXTRACTION";
          this.state.extractionCountdown = GAME.EXTRACTION_COUNTDOWN;
          this.broadcast(MESSAGES.OBJECTIVE_UPDATE, {
            objectiveId: "activate_extraction",
            completed: true,
            message: result.message,
          });
          this.broadcast(MESSAGES.GAME_EVENT, {
            type: "extraction_activated",
            countdown: GAME.EXTRACTION_COUNTDOWN,
          });
        }
        break;
      }
      default: {
        const dist2 = getDistance(
          { x: player.x, y: 0, z: player.z },
          { x: 10, y: 0, z: -2 },
        );
        if (targetId === "door_east" && dist2 <= PLAYER.INTERACT_DISTANCE) {
          const result = this.objectiveSystem.attemptObjective(
            this.state,
            player,
            "unlock_laboratory",
          );
          if (result.success) {
            this.broadcast(MESSAGES.OBJECTIVE_UPDATE, {
              objectiveId: "unlock_laboratory",
              completed: true,
              message: result.message,
            });
          }
        }
        break;
      }
    }
  }

  private startMission() {
    this.state.phase = "STARTING";
    this.state.startingCountdown = GAME.STARTING_COUNTDOWN;
    this.lock();

    this.initItems();
    this.initDoors();
    this.objectiveSystem.initObjectives(this.state);

    this.state.monster = new MonsterState();
    this.state.monster.x = MONSTER_SPAWN.x;
    this.state.monster.z = MONSTER_SPAWN.z;
    this.state.monster.behaviorState = "PATROL";

    let idx = 0;
    this.state.players.forEach((player) => {
      const spawn = PLAYER_SPAWNS[idx % PLAYER_SPAWNS.length];
      player.x = spawn.x;
      player.y = 0;
      player.z = spawn.z;
      player.health = PLAYER.MAX_HEALTH;
      player.stamina = PLAYER.MAX_STAMINA;
      player.flashlightBattery = PLAYER.MAX_FLASHLIGHT_BATTERY;
      player.flashlightOn = false;
      player.status = "alive";
      player.isReady = false;
      idx++;
    });

    this.broadcast(MESSAGES.GAME_EVENT, { type: "mission_starting" });
  }

  private initItems() {
    for (const spawn of ITEM_SPAWNS) {
      const item = new ItemState();
      item.id = spawn.id;
      item.itemType = spawn.type;
      item.x = spawn.position.x;
      item.y = spawn.position.y;
      item.z = spawn.position.z;
      item.collected = false;
      item.heldBy = "";
      this.state.items.set(spawn.id, item);
    }
  }

  private initDoors() {
    for (const def of DOORS) {
      const door = new DoorStateSchema();
      door.id = def.id;
      door.locked = def.startsLocked;
      door.state = "closed";
      door.requiresKey = def.requiresKey || "";
      door.x = def.position.x;
      door.z = def.position.z;
      door.rotation = def.rotation;
      door.width = def.width;
      this.state.doors.set(def.id, door);
    }
  }

  private update(deltaTime: number) {
    switch (this.state.phase) {
      case "STARTING":
        this.updateStarting(deltaTime);
        break;
      case "ACTIVE":
        this.updateActive(deltaTime);
        break;
      case "EXTRACTION":
        this.updateExtraction(deltaTime);
        break;
    }
  }

  private updateStarting(dt: number) {
    this.state.startingCountdown -= dt;
    if (this.state.startingCountdown <= 0) {
      this.state.phase = "ACTIVE";
      this.missionStartTime = Date.now();
      this.broadcast(MESSAGES.GAME_EVENT, { type: "mission_started" });
    }
  }

  private updateActive(dt: number) {
    this.state.timeRemaining -= dt;
    if (this.state.timeRemaining <= 0) {
      this.endMission(false);
      return;
    }

    this.updatePlayers(dt);
    this.updateMonster(dt);
    this.checkMissionEnd();
  }

  private updateExtraction(dt: number) {
    this.state.extractionCountdown -= dt;

    this.checkExtractionZone();

    this.updatePlayers(dt);
    this.updateMonster(dt);

    if (this.state.extractionCountdown <= 0) {
      this.endMission(this.combatSystem.getExtractedCount(this.state.players) > 0);
      return;
    }

    this.checkMissionEnd();
  }

  private updatePlayers(dt: number) {
    this.state.players.forEach((player) => {
      if (player.status === "alive") {
        this.movementSystem.updateFlashlight(player, dt);
      }
    });
    const eliminated = this.combatSystem.updateDownedPlayers(
      this.state.players,
      dt,
    );
    for (const id of eliminated) {
      const p = this.state.players.get(id);
      if (p) {
        this.inventorySystem.dropAllItems(p, this.state.items);
        this.broadcast(MESSAGES.GAME_EVENT, {
          type: "player_eliminated",
          playerId: id,
          playerName: p.name,
        });
      }
    }
  }

  private updateMonster(dt: number) {
    const elapsed = (Date.now() - this.missionStartTime) / 1000;
    this.aiSystem.update(this.state.monster, this.state.players, dt, elapsed);
    const { hitPlayerId } = this.aiSystem.getAttackResult(
      this.state.monster,
      this.state.players,
      dt,
    );
    if (hitPlayerId) {
      const target = this.state.players.get(hitPlayerId);
      if (target) {
        let damage = MONSTER.ATTACK_DAMAGE;
        if (this.state.difficulty === "hard") damage *= 1.5;
        if (this.state.difficulty === "nightmare") damage *= 2;
        this.combatSystem.applyDamage(target, damage);
        this.broadcast(MESSAGES.PLAYER_HIT, {
          playerId: hitPlayerId,
          damage,
          health: target.health,
        });
      }
    }
  }

  private checkExtractionZone() {
    const extractionZone = { x: 0, z: 24, radius: 6 };
    this.state.players.forEach((player) => {
      if (player.status !== "alive") return;
      const dist = getDistance(
        { x: player.x, y: 0, z: player.z },
        { x: extractionZone.x, y: 0, z: extractionZone.z },
      );
      if (dist <= extractionZone.radius) {
        player.status = "extracted";
        this.broadcast(MESSAGES.GAME_EVENT, {
          type: "player_extracted",
          playerId: player.id,
          playerName: player.name,
        });
      }
    });
  }

  private checkMissionEnd() {
    if (this.combatSystem.areAllPlayersDeadOrExtracted(this.state.players)) {
      const extracted = this.combatSystem.getExtractedCount(this.state.players);
      this.endMission(extracted > 0);
    }
  }

  private endMission(success: boolean) {
    this.state.phase = success ? "RESULTS" : "FAILED";

    const result = {
      success,
      duration: this.state.missionDuration - this.state.timeRemaining,
      objectivesCompleted: this.objectiveSystem.getCompletedCount(this.state),
      totalObjectives: OBJECTIVES.length,
      playersExtracted: this.combatSystem.getExtractedCount(this.state.players),
      totalPlayers: this.state.players.size,
      evidenceCollected: this.state.evidenceCollected,
    };

    this.broadcast(MESSAGES.GAME_EVENT, {
      type: "mission_ended",
      result,
    });

    this.clock.setTimeout(() => {
      this.resetToLobby();
    }, 15000);
  }

  private resetToLobby() {
    this.state.phase = "LOBBY";
    this.state.timeRemaining = this.state.missionDuration;
    this.state.extractionCountdown = GAME.EXTRACTION_COUNTDOWN;
    this.state.evidenceCollected = 0;
    this.state.items.clear();
    this.state.objectives.clear();
    this.state.doors.clear();
    this.state.monster = new MonsterState();

    this.state.players.forEach((player) => {
      const spawnIdx =
        Array.from(this.state.players.keys()).indexOf(player.id) %
        PLAYER_SPAWNS.length;
      const spawn = PLAYER_SPAWNS[spawnIdx];
      player.x = spawn.x;
      player.y = 0;
      player.z = spawn.z;
      player.health = PLAYER.MAX_HEALTH;
      player.stamina = PLAYER.MAX_STAMINA;
      player.flashlightBattery = PLAYER.MAX_FLASHLIGHT_BATTERY;
      player.flashlightOn = false;
      player.status = "alive";
      player.isReady = false;
      player.inventory.clear();
    });

    this.unlock();
    this.broadcast(MESSAGES.GAME_EVENT, { type: "returned_to_lobby" });
  }

  private findDisconnectedPlayer(name: string): PlayerState | null {
    let found: PlayerState | null = null;
    this.state.players.forEach((player) => {
      if (player.name === name && !player.isConnected) {
        found = player;
      }
    });
    return found;
  }

  private reconnectPlayer(client: Client, player: PlayerState) {
    const oldId = player.id;
    const timer = this.reconnectTimers.get(oldId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(oldId);
    }

    player.isConnected = true;
    if (player.status === "disconnected") {
      player.status = "alive";
    }

    this.broadcast(MESSAGES.GAME_EVENT, {
      type: "player_reconnected",
      playerName: player.name,
    });
  }

  private transferHostIfNeeded(leavingId: string) {
    if (this.state.hostId !== leavingId) return;
    let newHost: string | null = null;
    this.state.players.forEach((player) => {
      if (player.isConnected && !newHost) {
        newHost = player.id;
      }
    });
    if (newHost) {
      this.state.hostId = newHost;
    }
  }

  private checkRateLimit(player: PlayerState): boolean {
    const now = Date.now();
    if (now - player.moveRateWindowStart > 1000) {
      player.moveRateWindowStart = now;
      player.moveRateCount = 0;
    }
    player.moveRateCount++;
    return player.moveRateCount <= 60;
  }

  private cleanupRoom() {
    inviteCodeMap.delete(this.state.inviteCode);
    this.disconnect();
  }
}
