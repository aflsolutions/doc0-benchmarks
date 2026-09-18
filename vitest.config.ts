import { defineConfig } from "vitest/config";

export default defineConfig({
  // vitest defaults to one worker per core; parallel runs (agents, turbo) overload the machine
  test: { maxWorkers: "50%", include: ["scoring/**/*.test.ts", "runners/**/*.test.ts", "test/**/*.test.ts"] },
});
