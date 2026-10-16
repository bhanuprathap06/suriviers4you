export type GamePhase =
  | "LOBBY"
  | "STARTING"
  | "ACTIVE"
  | "EXTRACTION"
  | "RESULTS"
  | "FAILED";

export type PlayerStatus =
  | "alive"
  | "downed"
  | "eliminated"
  | "extracted"
  | "disconnected";

export type ItemType =
  | "battery"
  | "fuse"
  | "medkit"
  | "access_card"
  | "evidence"
  | "core";

export type ObjectiveId =
  | "restore_generator"
  | "find_access_card"
  | "unlock_laboratory"
  | "collect_evidence"
  | "retrieve_core"
  | "activate_extraction";

export type MonsterBehavior =
  | "PATROL"
  | "INVESTIGATE"
  | "SEARCH"
  | "CHASE"
  | "ATTACK"
  | "RETURN";

export type DoorState = "locked" | "unlocked" | "open" | "closed";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface RoomConfig {
  maxPlayers: number;
  minPlayers: number;
  missionDuration: number;
  difficulty: "normal" | "hard" | "nightmare";
}

export interface MatchResult {
  success: boolean;
  duration: number;
  objectivesCompleted: number;
  totalObjectives: number;
  playersExtracted: number;
  totalPlayers: number;
  evidenceCollected: number;
}
