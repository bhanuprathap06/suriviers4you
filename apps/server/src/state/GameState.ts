import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { ItemState } from "./ItemState";
import { MonsterState } from "./MonsterState";
import { ObjectiveState } from "./ObjectiveState";
import { DoorStateSchema } from "./DoorState";

export class GameState extends Schema {
  @type("string") phase: string = "LOBBY";
  @type("string") inviteCode: string = "";
  @type("string") hostId: string = "";
  @type("number") timeRemaining: number = 600;
  @type("number") extractionCountdown: number = 60;
  @type("number") startingCountdown: number = 5;
  @type("string") difficulty: string = "normal";
  @type("number") missionDuration: number = 600;
  @type("number") evidenceCollected: number = 0;
  @type("number") evidenceRequired: number = 3;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: ItemState }) items = new MapSchema<ItemState>();
  @type({ map: ObjectiveState }) objectives = new MapSchema<ObjectiveState>();
  @type({ map: DoorStateSchema }) doors = new MapSchema<DoorStateSchema>();
  @type(MonsterState) monster = new MonsterState();
}
