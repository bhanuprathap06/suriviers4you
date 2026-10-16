export interface MoveInput {
  seq: number;
  dx: number;
  dz: number;
  rotY: number;
  isSprinting: boolean;
  isCrouching: boolean;
  timestamp: number;
}

export interface InteractMessage {
  targetId: string;
  targetType: "door" | "generator" | "fuse_box" | "extraction_panel" | "item";
}

export interface PickupMessage {
  itemId: string;
}

export interface DropMessage {
  itemId: string;
}

export interface UseItemMessage {
  itemId: string;
  targetId?: string;
}

export interface ReviveMessage {
  targetPlayerId: string;
}

export interface ReadyMessage {
  isReady: boolean;
}

export interface StartGameMessage {
  config?: {
    difficulty?: "normal" | "hard" | "nightmare";
    missionDuration?: number;
  };
}

export interface ChatMessage {
  text: string;
}

export interface CreateRoomOptions {
  playerName: string;
  config?: {
    maxPlayers?: number;
    difficulty?: "normal" | "hard" | "nightmare";
    missionDuration?: number;
  };
}

export interface JoinRoomOptions {
  playerName: string;
  inviteCode?: string;
}
