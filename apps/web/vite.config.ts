import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@blacksite/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:2567",
      "/colyseus": {
        target: "ws://localhost:2567",
        ws: true,
      },
    },
  },
  build: {
    sourcemap: true,
    target: "es2022",
  },
});
