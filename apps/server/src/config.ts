import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "2567", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-change-me",
  maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM || "8", 10),
  minPlayersToStart: parseInt(process.env.MIN_PLAYERS_TO_START || "1", 10),
  defaultMissionDuration: parseInt(
    process.env.DEFAULT_MISSION_DURATION_SECONDS || "600",
    10,
  ),
  roomExpiryMinutes: parseInt(process.env.ROOM_EXPIRY_MINUTES || "30", 10),
  isDev: (process.env.NODE_ENV || "development") === "development",
};
