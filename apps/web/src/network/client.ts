import { Client, Room } from "colyseus.js";
import { useGameStore } from "../store/gameStore";
import type {
  PlayerData,
  ItemData,
  ObjectiveData,
  DoorData,
} from "../store/gameStore";
import { MESSAGES } from "@blacksite/shared";
import type { GamePhase, PlayerStatus } from "@blacksite/shared";

const SERVER_URL =
  import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:2567`;

const HTTP_SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  `${window.location.protocol}//${window.location.hostname}:2567`;

let client: Client | null = null;
let room: Room | null = null;
let inputSeq = 0;

export function getClient(): Client {
  if (!client) {
    client = new Client(SERVER_URL);
  }
  return client;
}

export function getRoom(): Room | null {
  return room;
}

export async function createRoom(
  playerName: string,
  options?: { difficulty?: string; missionDuration?: number },
): Promise<Room> {
  const c = getClient();
  room = await c.create("game_room", {
    playerName,
    ...options,
  });
  setupRoomListeners(room, playerName);
  return room;
}

export async function joinRoomByCode(
  inviteCode: string,
  playerName: string,
): Promise<Room> {
  const response = await fetch(
    `${HTTP_SERVER_URL}/api/room/${inviteCode.toUpperCase()}`,
  );
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to find room");
  }
  const { roomId } = await response.json();
  const c = getClient();
  room = await c.joinById(roomId, { playerName });
  setupRoomListeners(room, playerName);
  return room;
}

export function sendMove(
  dx: number,
  dz: number,
  rotY: number,
  isSprinting: boolean,
  isCrouching: boolean,
) {
  if (!room) return;
  inputSeq++;
  room.send(MESSAGES.MOVE, {
    seq: inputSeq,
    dx,
    dz,
    rotY,
    isSprinting,
    isCrouching,
    timestamp: Date.now(),
  });
}

export function sendInteract(targetId: string, targetType: string) {
  room?.send(MESSAGES.INTERACT, { targetId, targetType });
}

export function sendPickup(itemId: string) {
  room?.send(MESSAGES.PICKUP, { itemId });
}

export function sendDrop(itemId: string) {
  room?.send(MESSAGES.DROP, { itemId });
}

export function sendUseItem(itemId: string) {
  room?.send(MESSAGES.USE_ITEM, { itemId });
}

export function sendRevive(targetPlayerId: string) {
  room?.send(MESSAGES.REVIVE, { targetPlayerId });
}

export function sendReady(isReady: boolean) {
  room?.send(MESSAGES.READY, { isReady });
}

export function sendStartGame(config?: {
  difficulty?: string;
  missionDuration?: number;
}) {
  room?.send(MESSAGES.START_GAME, { config });
}

export function sendToggleFlashlight() {
  room?.send(MESSAGES.TOGGLE_FLASHLIGHT, {});
}

export function leaveRoom() {
  room?.leave();
  room = null;
  useGameStore.getState().reset();
}

function setupRoomListeners(r: Room, playerName: string) {
  const store = useGameStore.getState();

  store.setLocalPlayer(r.sessionId, playerName);

  r.state.listen("phase", (value: string) => {
    useGameStore.getState().setPhase(value as GamePhase);
  });

  r.state.listen("inviteCode", (value: string) => {
    useGameStore.getState().setInviteCode(value);
  });

  r.state.listen("hostId", (value: string) => {
    useGameStore.getState().setHostId(value);
  });

  r.state.listen("timeRemaining", (value: number) => {
    useGameStore.getState().setTimeRemaining(value);
  });

  r.state.listen("extractionCountdown", (value: number) => {
    useGameStore.getState().setExtractionCountdown(value);
  });

  r.state.listen("evidenceCollected", (value: number) => {
    useGameStore.setState({ evidenceCollected: value });
  });

  r.state.players.onAdd((player: any, key: string) => {
    const pd = extractPlayerData(player);
    useGameStore.getState().updatePlayer(key, pd);

    player.onChange(() => {
      const pd = extractPlayerData(player);
      useGameStore.getState().updatePlayer(key, pd);
    });
  });

  r.state.players.onRemove((_player: any, key: string) => {
    useGameStore.getState().removePlayer(key);
  });

  r.state.items.onAdd((item: any, key: string) => {
    const id = extractItemData(item);
    useGameStore.getState().updateItem(key, id);

    item.onChange(() => {
      const id = extractItemData(item);
      useGameStore.getState().updateItem(key, id);
    });
  });

  r.state.objectives.onAdd((obj: any, key: string) => {
    const od = extractObjectiveData(obj);
    useGameStore.getState().updateObjective(key, od);

    obj.onChange(() => {
      const od = extractObjectiveData(obj);
      useGameStore.getState().updateObjective(key, od);
    });
  });

  r.state.doors.onAdd((door: any, key: string) => {
    const dd = extractDoorData(door);
    useGameStore.getState().updateDoor(key, dd);

    door.onChange(() => {
      const dd = extractDoorData(door);
      useGameStore.getState().updateDoor(key, dd);
    });
  });

  r.state.monster.onChange(() => {
    useGameStore.getState().setMonster({
      x: r.state.monster.x,
      y: r.state.monster.y,
      z: r.state.monster.z,
      rotY: r.state.monster.rotY,
      behaviorState: r.state.monster.behaviorState,
    });
  });

  r.onMessage(MESSAGES.GAME_EVENT, (data: any) => {
    const store = useGameStore.getState();
    switch (data.type) {
      case "mission_ended":
        store.setMatchResult(data.result);
        break;
      case "extraction_activated":
        store.addEvent("alert", "EXTRACTION ACTIVATED! Get to the extraction zone!");
        break;
      case "player_extracted":
        store.addEvent("success", `${data.playerName} extracted!`);
        break;
      case "player_eliminated":
        store.addEvent("danger", `${data.playerName} eliminated!`);
        break;
      case "player_joined":
        store.addEvent("info", `${data.playerName} joined`);
        break;
      case "player_left":
        store.addEvent("info", `${data.playerName} left`);
        break;
      case "player_disconnected":
        store.addEvent("warning", `${data.playerName} disconnected`);
        break;
      case "player_reconnected":
        store.addEvent("info", `${data.playerName} reconnected`);
        break;
      case "player_revived":
        store.addEvent("success", "Player revived!");
        break;
      case "mission_starting":
        store.addEvent("alert", "Mission starting...");
        break;
      case "mission_started":
        store.addEvent("alert", "Mission active! Complete objectives and extract.");
        break;
    }
  });

  r.onMessage(MESSAGES.OBJECTIVE_UPDATE, (data: any) => {
    const store = useGameStore.getState();
    if (data.message) {
      store.addEvent("objective", data.message);
    }
  });

  r.onMessage(MESSAGES.PLAYER_HIT, (data: any) => {
    if (data.playerId === r.sessionId) {
      useGameStore.getState().addEvent("danger", `Hit! Health: ${Math.round(data.health)}`);
    }
  });

  r.onError((code, message) => {
    console.error("Room error:", code, message);
    useGameStore.getState().addEvent("error", `Connection error: ${message}`);
  });

  r.onLeave((code) => {
    console.log("Left room:", code);
    if (code > 1000) {
      useGameStore.getState().addEvent("error", "Disconnected from server");
    }
  });
}

function extractPlayerData(player: any): PlayerData {
  return {
    id: player.id,
    name: player.name,
    x: player.x,
    y: player.y,
    z: player.z,
    rotY: player.rotY,
    health: player.health,
    stamina: player.stamina,
    flashlightBattery: player.flashlightBattery,
    flashlightOn: player.flashlightOn,
    isCrouching: player.isCrouching,
    isSprinting: player.isSprinting,
    status: player.status as PlayerStatus,
    downedTimer: player.downedTimer,
    isReady: player.isReady,
    inventory: player.inventory ? Array.from(player.inventory) : [],
  };
}

function extractItemData(item: any): ItemData {
  return {
    id: item.id,
    itemType: item.itemType,
    x: item.x,
    y: item.y,
    z: item.z,
    collected: item.collected,
    heldBy: item.heldBy,
  };
}

function extractObjectiveData(obj: any): ObjectiveData {
  return {
    id: obj.id,
    label: obj.label,
    description: obj.description,
    completed: obj.completed,
    completedBy: obj.completedBy,
  };
}

function extractDoorData(door: any): DoorData {
  return {
    id: door.id,
    state: door.state,
    locked: door.locked,
    requiresKey: door.requiresKey,
    x: door.x,
    z: door.z,
    rotation: door.rotation,
    width: door.width,
  };
}
