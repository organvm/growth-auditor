import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "../e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    env: {
      ...process.env,
      // Auth.js intentionally fails closed without a secret. E2E runs exercise the
      // anonymous product surface, so give only the test web server an ephemeral,
      // non-production value instead of depending on a repository secret.
      AUTH_SECRET: process.env.AUTH_SECRET ?? "growth-auditor-playwright-only-secret",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
