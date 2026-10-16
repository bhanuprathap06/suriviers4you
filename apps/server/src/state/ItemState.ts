import { Schema, type } from "@colyseus/schema";

export class ItemState extends Schema {
  @type("string") id: string = "";
  @type("string") itemType: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("boolean") collected: boolean = false;
  @type("string") heldBy: string = "";
}
