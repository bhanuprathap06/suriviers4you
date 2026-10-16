import { useGameStore } from "../../store/gameStore";
import * as THREE from "three";

export function PlayerMeshes() {
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const players = useGameStore((s) => s.players);

  return (
    <>
      {Array.from(players.values())
        .filter((p) => p.id !== localPlayerId && p.status !== "eliminated")
        .map((player) => (
          <RemotePlayer key={player.id} player={player} />
        ))}
    </>
  );
}

function RemotePlayer({ player }: { player: any }) {
  const bodyHeight = player.isCrouching ? 1.0 : 1.6;
  const bodyY = bodyHeight / 2 + 0.1;
  const headY = bodyHeight + 0.35;

  const bodyColor = player.status === "downed" ? "#ff4400" : "#44aa44";
  const opacity = player.status === "downed" ? 0.6 : 1;

  return (
    <group position={[player.x, 0, player.z]} rotation={[0, player.rotY, 0]}>
      {/* Body capsule */}
      <mesh position={[0, bodyY, 0]}>
        <capsuleGeometry args={[0.3, bodyHeight - 0.6, 4, 8]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.8}
          transparent={player.status === "downed"}
          opacity={opacity}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, headY, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ddccaa" roughness={0.7} />
      </mesh>

      {/* Flashlight beam */}
      {player.flashlightOn && (
        <spotLight
          position={[0, 1.5, 0]}
          target-position={[
            Math.sin(player.rotY) * 10,
            1,
            -Math.cos(player.rotY) * 10,
          ]}
          angle={0.4}
          penumbra={0.5}
          intensity={2}
          distance={15}
          color="#ffffcc"
          decay={2}
        />
      )}

      {/* Nameplate */}
      <group position={[0, headY + 0.4, 0]}>
        <sprite scale={[1.5, 0.3, 1]}>
          <spriteMaterial color="#ffffff" opacity={0.8} transparent />
        </sprite>
      </group>
    </group>
  );
}
