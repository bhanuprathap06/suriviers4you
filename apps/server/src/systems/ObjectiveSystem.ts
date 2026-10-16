import { GameState } from "../state/GameState";
import { PlayerState } from "../state/PlayerState";
import { ObjectiveState } from "../state/ObjectiveState";
import { InventorySystem } from "./InventorySystem";
import { OBJECTIVES, GAME, getDistance } from "@blacksite/shared";
import type { ObjectiveId } from "@blacksite/shared";

export class ObjectiveSystem {
  private inventorySystem: InventorySystem;

  constructor(inventorySystem: InventorySystem) {
    this.inventorySystem = inventorySystem;
  }

  initObjectives(state: GameState): void {
    for (const obj of OBJECTIVES) {
      const objective = new ObjectiveState();
      objective.id = obj.id;
      objective.label = obj.label;
      objective.description = obj.description;
      state.objectives.set(obj.id, objective);
    }
  }

  attemptObjective(
    state: GameState,
    player: PlayerState,
    objectiveId: string,
  ): { success: boolean; message: string } {
    const objective = state.objectives.get(objectiveId);
    if (!objective) return { success: false, message: "Unknown objective" };
    if (objective.completed)
      return { success: false, message: "Already completed" };

    const def = OBJECTIVES.find((o) => o.id === objectiveId);
    if (!def) return { success: false, message: "Invalid objective" };

    const dist = getDistance(
      { x: player.x, y: 0, z: player.z },
      def.position,
    );
    if (dist > 5) return { success: false, message: "Too far away" };

    for (const prereq of def.prerequisites) {
      const prereqObj = state.objectives.get(prereq);
      if (!prereqObj || !prereqObj.completed) {
        return { success: false, message: `Prerequisite not met: ${prereq}` };
      }
    }

    if (def.requiredItem) {
      if (
        !this.inventorySystem.hasItem(player, def.requiredItem, state.items)
      ) {
        return { success: false, message: `Requires: ${def.requiredItem}` };
      }
    }

    return this.completeObjective(state, player, objectiveId as ObjectiveId, def);
  }

  private completeObjective(
    state: GameState,
    player: PlayerState,
    objectiveId: ObjectiveId,
    def: (typeof OBJECTIVES)[number],
  ): { success: boolean; message: string } {
    const objective = state.objectives.get(objectiveId)!;

    switch (objectiveId) {
      case "restore_generator":
        this.inventorySystem.removeItemByType(player, "fuse", state.items);
        objective.completed = true;
        objective.completedBy = player.id;
        return { success: true, message: "Generator restored!" };

      case "find_access_card":
        if (
          this.inventorySystem.hasItem(player, "access_card", state.items)
        ) {
          objective.completed = true;
          objective.completedBy = player.id;
          return { success: true, message: "Access card found!" };
        }
        return { success: false, message: "Pick up the access card first" };

      case "unlock_laboratory":
        this.inventorySystem.removeItemByType(
          player,
          "access_card",
          state.items,
        );
        objective.completed = true;
        objective.completedBy = player.id;
        const eastDoor = state.doors.get("door_east");
        if (eastDoor) {
          eastDoor.locked = false;
          eastDoor.state = "open";
        }
        return { success: true, message: "Laboratory unlocked!" };

      case "collect_evidence":
        const collected = this.countCollectedEvidence(state);
        if (collected >= GAME.EVIDENCE_REQUIRED) {
          state.evidenceCollected = collected;
          objective.completed = true;
          objective.completedBy = player.id;
          return { success: true, message: "All evidence collected!" };
        }
        state.evidenceCollected = collected;
        return {
          success: false,
          message: `Evidence: ${collected}/${GAME.EVIDENCE_REQUIRED}`,
        };

      case "retrieve_core":
        if (this.inventorySystem.hasItem(player, "core", state.items)) {
          objective.completed = true;
          objective.completedBy = player.id;
          return { success: true, message: "Experimental core retrieved!" };
        }
        return { success: false, message: "Pick up the experimental core first" };

      case "activate_extraction":
        this.inventorySystem.removeItemByType(player, "core", state.items);
        objective.completed = true;
        objective.completedBy = player.id;
        const extractDoor = state.doors.get("door_extraction");
        if (extractDoor) {
          extractDoor.locked = false;
          extractDoor.state = "open";
        }
        return {
          success: true,
          message: "Extraction activated! Get to the extraction zone!",
        };

      default:
        return { success: false, message: "Unknown objective" };
    }
  }

  private countCollectedEvidence(state: GameState): number {
    let count = 0;
    state.items.forEach((item) => {
      if (item.itemType === "evidence" && item.collected) {
        count++;
      }
    });
    return count;
  }

  getCompletedCount(state: GameState): number {
    let count = 0;
    state.objectives.forEach((obj) => {
      if (obj.completed) count++;
    });
    return count;
  }

  isExtractionActive(state: GameState): boolean {
    const extractionObj = state.objectives.get("activate_extraction");
    return extractionObj?.completed === true;
  }

  getCurrentObjective(state: GameState): ObjectiveState | null {
    for (const obj of OBJECTIVES) {
      const stateObj = state.objectives.get(obj.id);
      if (stateObj && !stateObj.completed) return stateObj;
    }
    return null;
  }
}
