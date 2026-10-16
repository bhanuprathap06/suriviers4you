import { Schema, type } from "@colyseus/schema";

export class DoorStateSchema extends Schema {
  @type("string") id: string = "";
  @type("string") state: string = "closed";
  @type("boolean") locked: boolean = false;
  @type("string") requiresKey: string = "";
  @type("number") x: number = 0;
  @type("number") z: number = 0;
  @type("number") rotation: number = 0;
  @type("number") width: number = 4;
}
