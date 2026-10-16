import { Canvas } from "@react-three/fiber";
import { FacilityScene } from "../game/scene/FacilityScene";
import { PlayerMeshes } from "../game/scene/PlayerMesh";
import { MonsterMesh } from "../game/scene/MonsterMesh";
import { InteractiveObjects } from "../game/scene/InteractiveObjects";
import { FirstPersonController } from "../game/controls/FirstPersonController";
import { LocalFlashlight } from "../game/scene/LocalFlashlight";
import { HUD } from "./HUD";
import { EffectComposer, Vignette } from "@react-three/postprocessing";

export function Game() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#000000", cursor: "none" }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 1.7, 0] }}
        shadows
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <FirstPersonController />
        <FacilityScene />
        <PlayerMeshes />
        <MonsterMesh />
        <InteractiveObjects />
        <LocalFlashlight />

        <EffectComposer>
          <Vignette eskil={false} offset={0.3} darkness={0.8} />
        </EffectComposer>
      </Canvas>
      <HUD />
      <PointerLockOverlay />
    </div>
  );
}

function PointerLockOverlay() {
  return (
    <div
      id="pointer-lock-overlay"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        pointerEvents: "none",
        opacity: 0,
      }}
    >
      <p style={{ color: "#8a8a9a", fontSize: "14px", letterSpacing: "2px" }}>
        Click to look around
      </p>
    </div>
  );
}
