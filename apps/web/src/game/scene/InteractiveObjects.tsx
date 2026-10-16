import { useGameStore } from "../../store/gameStore";

export function InteractiveObjects() {
  const items = useGameStore((s) => s.items);
  const objectives = useGameStore((s) => s.objectives);

  return (
    <>
      {Array.from(items.values())
        .filter((item) => !item.collected)
        .map((item) => (
          <ItemMesh key={item.id} item={item} />
        ))}

      {Array.from(objectives.values())
        .filter((obj) => !obj.completed)
        .map((obj) => (
          <ObjectiveMarker key={obj.id} objective={obj} />
        ))}
    </>
  );
}

function ItemMesh({ item }: { item: any }) {
  const color = getItemColor(item.itemType);
  const yOffset = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;

  return (
    <group position={[item.x, yOffset, item.z]}>
      <mesh rotation={[0, Date.now() * 0.001, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      <pointLight
        position={[0, 0.2, 0]}
        intensity={0.2}
        distance={3}
        color={color}
        decay={2}
      />
    </group>
  );
}

function ObjectiveMarker({ objective }: { objective: any }) {
  return null;
}

function getItemColor(type: string): string {
  switch (type) {
    case "battery": return "#0088ff";
    case "fuse": return "#ffaa00";
    case "medkit": return "#00ff66";
    case "access_card": return "#ff00ff";
    case "evidence": return "#00aaff";
    case "core": return "#ff6600";
    default: return "#ffffff";
  }
}
