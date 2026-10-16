import { useGameStore } from "../store/gameStore";
import { sendReady, sendStartGame, leaveRoom } from "../network/client";
import { GAME } from "@blacksite/shared";

export function Lobby() {
  const inviteCode = useGameStore((s) => s.inviteCode);
  const hostId = useGameStore((s) => s.hostId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const players = useGameStore((s) => s.players);
  const phase = useGameStore((s) => s.phase);

  const isHost = hostId === localPlayerId;
  const localPlayer = players.get(localPlayerId);
  const playerCount = players.size;
  const allReady =
    playerCount >= GAME.MIN_PLAYERS &&
    Array.from(players.values()).every((p) => p.isReady);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode).catch(() => {});
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?code=${inviteCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>MISSION BRIEFING</h1>
        <p style={styles.subtitle}>Waiting for team...</p>
      </div>

      <div style={styles.codeSection}>
        <p style={styles.codeLabel}>INVITE CODE</p>
        <div style={styles.codeDisplay}>
          <span style={styles.code}>{inviteCode}</span>
          <button style={styles.copyBtn} onClick={handleCopyCode}>
            COPY
          </button>
        </div>
        <button style={styles.linkBtn} onClick={handleCopyLink}>
          Copy Invite Link
        </button>
      </div>

      <div style={styles.playerList}>
        <p style={styles.sectionTitle}>
          TEAM ({playerCount}/{GAME.MAX_PLAYERS})
        </p>
        {Array.from(players.values()).map((player) => (
          <div key={player.id} style={styles.playerRow}>
            <span style={styles.playerName}>
              {player.name}
              {player.id === hostId && (
                <span style={styles.hostBadge}> [HOST]</span>
              )}
              {player.id === localPlayerId && (
                <span style={styles.youBadge}> (you)</span>
              )}
            </span>
            <span
              style={{
                ...styles.readyStatus,
                color: player.isReady ? "#00ff66" : "#ff6600",
              }}
            >
              {player.isReady ? "READY" : "NOT READY"}
            </span>
          </div>
        ))}
      </div>

      {phase === "STARTING" && (
        <div style={styles.countdown}>
          <p>MISSION STARTING...</p>
        </div>
      )}

      <div style={styles.actions}>
        {!isHost && (
          <button
            style={styles.readyBtn}
            onClick={() => sendReady(!localPlayer?.isReady)}
          >
            {localPlayer?.isReady ? "CANCEL READY" : "READY UP"}
          </button>
        )}
        {isHost && (
          <>
            <button
              style={styles.readyBtn}
              onClick={() => sendReady(!localPlayer?.isReady)}
            >
              {localPlayer?.isReady ? "CANCEL READY" : "READY UP"}
            </button>
            <button
              style={{
                ...styles.startBtn,
                opacity: allReady ? 1 : 0.4,
              }}
              onClick={() => sendStartGame()}
              disabled={!allReady}
            >
              START MISSION
            </button>
          </>
        )}
        <button style={styles.leaveBtn} onClick={leaveRoom}>
          LEAVE
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    background: "radial-gradient(ellipse at center, #0f0a0a 0%, #0a0a0f 70%)",
    padding: "40px",
  },
  header: { textAlign: "center" },
  title: {
    fontSize: "28px",
    color: "#ff2a2a",
    letterSpacing: "6px",
  },
  subtitle: {
    color: "#4a4a5a",
    fontSize: "12px",
    marginTop: "4px",
    letterSpacing: "2px",
  },
  codeSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "20px",
    border: "1px solid #2a2a3a",
    background: "rgba(10,10,15,0.8)",
  },
  codeLabel: {
    fontSize: "10px",
    color: "#4a4a5a",
    letterSpacing: "3px",
  },
  codeDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  code: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#ff2a2a",
    letterSpacing: "8px",
    textShadow: "0 0 20px rgba(255,42,42,0.3)",
  },
  copyBtn: {
    padding: "6px 12px",
    fontSize: "10px",
  },
  linkBtn: {
    padding: "4px 12px",
    fontSize: "10px",
    color: "#8a8a9a",
  },
  playerList: {
    minWidth: "360px",
    maxWidth: "500px",
    width: "100%",
    padding: "16px",
    border: "1px solid #2a2a3a",
    background: "rgba(10,10,15,0.8)",
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
    padding: "8px 0",
    borderBottom: "1px solid #111118",
  },
  playerName: {
    fontSize: "14px",
    color: "#e0e0e0",
  },
  hostBadge: {
    color: "#ffaa00",
    fontSize: "10px",
  },
  youBadge: {
    color: "#0066ff",
    fontSize: "10px",
  },
  readyStatus: {
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  countdown: {
    fontSize: "24px",
    color: "#ff2a2a",
    animation: "pulse 1s ease-in-out infinite",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  readyBtn: {
    padding: "12px 28px",
    fontSize: "14px",
    background: "#1a2e1a",
    borderColor: "#00ff66",
    color: "#00ff66",
  },
  startBtn: {
    padding: "12px 28px",
    fontSize: "14px",
    background: "#2e1a1a",
    borderColor: "#ff2a2a",
    color: "#ff2a2a",
  },
  leaveBtn: {
    padding: "12px 28px",
    fontSize: "14px",
    color: "#8a8a9a",
  },
};
