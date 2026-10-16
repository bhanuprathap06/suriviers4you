import { Schema, type, ArraySchema } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotY: number = 0;
  @type("number") health: number = 100;
  @type("number") stamina: number = 100;
  @type("number") flashlightBattery: number = 100;
  @type("boolean") flashlightOn: boolean = false;
  @type("boolean") isCrouching: boolean = false;
  @type("boolean") isSprinting: boolean = false;
  @type("string") status: string = "alive";
  @type("number") downedTimer: number = 0;
  @type("boolean") isReady: boolean = false;
  @type(["string"]) inventory = new ArraySchema<string>();

  lastInputSeq: number = 0;
  lastInputTime: number = 0;
  moveRateCount: number = 0;
  moveRateWindowStart: number = 0;
  reconnectTimer: number = 0;
  isConnected: boolean = true;
  noiseLevel: number = 0;
}
