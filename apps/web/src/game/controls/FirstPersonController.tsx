import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { sendMove, sendToggleFlashlight, sendPickup, sendInteract, sendRevive } from "../../network/client";
import { useGameStore } from "../../store/gameStore";
import { PLAYER, isPointWalkable, getDistance, OBJECTIVES } from "@blacksite/shared";
import * as THREE from "three";

const MOUSE_SENSITIVITY = 0.002;
const PITCH_LIMIT = Math.PI / 2 - 0.01;

export function FirstPersonController() {
  const { camera, gl } = useThree();
  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isLockedRef = useRef(false);

  const requestLock = useCallback(() => {
    gl.domElement.requestPointerLock();
  }, [gl]);

  useEffect(() => {
    const onPointerLockChange = () => {
      isLockedRef.current = document.pointerLockElement === gl.domElement;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current) return;
      yawRef.current -= e.movementX * MOUSE_SENSITIVITY;
      pitchRef.current -= e.movementY * MOUSE_SENSITIVITY;
      pitchRef.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitchRef.current));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (e.code === "KeyF") {
        sendToggleFlashlight();
      }

      if (e.code === "KeyE") {
        handleInteraction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onClick = () => {
      if (!isLockedRef.current) {
        requestLock();
      }
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    gl.domElement.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [gl, requestLock]);

  useFrame(() => {
    if (!isLockedRef.current) return;

    const keys = keysRef.current;
    let dx = 0;
    let dz = 0;

    if (keys.has("KeyW") || keys.has("ArrowUp")) dz -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) dz += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;

    const isSprinting = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const isCrouching = keys.has("ControlLeft") || keys.has("ControlRight") || keys.has("KeyC");

    if (dx !== 0 || dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx /= len;
      dz /= len;
    }

    sendMove(dx, dz, yawRef.current, isSprinting, isCrouching);

    const localPlayerId = useGameStore.getState().localPlayerId;
    const localPlayer = useGameStore.getState().players.get(localPlayerId);
    if (localPlayer) {
      camera.position.set(
        localPlayer.x,
        localPlayer.isCrouching ? 1.2 : 1.7,
        localPlayer.z,
      );
    }

    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);
  });

  return null;
}

function handleInteraction() {
  const state = useGameStore.getState();
  const localPlayer = state.players.get(state.localPlayerId);
  if (!localPlayer || localPlayer.status !== "alive") return;

  const playerPos = { x: localPlayer.x, y: 0, z: localPlayer.z };

  for (const [, item] of state.items) {
    if (item.collected) continue;
    const dist = getDistance(playerPos, { x: item.x, y: 0, z: item.z });
    if (dist <= PLAYER.PICKUP_DISTANCE) {
      sendPickup(item.id);
      return;
    }
  }

  for (const [, door] of state.doors) {
    const dist = getDistance(playerPos, { x: door.x, y: 0, z: door.z });
    if (dist <= PLAYER.INTERACT_DISTANCE) {
      sendInteract(door.id, "door");
      return;
    }
  }

  for (const def of OBJECTIVES) {
    const obj = state.objectives.get(def.id);
    if (!obj || obj.completed) continue;
    const dist = getDistance(playerPos, def.position);
    if (dist <= 5) {
      let interactType = "item";
      if (def.id === "restore_generator") interactType = "generator";
      if (def.id === "activate_extraction") interactType = "extraction_panel";
      if (def.id === "unlock_laboratory") interactType = "door";
      sendInteract(def.id, interactType);
      return;
    }
  }

  for (const [, player] of state.players) {
    if (player.id === localPlayer.id || player.status !== "downed") continue;
    const dist = getDistance(playerPos, { x: player.x, y: 0, z: player.z });
    if (dist <= PLAYER.REVIVE_DISTANCE) {
      sendRevive(player.id);
      return;
    }
  }
}
