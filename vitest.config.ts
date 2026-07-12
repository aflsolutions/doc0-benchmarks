import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["scoring/**/*.test.ts", "runners/**/*.test.ts", "test/**/*.test.ts"] },
});
