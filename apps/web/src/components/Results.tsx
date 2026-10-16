import { useGameStore } from "../store/gameStore";
import { leaveRoom, sendReady } from "../network/client";

export function Results() {
  const phase = useGameStore((s) => s.phase);
  const matchResult = useGameStore((s) => s.matchResult);
  const players = useGameStore((s) => s.players);
  const localPlayerId = useGameStore((s) => s.localPlayerId);

  const isSuccess = phase === "RESULTS";
  const title = isSuccess ? "EXTRACTION SUCCESSFUL" : "MISSION FAILED";
  const titleColor = isSuccess ? "#00ff66" : "#ff2a2a";

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <h1 style={{ ...styles.title, color: titleColor }}>{title}</h1>

        {matchResult && (
          <div style={styles.stats}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Extracted</span>
              <span style={styles.statValue}>
                {matchResult.playersExtracted}/{matchResult.totalPlayers}
              </span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Objectives</span>
              <span style={styles.statValue}>
                {matchResult.objectivesCompleted}/{matchResult.totalObjectives}
              </span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Duration</span>
              <span style={styles.statValue}>
                {formatDuration(matchResult.duration)}
              </span>
            </div>
          </div>
        )}

        <div style={styles.playerResults}>
          <p style={styles.sectionTitle}>TEAM STATUS</p>
          {Array.from(players.values()).map((player) => (
            <div key={player.id} style={styles.playerRow}>
              <span style={styles.playerName}>
                {player.name}
                {player.id === localPlayerId && (
                  <span style={styles.youBadge}> (you)</span>
                )}
              </span>
              <span
                style={{
                  ...styles.playerStatus,
                  color: getStatusColor(player.status),
                }}
              >
                {player.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.readyBtn} onClick={() => sendReady(true)}>
            PLAY AGAIN
          </button>
          <button style={styles.leaveBtn} onClick={leaveRoom}>
            LEAVE
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "extracted": return "#00ff66";
    case "eliminated": return "#ff0000";
    case "alive": return "#ffaa00";
    case "downed": return "#ff6600";
    default: return "#8a8a9a";
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at center, #0f0a0a 0%, #0a0a0f 70%)",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    padding: "40px",
    border: "1px solid #2a2a3a",
    background: "rgba(10,10,15,0.9)",
    minWidth: "400px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "6px",
    textShadow: "0 0 30px currentColor",
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    padding: "16px",
    border: "1px solid #1a1a2a",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#4a4a5a",
    letterSpacing: "2px",
  },
  statValue: {
    fontSize: "16px",
    color: "#e0e0e0",
    fontWeight: "bold",
  },
  playerResults: {
    width: "100%",
    padding: "16px",
    border: "1px solid #1a1a2a",
  },
  sectionTitle: {
    fontSize: "12px",
    color: "#8a8a9a",
    letterSpacing: "2px",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid #1a1a2a",
  },
  playerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #111118",
  },
  playerName: {
    fontSize: "14px",
    color: "#e0e0e0",
  },
  youBadge: {
    color: "#0066ff",
    fontSize: "10px",
  },
  playerStatus: {
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  readyBtn: {
    padding: "12px 28px",
    fontSize: "14px",
    background: "#1a2e1a",
    borderColor: "#00ff66",
    color: "#00ff66",
  },
  leaveBtn: {
    padding: "12px 28px",
    fontSize: "14px",
    color: "#8a8a9a",
  },
};
