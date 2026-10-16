import { useMemo } from "react";
import { ROOMS, DOORS } from "@blacksite/shared";
import { useGameStore } from "../../store/gameStore";
import * as THREE from "three";

const WALL_HEIGHT = 4;
const WALL_THICKNESS = 0.3;

export function FacilityScene() {
  return (
    <>
      <ambientLight intensity={0.05} color="#1a1a3a" />
      <fog attach="fog" args={["#050510", 1, 30]} />

      <Rooms />
      <DoorMeshes />
      <ExtractionZone />
    </>
  );
}

function Rooms() {
  const geometry = useMemo(() => {
    const meshes: JSX.Element[] = [];

    ROOMS.forEach((room, i) => {
      const { center, size, color } = room;
      const halfX = size.x / 2;
      const halfZ = size.z / 2;

      meshes.push(
        <mesh
          key={`floor-${i}`}
          position={[center.x, 0.01, center.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[size.x, size.z]} />
          <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
        </mesh>,
      );

      meshes.push(
        <mesh
          key={`ceiling-${i}`}
          position={[center.x, WALL_HEIGHT, center.z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[size.x, size.z]} />
          <meshStandardMaterial color="#0a0a14" roughness={1} />
        </mesh>,
      );

      // North wall
      meshes.push(
        <Wall
          key={`wall-n-${i}`}
          position={[center.x, WALL_HEIGHT / 2, center.z - halfZ]}
          size={[size.x, WALL_HEIGHT, WALL_THICKNESS]}
          color={color}
        />,
      );
      // South wall
      meshes.push(
        <Wall
          key={`wall-s-${i}`}
          position={[center.x, WALL_HEIGHT / 2, center.z + halfZ]}
          size={[size.x, WALL_HEIGHT, WALL_THICKNESS]}
          color={color}
        />,
      );
      // East wall
      meshes.push(
        <Wall
          key={`wall-e-${i}`}
          position={[center.x + halfX, WALL_HEIGHT / 2, center.z]}
          size={[WALL_THICKNESS, WALL_HEIGHT, size.z]}
          color={color}
        />,
      );
      // West wall
      meshes.push(
        <Wall
          key={`wall-w-${i}`}
          position={[center.x - halfX, WALL_HEIGHT / 2, center.z]}
          size={[WALL_THICKNESS, WALL_HEIGHT, size.z]}
          color={color}
        />,
      );

      // Room light
      meshes.push(
        <pointLight
          key={`light-${i}`}
          position={[center.x, WALL_HEIGHT - 0.5, center.z]}
          intensity={0.3}
          distance={Math.max(size.x, size.z) * 1.2}
          color="#ff4422"
          decay={2}
        />,
      );
    });

    return meshes;
  }, []);

  return <>{geometry}</>;
}

function Wall({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function DoorMeshes() {
  const doors = useGameStore((s) => s.doors);

  return (
    <>
      {DOORS.map((doorDef) => {
        const doorState = doors.get(doorDef.id);
        const isOpen = doorState?.state === "open";
        const isLocked = doorState?.locked ?? doorDef.startsLocked;

        return (
          <group key={doorDef.id} position={[doorDef.position.x, 0, doorDef.position.z]}>
            <mesh
              position={[
                isOpen ? doorDef.width / 2 : 0,
                WALL_HEIGHT / 2,
                0,
              ]}
              rotation={[0, isOpen ? Math.PI / 2 : doorDef.rotation, 0]}
            >
              <boxGeometry args={[doorDef.width, WALL_HEIGHT - 0.2, 0.15]} />
              <meshStandardMaterial
                color={isLocked ? "#660000" : isOpen ? "#003300" : "#333333"}
                roughness={0.7}
                metalness={0.3}
                emissive={isLocked ? "#220000" : "#000000"}
              />
            </mesh>
            {/* Door frame light */}
            <pointLight
              position={[0, WALL_HEIGHT - 0.3, 0]}
              intensity={0.15}
              distance={3}
              color={isLocked ? "#ff0000" : "#00ff00"}
              decay={2}
            />
          </group>
        );
      })}
    </>
  );
}

function ExtractionZone() {
  return (
    <group position={[0, 0.02, 24]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 6, 32]} />
        <meshStandardMaterial
          color="#0088ff"
          emissive="#0044ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
        />
      </mesh>
      <pointLight
        position={[0, 0.5, 0]}
        intensity={0.3}
        distance={8}
        color="#0088ff"
        decay={2}
      />
    </group>
  );
}
