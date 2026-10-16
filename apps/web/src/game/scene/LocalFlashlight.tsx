import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../../store/gameStore";
import * as THREE from "three";

export function LocalFlashlight() {
  const { camera } = useThree();
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame(() => {
    const state = useGameStore.getState();
    const localPlayer = state.players.get(state.localPlayerId);
    if (!lightRef.current || !localPlayer) return;

    const isOn = localPlayer.flashlightOn && localPlayer.flashlightBattery > 0;

    lightRef.current.intensity = isOn ? 3 : 0;

    lightRef.current.position.copy(camera.position);

    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    targetRef.current.position.copy(camera.position).add(dir.multiplyScalar(10));
    lightRef.current.target = targetRef.current;
  });

  return (
    <>
      <spotLight
        ref={lightRef}
        angle={0.5}
        penumbra={0.4}
        intensity={0}
        distance={20}
        color="#ffffdd"
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <primitive object={targetRef.current} />
    </>
  );
}
