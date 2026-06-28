import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e/specs",
  webServer: {
    command: "npx next dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "e2e-real",
      use: { browserName: "chromium" },
      testMatch: /full-setup/,
    },
  ],
});
