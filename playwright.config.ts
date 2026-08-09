import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        storageState: process.env.PLAYWRIGHT_AUTH_STORAGE_STATE,
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], storageState: process.env.PLAYWRIGHT_AUTH_STORAGE_STATE },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
