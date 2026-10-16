import { describe, it, expect } from "vitest";
import { OBJECTIVES, ITEM_SPAWNS, DOORS } from "@blacksite/shared";

describe("Objectives", () => {
  it("has 6 objectives", () => {
    expect(OBJECTIVES.length).toBe(6);
  });

  it("first objective has no prerequisites", () => {
    const first = OBJECTIVES.find((o) => o.id === "restore_generator");
    expect(first).toBeDefined();
    expect(first!.prerequisites.length).toBe(0);
  });

  it("final objective requires retrieve_core", () => {
    const last = OBJECTIVES.find((o) => o.id === "activate_extraction");
    expect(last).toBeDefined();
    expect(last!.prerequisites).toContain("retrieve_core");
  });

  it("objective chain is sequential", () => {
    const ids = OBJECTIVES.map((o) => o.id);
    expect(ids).toEqual([
      "restore_generator",
      "find_access_card",
      "unlock_laboratory",
      "collect_evidence",
      "retrieve_core",
      "activate_extraction",
    ]);
  });

  it("all required items exist in item spawns", () => {
    for (const obj of OBJECTIVES) {
      if (obj.requiredItem) {
        const itemExists = ITEM_SPAWNS.some((s) => s.type === obj.requiredItem);
        expect(itemExists).toBe(true);
      }
    }
  });
});

describe("Items", () => {
  it("has correct number of item spawns", () => {
    expect(ITEM_SPAWNS.length).toBe(13);
  });

  it("has 3 evidence items", () => {
    const evidence = ITEM_SPAWNS.filter((i) => i.type === "evidence");
    expect(evidence.length).toBe(3);
  });

  it("has 1 access card", () => {
    const cards = ITEM_SPAWNS.filter((i) => i.type === "access_card");
    expect(cards.length).toBe(1);
  });
});

describe("Doors", () => {
  it("has 7 doors", () => {
    expect(DOORS.length).toBe(7);
  });

  it("east door starts locked and requires access_card", () => {
    const eastDoor = DOORS.find((d) => d.id === "door_east");
    expect(eastDoor).toBeDefined();
    expect(eastDoor!.startsLocked).toBe(true);
    expect(eastDoor!.requiresKey).toBe("access_card");
  });

  it("extraction door starts locked", () => {
    const extractionDoor = DOORS.find((d) => d.id === "door_extraction");
    expect(extractionDoor).toBeDefined();
    expect(extractionDoor!.startsLocked).toBe(true);
  });
});
