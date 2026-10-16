import { PlayerState } from "../state/PlayerState";
import { ItemState } from "../state/ItemState";
import { MapSchema } from "@colyseus/schema";
import { PLAYER, getDistance } from "@blacksite/shared";

export class InventorySystem {
  pickupItem(
    player: PlayerState,
    itemId: string,
    items: MapSchema<ItemState>,
  ): boolean {
    if (player.status !== "alive") return false;
    if (player.inventory.length >= PLAYER.INVENTORY_SIZE) return false;

    const item = items.get(itemId);
    if (!item || item.collected) return false;

    const dist = getDistance(
      { x: player.x, y: 0, z: player.z },
      { x: item.x, y: 0, z: item.z },
    );
    if (dist > PLAYER.PICKUP_DISTANCE) return false;

    item.collected = true;
    item.heldBy = player.id;
    player.inventory.push(itemId);
    return true;
  }

  dropItem(
    player: PlayerState,
    itemId: string,
    items: MapSchema<ItemState>,
  ): boolean {
    const idx = player.inventory.toArray().indexOf(itemId);
    if (idx === -1) return false;

    const item = items.get(itemId);
    if (!item) return false;

    player.inventory.splice(idx, 1);
    item.collected = false;
    item.heldBy = "";
    item.x = player.x;
    item.y = 0.5;
    item.z = player.z;
    return true;
  }

  useItem(
    player: PlayerState,
    itemId: string,
    items: MapSchema<ItemState>,
  ): { used: boolean; itemType: string } {
    const idx = player.inventory.toArray().indexOf(itemId);
    if (idx === -1) return { used: false, itemType: "" };

    const item = items.get(itemId);
    if (!item) return { used: false, itemType: "" };

    switch (item.itemType) {
      case "battery":
        player.flashlightBattery = Math.min(
          PLAYER.MAX_FLASHLIGHT_BATTERY,
          player.flashlightBattery + 50,
        );
        this.consumeItem(player, item, idx);
        return { used: true, itemType: "battery" };

      case "medkit":
        if (player.health >= PLAYER.MAX_HEALTH) {
          return { used: false, itemType: "medkit" };
        }
        player.health = Math.min(
          PLAYER.MAX_HEALTH,
          player.health + 40,
        );
        this.consumeItem(player, item, idx);
        return { used: true, itemType: "medkit" };

      default:
        return { used: false, itemType: item.itemType };
    }
  }

  hasItem(player: PlayerState, itemType: string, items: MapSchema<ItemState>): boolean {
    return player.inventory.toArray().some((itemId) => {
      const item = items.get(itemId);
      return item && item.itemType === itemType;
    });
  }

  removeItemByType(
    player: PlayerState,
    itemType: string,
    items: MapSchema<ItemState>,
  ): boolean {
    const invArray = player.inventory.toArray();
    for (let i = 0; i < invArray.length; i++) {
      const item = items.get(invArray[i]);
      if (item && item.itemType === itemType) {
        player.inventory.splice(i, 1);
        item.collected = true;
        item.heldBy = "";
        return true;
      }
    }
    return false;
  }

  dropAllItems(
    player: PlayerState,
    items: MapSchema<ItemState>,
  ): void {
    const invArray = [...player.inventory.toArray()];
    for (const itemId of invArray) {
      this.dropItem(player, itemId, items);
    }
  }

  private consumeItem(
    player: PlayerState,
    item: ItemState,
    inventoryIndex: number,
  ): void {
    player.inventory.splice(inventoryIndex, 1);
    item.heldBy = "";
  }
}
