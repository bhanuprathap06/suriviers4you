import { create } from "zustand";
import type { GamePhase, PlayerStatus, MatchResult, Vec3 } from "@blacksite/shared";

export interface PlayerData {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  health: number;
  stamina: number;
  flashlightBattery: number;
  flashlightOn: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  status: PlayerStatus;
  downedTimer: number;
  isReady: boolean;
  inventory: string[];
}

export interface ItemData {
  id: string;
  itemType: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  heldBy: string;
}

export interface MonsterData {
  x: number;
  y: number;
  z: number;
  rotY: number;
  behaviorState: string;
}

export interface ObjectiveData {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedBy: string;
}

export interface DoorData {
  id: string;
  state: string;
  locked: boolean;
  requiresKey: string;
  x: number;
  z: number;
  rotation: number;
  width: number;
}

export interface GameStore {
  phase: GamePhase;
  inviteCode: string;
  hostId: string;
  timeRemaining: number;
  extractionCountdown: number;
  difficulty: string;
  evidenceCollected: number;
  evidenceRequired: number;
  localPlayerId: string;
  localPlayerName: string;
  players: Map<string, PlayerData>;
  items: Map<string, ItemData>;
  objectives: Map<string, ObjectiveData>;
  doors: Map<string, DoorData>;
  monster: MonsterData;
  matchResult: MatchResult | null;
  events: Array<{ type: string; message: string; timestamp: number }>;

  setPhase: (phase: GamePhase) => void;
  setInviteCode: (code: string) => void;
  setHostId: (id: string) => void;
  setTimeRemaining: (time: number) => void;
  setExtractionCountdown: (time: number) => void;
  setLocalPlayer: (id: string, name: string) => void;
  updatePlayer: (id: string, data: Partial<PlayerData>) => void;
  removePlayer: (id: string) => void;
  setPlayers: (players: Map<string, PlayerData>) => void;
  updateItem: (id: string, data: Partial<ItemData>) => void;
  setItems: (items: Map<string, ItemData>) => void;
  updateObjective: (id: string, data: Partial<ObjectiveData>) => void;
  setObjectives: (objectives: Map<string, ObjectiveData>) => void;
  updateDoor: (id: string, data: Partial<DoorData>) => void;
  setDoors: (doors: Map<string, DoorData>) => void;
  setMonster: (data: MonsterData) => void;
  setMatchResult: (result: MatchResult | null) => void;
  addEvent: (type: string, message: string) => void;
  reset: () => void;
}

const initialMonster: MonsterData = {
  x: 0,
  y: 0,
  z: 24,
  rotY: 0,
  behaviorState: "PATROL",
};

export const useGameStore = create<GameStore>((set) => ({
  phase: "LOBBY" as GamePhase,
  inviteCode: "",
  hostId: "",
  timeRemaining: 600,
  extractionCountdown: 60,
  difficulty: "normal",
  evidenceCollected: 0,
  evidenceRequired: 3,
  localPlayerId: "",
  localPlayerName: "",
  players: new Map(),
  items: new Map(),
  objectives: new Map(),
  doors: new Map(),
  monster: initialMonster,
  matchResult: null,
  events: [],

  setPhase: (phase) => set({ phase }),
  setInviteCode: (code) => set({ inviteCode: code }),
  setHostId: (id) => set({ hostId: id }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setExtractionCountdown: (time) => set({ extractionCountdown: time }),
  setLocalPlayer: (id, name) =>
    set({ localPlayerId: id, localPlayerName: name }),
  updatePlayer: (id, data) =>
    set((state) => {
      const players = new Map(state.players);
      const existing = players.get(id) || ({} as PlayerData);
      players.set(id, { ...existing, ...data } as PlayerData);
      return { players };
    }),
  removePlayer: (id) =>
    set((state) => {
      const players = new Map(state.players);
      players.delete(id);
      return { players };
    }),
  setPlayers: (players) => set({ players }),
  updateItem: (id, data) =>
    set((state) => {
      const items = new Map(state.items);
      const existing = items.get(id) || ({} as ItemData);
      items.set(id, { ...existing, ...data } as ItemData);
      return { items };
    }),
  setItems: (items) => set({ items }),
  updateObjective: (id, data) =>
    set((state) => {
      const objectives = new Map(state.objectives);
      const existing = objectives.get(id) || ({} as ObjectiveData);
      objectives.set(id, { ...existing, ...data } as ObjectiveData);
      return { objectives };
    }),
  setObjectives: (objectives) => set({ objectives }),
  updateDoor: (id, data) =>
    set((state) => {
      const doors = new Map(state.doors);
      const existing = doors.get(id) || ({} as DoorData);
      doors.set(id, { ...existing, ...data } as DoorData);
      return { doors };
    }),
  setDoors: (doors) => set({ doors }),
  setMonster: (data) => set({ monster: data }),
  setMatchResult: (result) => set({ matchResult: result }),
  addEvent: (type, message) =>
    set((state) => ({
      events: [
        ...state.events.slice(-49),
        { type, message, timestamp: Date.now() },
      ],
    })),
  reset: () =>
    set({
      phase: "LOBBY" as GamePhase,
      inviteCode: "",
      hostId: "",
      timeRemaining: 600,
      extractionCountdown: 60,
      localPlayerId: "",
      players: new Map(),
      items: new Map(),
      objectives: new Map(),
      doors: new Map(),
      monster: initialMonster,
      matchResult: null,
      events: [],
    }),
}));
