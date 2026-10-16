import type { Vec3, ItemType, ObjectiveId } from "../types/game.js";

export interface RoomDef {
  id: string;
  label: string;
  center: Vec3;
  size: Vec3;
  color: string;
  emissiveColor?: string;
  lightIntensity?: number;
}

export interface DoorDef {
  id: string;
  position: Vec3;
  rotation: number;
  width: number;
  requiresKey?: string;
  startsLocked: boolean;
}

export interface ItemSpawn {
  id: string;
  type: ItemType;
  position: Vec3;
  room: string;
}

export interface ObjectiveDef {
  id: ObjectiveId;
  label: string;
  description: string;
  position: Vec3;
  room: string;
  prerequisites: ObjectiveId[];
  requiredItem?: ItemType;
}

export interface Waypoint {
  position: Vec3;
  connections: number[];
}

export const ROOMS: RoomDef[] = [
  {
    id: "airlock",
    label: "Airlock",
    center: { x: 0, y: 2, z: -24 },
    size: { x: 10, y: 4, z: 10 },
    color: "#1a1a2e",
    lightIntensity: 0.6,
  },
  {
    id: "corridor_south",
    label: "South Corridor",
    center: { x: 0, y: 2, z: -15 },
    size: { x: 4, y: 4, z: 8 },
    color: "#16213e",
    lightIntensity: 0.3,
  },
  {
    id: "main_hall",
    label: "Main Hall",
    center: { x: 0, y: 2, z: -2 },
    size: { x: 20, y: 4, z: 18 },
    color: "#0f3460",
    emissiveColor: "#1a0000",
    lightIntensity: 0.4,
  },
  {
    id: "corridor_west",
    label: "West Corridor",
    center: { x: -14, y: 2, z: -2 },
    size: { x: 8, y: 4, z: 4 },
    color: "#16213e",
    lightIntensity: 0.2,
  },
  {
    id: "generator_room",
    label: "Generator Room",
    center: { x: -26, y: 2, z: -2 },
    size: { x: 14, y: 4, z: 12 },
    color: "#1a1a2e",
    emissiveColor: "#0a0a00",
    lightIntensity: 0.3,
  },
  {
    id: "corridor_east",
    label: "East Corridor",
    center: { x: 14, y: 2, z: -2 },
    size: { x: 8, y: 4, z: 4 },
    color: "#16213e",
    lightIntensity: 0.2,
  },
  {
    id: "laboratory",
    label: "Laboratory",
    center: { x: 28, y: 2, z: -2 },
    size: { x: 14, y: 4, z: 14 },
    color: "#1a2a1a",
    emissiveColor: "#001a00",
    lightIntensity: 0.35,
  },
  {
    id: "corridor_nw",
    label: "NW Corridor",
    center: { x: -14, y: 2, z: 8 },
    size: { x: 4, y: 4, z: 6 },
    color: "#16213e",
    lightIntensity: 0.15,
  },
  {
    id: "storage",
    label: "Storage",
    center: { x: -26, y: 2, z: 14 },
    size: { x: 12, y: 4, z: 10 },
    color: "#2a1a0a",
    lightIntensity: 0.25,
  },
  {
    id: "corridor_ne",
    label: "NE Corridor",
    center: { x: 14, y: 2, z: 8 },
    size: { x: 4, y: 4, z: 6 },
    color: "#16213e",
    lightIntensity: 0.15,
  },
  {
    id: "containment",
    label: "Containment Zone",
    center: { x: 28, y: 2, z: 14 },
    size: { x: 12, y: 4, z: 10 },
    color: "#2e1a1a",
    emissiveColor: "#1a0000",
    lightIntensity: 0.2,
  },
  {
    id: "corridor_north",
    label: "North Corridor",
    center: { x: 0, y: 2, z: 12 },
    size: { x: 4, y: 4, z: 8 },
    color: "#16213e",
    lightIntensity: 0.2,
  },
  {
    id: "extraction",
    label: "Extraction Chamber",
    center: { x: 0, y: 2, z: 24 },
    size: { x: 14, y: 4, z: 12 },
    color: "#1a1a2e",
    emissiveColor: "#000a1a",
    lightIntensity: 0.4,
  },
];

export const DOORS: DoorDef[] = [
  {
    id: "door_airlock",
    position: { x: 0, y: 0, z: -19 },
    rotation: 0,
    width: 4,
    startsLocked: false,
  },
  {
    id: "door_west",
    position: { x: -10, y: 0, z: -2 },
    rotation: Math.PI / 2,
    width: 4,
    startsLocked: false,
  },
  {
    id: "door_east",
    position: { x: 10, y: 0, z: -2 },
    rotation: Math.PI / 2,
    width: 4,
    requiresKey: "access_card",
    startsLocked: true,
  },
  {
    id: "door_north",
    position: { x: 0, y: 0, z: 7 },
    rotation: 0,
    width: 4,
    startsLocked: false,
  },
  {
    id: "door_extraction",
    position: { x: 0, y: 0, z: 18 },
    rotation: 0,
    width: 4,
    startsLocked: true,
  },
  {
    id: "door_containment",
    position: { x: 28, y: 0, z: 9 },
    rotation: 0,
    width: 4,
    startsLocked: false,
  },
  {
    id: "door_storage",
    position: { x: -26, y: 0, z: 9 },
    rotation: 0,
    width: 4,
    startsLocked: false,
  },
];

export const ITEM_SPAWNS: ItemSpawn[] = [
  { id: "fuse_1", type: "fuse", position: { x: -28, y: 0.5, z: 16 }, room: "storage" },
  { id: "fuse_2", type: "fuse", position: { x: -14, y: 0.5, z: -2 }, room: "corridor_west" },
  { id: "battery_1", type: "battery", position: { x: 3, y: 0.5, z: -22 }, room: "airlock" },
  { id: "battery_2", type: "battery", position: { x: -24, y: 0.5, z: -4 }, room: "generator_room" },
  { id: "battery_3", type: "battery", position: { x: 6, y: 0.5, z: 4 }, room: "main_hall" },
  { id: "medkit_1", type: "medkit", position: { x: -4, y: 0.5, z: -22 }, room: "airlock" },
  { id: "medkit_2", type: "medkit", position: { x: 8, y: 0.5, z: -6 }, room: "main_hall" },
  { id: "medkit_3", type: "medkit", position: { x: -22, y: 0.5, z: 12 }, room: "storage" },
  { id: "access_card", type: "access_card", position: { x: 30, y: 0.5, z: 16 }, room: "containment" },
  { id: "evidence_1", type: "evidence", position: { x: 24, y: 0.5, z: -4 }, room: "laboratory" },
  { id: "evidence_2", type: "evidence", position: { x: 30, y: 0.5, z: 0 }, room: "laboratory" },
  { id: "evidence_3", type: "evidence", position: { x: 26, y: 0.5, z: -6 }, room: "laboratory" },
  { id: "core", type: "core", position: { x: 28, y: 0.8, z: -2 }, room: "laboratory" },
];

export const OBJECTIVES: ObjectiveDef[] = [
  {
    id: "restore_generator",
    label: "Restore Power",
    description: "Insert a fuse into the generator to restore power",
    position: { x: -30, y: 1, z: -2 },
    room: "generator_room",
    prerequisites: [],
    requiredItem: "fuse",
  },
  {
    id: "find_access_card",
    label: "Find Access Card",
    description: "Locate the access card in the containment zone",
    position: { x: 30, y: 1, z: 16 },
    room: "containment",
    prerequisites: [],
  },
  {
    id: "unlock_laboratory",
    label: "Unlock Laboratory",
    description: "Use the access card to unlock the laboratory",
    position: { x: 10, y: 1, z: -2 },
    room: "corridor_east",
    prerequisites: ["find_access_card"],
    requiredItem: "access_card",
  },
  {
    id: "collect_evidence",
    label: "Collect Evidence",
    description: "Gather 3 evidence samples from the laboratory",
    position: { x: 28, y: 1, z: -2 },
    room: "laboratory",
    prerequisites: ["unlock_laboratory"],
  },
  {
    id: "retrieve_core",
    label: "Retrieve Experimental Core",
    description: "Take the experimental core from the laboratory",
    position: { x: 28, y: 1, z: -2 },
    room: "laboratory",
    prerequisites: ["collect_evidence"],
  },
  {
    id: "activate_extraction",
    label: "Activate Extraction",
    description: "Insert the core into the extraction panel to begin extraction",
    position: { x: 0, y: 1, z: 26 },
    room: "extraction",
    prerequisites: ["retrieve_core"],
    requiredItem: "core",
  },
];

export const PLAYER_SPAWNS: Vec3[] = [
  { x: -3, y: 0, z: -24 },
  { x: 3, y: 0, z: -24 },
  { x: -3, y: 0, z: -26 },
  { x: 3, y: 0, z: -26 },
  { x: -1, y: 0, z: -22 },
  { x: 1, y: 0, z: -22 },
  { x: -1, y: 0, z: -26 },
  { x: 1, y: 0, z: -26 },
];

export const MONSTER_SPAWN: Vec3 = { x: 0, y: 0, z: 24 };

export const MONSTER_WAYPOINTS: Waypoint[] = [
  { position: { x: 0, y: 0, z: 0 }, connections: [1, 2, 3, 4] },
  { position: { x: -14, y: 0, z: -2 }, connections: [0, 5] },
  { position: { x: 14, y: 0, z: -2 }, connections: [0, 6] },
  { position: { x: 0, y: 0, z: 12 }, connections: [0, 7] },
  { position: { x: 0, y: 0, z: -15 }, connections: [0] },
  { position: { x: -26, y: 0, z: -2 }, connections: [1, 8] },
  { position: { x: 28, y: 0, z: -2 }, connections: [2, 9] },
  { position: { x: 0, y: 0, z: 24 }, connections: [3] },
  { position: { x: -26, y: 0, z: 14 }, connections: [5] },
  { position: { x: 28, y: 0, z: 14 }, connections: [6] },
];

export function isPointInRoom(px: number, pz: number, room: RoomDef): boolean {
  const halfX = room.size.x / 2;
  const halfZ = room.size.z / 2;
  return (
    px >= room.center.x - halfX &&
    px <= room.center.x + halfX &&
    pz >= room.center.z - halfZ &&
    pz <= room.center.z + halfZ
  );
}

export function isPointWalkable(px: number, pz: number): boolean {
  return ROOMS.some((room) => isPointInRoom(px, pz, room));
}

export function getDistanceSq(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function getDistance(a: Vec3, b: Vec3): number {
  return Math.sqrt(getDistanceSq(a, b));
}
