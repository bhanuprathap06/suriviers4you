import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../store/gameStore";
import * as THREE from "three";

export function MonsterMesh() {
  const monster = useGameStore((s) => s.monster);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || !monster) return;

    groupRef.current.position.lerp(
      new THREE.Vector3(monster.x, 0, monster.z),
      0.15,
    );

    const targetRotY = monster.rotY;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.1,
    );

    timeRef.current += delta;
  });

  if (!monster) return null;

  const isAggressive =
    monster.behaviorState === "CHASE" || monster.behaviorState === "ATTACK";
  const bodyColor = isAggressive ? "#440000" : "#1a1a1a";
  const eyeColor = isAggressive ? "#ff0000" : "#880000";
  const eyeIntensity = isAggressive ? 2 : 0.5;

  return (
    <group ref={groupRef} position={[monster.x, 0, monster.z]}>
      {/* Main body - tall dark figure */}
      <mesh position={[0, 1.4, 0]}>
        <capsuleGeometry args={[0.5, 1.8, 4, 8]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.95}
          metalness={0.1}
          emissive={isAggressive ? "#220000" : "#000000"}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.9}
          emissive={isAggressive ? "#110000" : "#000000"}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.12, 2.65, -0.28]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={eyeIntensity}
        />
      </mesh>
      <mesh position={[0.12, 2.65, -0.28]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={eyeIntensity}
        />
      </mesh>

      {/* Eye glow light */}
      <pointLight
        position={[0, 2.65, -0.3]}
        intensity={isAggressive ? 0.5 : 0.1}
        distance={isAggressive ? 8 : 3}
        color="#ff0000"
        decay={2}
      />

      {/* Arms */}
      <mesh position={[-0.65, 1.2, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.12, 1.2, 4, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.95} />
      </mesh>
      <mesh position={[0.65, 1.2, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.12, 1.2, 4, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.95} />
      </mesh>

      {/* Shadow / aura */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={isAggressive ? 0.2 : 0.05}
        distance={5}
        color="#ff0000"
        decay={2}
      />
    </group>
  );
}
