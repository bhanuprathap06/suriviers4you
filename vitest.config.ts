import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@blacksite/shared": path.resolve(__dirname, "packages/shared/src"),
    },
  },
});
