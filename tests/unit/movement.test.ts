import { describe, it, expect } from "vitest";
import { isPointWalkable, isPointInRoom, getDistance, ROOMS, PLAYER_SPAWNS } from "@blacksite/shared";

describe("Facility layout", () => {
  it("player spawns should be inside walkable area", () => {
    for (const spawn of PLAYER_SPAWNS) {
      expect(isPointWalkable(spawn.x, spawn.z)).toBe(true);
    }
  });

  it("isPointInRoom returns true for room centers", () => {
    for (const room of ROOMS) {
      expect(isPointInRoom(room.center.x, room.center.z, room)).toBe(true);
    }
  });

  it("isPointWalkable returns false for points outside facility", () => {
    expect(isPointWalkable(100, 100)).toBe(false);
    expect(isPointWalkable(-100, -100)).toBe(false);
  });

  it("getDistance calculates correctly", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3, y: 0, z: 4 };
    expect(getDistance(a, b)).toBeCloseTo(5, 5);
  });

  it("getDistance is zero for same point", () => {
    const a = { x: 5, y: 0, z: 10 };
    expect(getDistance(a, a)).toBe(0);
  });
});

describe("Constants", () => {
  it("ROOMS array has 13 rooms", () => {
    expect(ROOMS.length).toBe(13);
  });

  it("all rooms have required fields", () => {
    for (const room of ROOMS) {
      expect(room.id).toBeTruthy();
      expect(room.center).toBeDefined();
      expect(room.size).toBeDefined();
      expect(room.size.x).toBeGreaterThan(0);
      expect(room.size.z).toBeGreaterThan(0);
    }
  });
});
