import { Schema, type } from "@colyseus/schema";

export class MonsterState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotY: number = 0;
  @type("string") behaviorState: string = "PATROL";

  targetPlayerId: string = "";
  currentWaypointIndex: number = 0;
  stateTimer: number = 0;
  attackCooldown: number = 0;
  investigateTarget: { x: number; z: number } | null = null;
  lastKnownPlayerPos: { x: number; z: number } | null = null;
  aggressionLevel: number = 1;
}
