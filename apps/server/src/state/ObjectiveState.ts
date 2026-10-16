import { Schema, type } from "@colyseus/schema";

export class ObjectiveState extends Schema {
  @type("string") id: string = "";
  @type("string") label: string = "";
  @type("string") description: string = "";
  @type("boolean") completed: boolean = false;
  @type("string") completedBy: string = "";
}
