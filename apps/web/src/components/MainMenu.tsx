import { useState } from "react";
import { createRoom, joinRoomByCode } from "../network/client";

export function MainMenu() {
  const [screen, setScreen] = useState<"main" | "create" | "join">("main");
  const [playerName, setPlayerName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createRoom(playerName.trim());
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }
    if (!inviteCode.trim() || inviteCode.trim().length !== 6) {
      setError("Enter a 6-character invite code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await joinRoomByCode(inviteCode.trim(), playerName.trim());
    } catch (e: any) {
      setError(e.message || "Failed to join room");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.scanline} className="scanline-overlay" />
      <div style={styles.vignette} />
      <div style={styles.content}>
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>BLACKSITE</h1>
          <p style={styles.subtitle}>THE LAST EXTRACTION</p>
          <div style={styles.divider} />
          <p style={styles.tagline}>
            Cooperative Survival Horror // 4-8 Players
          </p>
        </div>

        {screen === "main" && (
          <div style={styles.menuButtons}>
            <button style={styles.menuBtn} onClick={() => setScreen("create")}>
              Create Room
            </button>
            <button style={styles.menuBtn} onClick={() => setScreen("join")}>
              Join Room
            </button>
          </div>
        )}

        {screen === "create" && (
          <div style={styles.formPanel}>
            <h2 style={styles.formTitle}>CREATE ROOM</h2>
            <input
              style={styles.input}
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.formButtons}>
              <button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setScreen("main");
                  setError("");
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {screen === "join" && (
          <div style={styles.formPanel}>
            <h2 style={styles.formTitle}>JOIN ROOM</h2>
            <input
              style={styles.input}
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              autoFocus
            />
            <input
              style={{ ...styles.input, letterSpacing: "4px", textAlign: "center" as const }}
              placeholder="INVITE CODE"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(e.target.value.toUpperCase().slice(0, 6))
              }
              maxLength={6}
            />
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.formButtons}>
              <button onClick={handleJoin} disabled={loading}>
                {loading ? "Joining..." : "Join"}
              </button>
              <button
                onClick={() => {
                  setScreen("main");
                  setError("");
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        <p style={styles.version}>v1.0.0 // CLASSIFIED</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at center, #1a0a0a 0%, #0a0a0f 70%)",
    position: "relative",
    overflow: "hidden",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%)",
    pointerEvents: "none",
  },
  scanline: {},
  content: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "40px",
  },
  titleBlock: {
    textAlign: "center",
  },
  title: {
    fontSize: "72px",
    fontWeight: "bold",
    color: "#ff2a2a",
    textShadow: "0 0 40px rgba(255,42,42,0.5), 0 0 80px rgba(255,42,42,0.2)",
    letterSpacing: "12px",
    animation: "flicker 4s ease-in-out infinite",
  },
  subtitle: {
    fontSize: "18px",
    color: "#8a8a9a",
    letterSpacing: "8px",
    marginTop: "8px",
  },
  divider: {
    width: "200px",
    height: "1px",
    background: "linear-gradient(90deg, transparent, #ff2a2a, transparent)",
    margin: "20px auto",
  },
  tagline: {
    fontSize: "12px",
    color: "#4a4a5a",
    letterSpacing: "2px",
  },
  menuButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "280px",
  },
  menuBtn: {
    padding: "16px 40px",
    fontSize: "16px",
    letterSpacing: "3px",
  },
  formPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minWidth: "320px",
    padding: "30px",
    border: "1px solid #2a2a3a",
    background: "rgba(10, 10, 15, 0.9)",
  },
  formTitle: {
    fontSize: "16px",
    color: "#ff2a2a",
    letterSpacing: "4px",
    textAlign: "center",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
  },
  error: {
    color: "#ff4444",
    fontSize: "12px",
    textAlign: "center",
  },
  formButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  version: {
    fontSize: "10px",
    color: "#2a2a3a",
    letterSpacing: "2px",
    position: "absolute",
    bottom: "-60px",
  },
};
