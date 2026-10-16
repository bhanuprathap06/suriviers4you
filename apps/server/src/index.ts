import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "colyseus";
import { GameRoom, getInviteCodeMap } from "./rooms/GameRoom";
import { config } from "./config";

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/room/:code", (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    res.status(400).json({ error: "Invalid invite code format" });
    return;
  }
  const roomId = getInviteCodeMap().get(code);
  if (!roomId) {
    res.status(404).json({ error: "Room not found or expired" });
    return;
  }
  res.json({ roomId });
});

const httpServer = createServer(app);

const gameServer = new Server({
  server: httpServer,
  greet: false,
});

gameServer.define("game_room", GameRoom).enableRealtimeListing();

gameServer.listen(config.port).then(() => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   BLACKSITE: THE LAST EXTRACTION         ║
  ║   Server running on port ${config.port}           ║
  ║   Environment: ${config.nodeEnv.padEnd(24)}║
  ╚══════════════════════════════════════════╝
  `);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  gameServer.gracefullyShutdown().then(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  gameServer.gracefullyShutdown().then(() => process.exit(0));
});
