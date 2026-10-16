import { useGameStore } from "../store/gameStore";
import { sendUseItem, sendInteract, sendPickup, sendRevive } from "../network/client";
import { PLAYER, getDistance, OBJECTIVES } from "@blacksite/shared";

export function HUD() {
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const players = useGameStore((s) => s.players);
  const items = useGameStore((s) => s.items);
  const objectives = useGameStore((s) => s.objectives);
  const doors = useGameStore((s) => s.doors);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const extractionCountdown = useGameStore((s) => s.extractionCountdown);
  const phase = useGameStore((s) => s.phase);
  const events = useGameStore((s) => s.events);
  const evidenceCollected = useGameStore((s) => s.evidenceCollected);
  const evidenceRequired = useGameStore((s) => s.evidenceRequired);

  const localPlayer = players.get(localPlayerId);
  if (!localPlayer) return null;

  const healthPct = localPlayer.health / PLAYER.MAX_HEALTH;
  const staminaPct = localPlayer.stamina / PLAYER.MAX_STAMINA;
  const batteryPct = localPlayer.flashlightBattery / PLAYER.MAX_FLASHLIGHT_BATTERY;

  const minutes = Math.floor(Math.max(0, timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, timeRemaining) % 60);

  const nearbyItem = findNearbyItem(localPlayer, items);
  const nearbyDoor = findNearbyDoor(localPlayer, doors);
  const nearbyObjective = findNearbyObjective(localPlayer, objectives);
  const nearbyDowned = findNearbyDowned(localPlayer, players);

  const currentObjective = Array.from(objectives.values()).find((o) => !o.completed);

  return (
    <div style={styles.overlay}>
      {/* Health / Stamina / Battery */}
      <div style={styles.statusBars}>
        <StatusBar label="HP" value={healthPct} color={healthPct > 0.3 ? "#ff2a2a" : "#ff0000"} />
        <StatusBar label="STA" value={staminaPct} color="#ffaa00" />
        <StatusBar label="BAT" value={batteryPct} color="#0088ff" />
      </div>

      {/* Timer */}
      <div style={styles.timer}>
        {phase === "EXTRACTION" ? (
          <span style={{ color: "#ff2a2a", animation: "pulse 1s infinite" }}>
            EXTRACTION: {Math.ceil(extractionCountdown)}s
          </span>
        ) : (
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Current Objective */}
      {currentObjective && (
        <div style={styles.objective}>
          <span style={styles.objectiveLabel}>OBJECTIVE</span>
          <span style={styles.objectiveText}>{currentObjective.label}</span>
          <span style={styles.objectiveDesc}>{currentObjective.description}</span>
        </div>
      )}

      {/* Inventory */}
      <div style={styles.inventory}>
        <span style={styles.inventoryLabel}>INVENTORY ({localPlayer.inventory.length}/{PLAYER.INVENTORY_SIZE})</span>
        <div style={styles.inventoryGrid}>
          {localPlayer.inventory.map((itemId) => {
            const item = items.get(itemId);
            return (
              <button
                key={itemId}
                style={styles.inventorySlot}
                onClick={() => sendUseItem(itemId)}
                title={`Use ${item?.itemType || itemId}`}
              >
                {getItemEmoji(item?.itemType || "")}
                <span style={styles.itemLabel}>{item?.itemType || "?"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interaction Prompt */}
      <div style={styles.interactPrompt}>
        {nearbyItem && (
          <button
            style={styles.promptBtn}
            onClick={() => sendPickup(nearbyItem.id)}
          >
            [E] Pick up {nearbyItem.itemType}
          </button>
        )}
        {nearbyDoor && (
          <button
            style={styles.promptBtn}
            onClick={() => sendInteract(nearbyDoor.id, "door")}
          >
            [E] {nearbyDoor.locked ? "Locked" : nearbyDoor.state === "open" ? "Close door" : "Open door"}
          </button>
        )}
        {nearbyObjective && (
          <button
            style={styles.promptBtn}
            onClick={() => sendInteract(nearbyObjective.id, nearbyObjective.interactType)}
          >
            [E] {nearbyObjective.label}
          </button>
        )}
        {nearbyDowned && (
          <button
            style={styles.promptBtn}
            onClick={() => sendRevive(nearbyDowned.id)}
          >
            [E] Revive {nearbyDowned.name}
          </button>
        )}
      </div>

      {/* Teammates */}
      <div style={styles.teammates}>
        {Array.from(players.values())
          .filter((p) => p.id !== localPlayerId)
          .map((p) => (
            <div key={p.id} style={styles.teammate}>
              <span style={{ color: getStatusColor(p.status) }}>
                {p.name}
              </span>
              <span style={{ fontSize: "10px", color: "#4a4a5a" }}>
                {p.status.toUpperCase()}
              </span>
            </div>
          ))}
      </div>

      {/* Events Log */}
      <div style={styles.eventLog}>
        {events.slice(-5).map((evt, i) => (
          <div
            key={i}
            style={{
              ...styles.eventItem,
              color: getEventColor(evt.type),
              opacity: 1 - i * 0.15,
            }}
          >
            {evt.message}
          </div>
        ))}
      </div>

      {/* Downed overlay */}
      {localPlayer.status === "downed" && (
        <div style={styles.downedOverlay}>
          <h2 style={styles.downedText}>INCAPACITATED</h2>
          <p>Waiting for rescue... {Math.ceil(localPlayer.downedTimer)}s</p>
        </div>
      )}

      {localPlayer.status === "eliminated" && (
        <div style={styles.downedOverlay}>
          <h2 style={styles.eliminatedText}>ELIMINATED</h2>
          <p>Spectating...</p>
        </div>
      )}

      {localPlayer.status === "extracted" && (
        <div style={styles.extractedOverlay}>
          <h2 style={styles.extractedText}>EXTRACTED</h2>
          <p>Waiting for team...</p>
        </div>
      )}

      {/* Crosshair */}
      <div style={styles.crosshair}>+</div>

      {/* Evidence counter if relevant */}
      {evidenceCollected > 0 && (
        <div style={styles.evidenceCounter}>
          Evidence: {evidenceCollected}/{evidenceRequired}
        </div>
      )}
    </div>
  );
}

function StatusBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={styles.barContainer}>
      <span style={styles.barLabel}>{label}</span>
      <div style={styles.barBg}>
        <div
          style={{
            ...styles.barFill,
            width: `${Math.max(0, Math.min(100, value * 100))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function findNearbyItem(
  localPlayer: any,
  items: Map<string, any>,
): { id: string; itemType: string } | null {
  for (const [, item] of items) {
    if (item.collected) continue;
    const dist = getDistance(
      { x: localPlayer.x, y: 0, z: localPlayer.z },
      { x: item.x, y: 0, z: item.z },
    );
    if (dist <= PLAYER.PICKUP_DISTANCE) return item;
  }
  return null;
}

function findNearbyDoor(
  localPlayer: any,
  doors: Map<string, any>,
): { id: string; state: string; locked: boolean } | null {
  for (const [, door] of doors) {
    const dist = getDistance(
      { x: localPlayer.x, y: 0, z: localPlayer.z },
      { x: door.x, y: 0, z: door.z },
    );
    if (dist <= PLAYER.INTERACT_DISTANCE) return door;
  }
  return null;
}

function findNearbyObjective(
  localPlayer: any,
  objectives: Map<string, any>,
): { id: string; label: string; interactType: string } | null {
  for (const def of OBJECTIVES) {
    const obj = objectives.get(def.id);
    if (!obj || obj.completed) continue;
    const dist = getDistance(
      { x: localPlayer.x, y: 0, z: localPlayer.z },
      def.position,
    );
    if (dist <= 5) {
      let interactType = "item";
      if (def.id === "restore_generator") interactType = "generator";
      if (def.id === "activate_extraction") interactType = "extraction_panel";
      if (def.id === "unlock_laboratory") interactType = "door";
      return { id: def.id, label: def.label, interactType };
    }
  }
  return null;
}

function findNearbyDowned(
  localPlayer: any,
  players: Map<string, any>,
): { id: string; name: string } | null {
  for (const [, player] of players) {
    if (player.id === localPlayer.id || player.status !== "downed") continue;
    const dist = getDistance(
      { x: localPlayer.x, y: 0, z: localPlayer.z },
      { x: player.x, y: 0, z: player.z },
    );
    if (dist <= PLAYER.REVIVE_DISTANCE) return player;
  }
  return null;
}

function getItemEmoji(type: string): string {
  switch (type) {
    case "battery": return "B";
    case "fuse": return "F";
    case "medkit": return "+";
    case "access_card": return "K";
    case "evidence": return "E";
    case "core": return "C";
    default: return "?";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "alive": return "#00ff66";
    case "downed": return "#ff6600";
    case "eliminated": return "#ff0000";
    case "extracted": return "#0088ff";
    case "disconnected": return "#4a4a5a";
    default: return "#8a8a9a";
  }
}

function getEventColor(type: string): string {
  switch (type) {
    case "danger": return "#ff2a2a";
    case "warning": return "#ff6600";
    case "success": return "#00ff66";
    case "alert": return "#ffaa00";
    case "objective": return "#00aaff";
    case "info": return "#8a8a9a";
    default: return "#c0c0c0";
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 100,
  },
  statusBars: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    pointerEvents: "auto",
  },
  barContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  barLabel: {
    fontSize: "10px",
    color: "#4a4a5a",
    width: "28px",
    letterSpacing: "1px",
  },
  barBg: {
    width: "120px",
    height: "8px",
    background: "#1a1a2e",
    border: "1px solid #2a2a3a",
  },
  barFill: {
    height: "100%",
    transition: "width 0.2s ease",
  },
  timer: {
    position: "absolute",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "20px",
    color: "#e0e0e0",
    letterSpacing: "2px",
    textShadow: "0 0 10px rgba(0,0,0,0.8)",
    fontWeight: "bold",
  },
  objective: {
    position: "absolute",
    top: "50px",
    left: "50%",
    transform: "translateX(-50%)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  objectiveLabel: {
    fontSize: "9px",
    color: "#4a4a5a",
    letterSpacing: "3px",
  },
  objectiveText: {
    fontSize: "14px",
    color: "#ffaa00",
    letterSpacing: "1px",
  },
  objectiveDesc: {
    fontSize: "10px",
    color: "#6a6a7a",
  },
  inventory: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    pointerEvents: "auto",
  },
  inventoryLabel: {
    fontSize: "9px",
    color: "#4a4a5a",
    letterSpacing: "2px",
  },
  inventoryGrid: {
    display: "flex",
    gap: "4px",
    marginTop: "4px",
  },
  inventorySlot: {
    width: "44px",
    height: "44px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    padding: "2px",
    cursor: "pointer",
  },
  itemLabel: {
    fontSize: "7px",
    color: "#4a4a5a",
    marginTop: "1px",
  },
  interactPrompt: {
    position: "absolute",
    bottom: "50%",
    left: "50%",
    transform: "translate(-50%, 60px)",
    pointerEvents: "auto",
  },
  promptBtn: {
    background: "rgba(10,10,15,0.8)",
    border: "1px solid #ff2a2a",
    color: "#ff2a2a",
    padding: "8px 16px",
    fontSize: "12px",
    letterSpacing: "1px",
    cursor: "pointer",
  },
  teammates: {
    position: "absolute",
    top: "16px",
    right: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  teammate: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontSize: "11px",
  },
  eventLog: {
    position: "absolute",
    bottom: "80px",
    left: "20px",
    display: "flex",
    flexDirection: "column-reverse",
    gap: "2px",
  },
  eventItem: {
    fontSize: "11px",
    textShadow: "0 0 4px rgba(0,0,0,0.8)",
  },
  crosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "24px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: "100",
    textShadow: "0 0 2px rgba(255,255,255,0.2)",
  },
  downedOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(100,0,0,0.3)",
    pointerEvents: "none",
  },
  downedText: {
    fontSize: "36px",
    color: "#ff4444",
    letterSpacing: "6px",
    animation: "pulse 2s ease-in-out infinite",
  },
  eliminatedText: {
    fontSize: "36px",
    color: "#ff0000",
    letterSpacing: "6px",
  },
  extractedOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,80,0.3)",
    pointerEvents: "none",
  },
  extractedText: {
    fontSize: "36px",
    color: "#00aaff",
    letterSpacing: "6px",
  },
  evidenceCounter: {
    position: "absolute",
    top: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "11px",
    color: "#00aaff",
  },
};
