import path from "node:path";
import { loadEnv } from "vite";
import { configDefaults, defineConfig } from "vitest/config";

/* Separate from vitest.config.mts so `npm test` (and CI, which only has placeholder Supabase
   values) never tries to reach the hosted pilot project. These tests talk to it for real, so
   they only run through `npm run test:integration`, which needs .env.local's real credentials. */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["**/*.integration.test.ts"],
    exclude: configDefaults.exclude,
    env: loadEnv("integration", process.cwd(), ""),
    testTimeout: 30_000,
  },
});
