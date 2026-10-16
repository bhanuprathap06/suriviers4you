import { PlayerState } from "../state/PlayerState";
import { PLAYER, NOISE_LEVELS } from "@blacksite/shared";
import { isPointWalkable } from "@blacksite/shared";

export class MovementSystem {
  validateAndApplyMove(
    player: PlayerState,
    dx: number,
    dz: number,
    rotY: number,
    isSprinting: boolean,
    isCrouching: boolean,
    deltaTime: number,
  ): void {
    if (player.status !== "alive") return;

    player.rotY = rotY;
    player.isCrouching = isCrouching;
    player.isSprinting = isSprinting && !isCrouching && player.stamina > 0;

    let speed: number = PLAYER.MOVE_SPEED;
    if (player.isSprinting) {
      speed = PLAYER.SPRINT_SPEED;
      player.stamina = Math.max(
        0,
        player.stamina - PLAYER.STAMINA_DRAIN_RATE * deltaTime,
      );
    } else if (isCrouching) {
      speed = PLAYER.CROUCH_SPEED;
    }

    if (!player.isSprinting) {
      player.stamina = Math.min(
        PLAYER.MAX_STAMINA,
        player.stamina + PLAYER.STAMINA_REGEN_RATE * deltaTime,
      );
    }

    const inputLen = Math.sqrt(dx * dx + dz * dz);
    if (inputLen < 0.01) {
      player.noiseLevel = 0;
      return;
    }

    const normalizedDx = dx / inputLen;
    const normalizedDz = dz / inputLen;

    const sinY = Math.sin(rotY);
    const cosY = Math.cos(rotY);
    const worldDx = normalizedDx * cosY + normalizedDz * sinY;
    const worldDz = -normalizedDx * sinY + normalizedDz * cosY;

    const moveDist = speed * deltaTime;
    let newX = player.x + worldDx * moveDist;
    let newZ = player.z + worldDz * moveDist;

    const radius = PLAYER.COLLISION_RADIUS;
    if (
      isPointWalkable(newX + radius, newZ) &&
      isPointWalkable(newX - radius, newZ) &&
      isPointWalkable(newX, newZ + radius) &&
      isPointWalkable(newX, newZ - radius)
    ) {
      player.x = newX;
      player.z = newZ;
    } else {
      if (
        isPointWalkable(newX + radius, player.z) &&
        isPointWalkable(newX - radius, player.z)
      ) {
        player.x = newX;
      }
      if (
        isPointWalkable(player.x, newZ + radius) &&
        isPointWalkable(player.x, newZ - radius)
      ) {
        player.z = newZ;
      }
    }

    if (player.isSprinting) {
      player.noiseLevel = NOISE_LEVELS.SPRINT;
    } else if (isCrouching) {
      player.noiseLevel = NOISE_LEVELS.CROUCH;
    } else {
      player.noiseLevel = NOISE_LEVELS.WALK;
    }
  }

  updateFlashlight(player: PlayerState, deltaTime: number): void {
    if (player.flashlightOn && player.flashlightBattery > 0) {
      player.flashlightBattery = Math.max(
        0,
        player.flashlightBattery - PLAYER.BATTERY_DRAIN_RATE * deltaTime,
      );
      if (player.flashlightBattery <= 0) {
        player.flashlightOn = false;
      }
    }
  }
}
