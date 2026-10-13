import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 4,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/playwright-results.json" }],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  globalSetup: path.resolve(__dirname, "e2e/global-setup.ts"),
  use: {
    baseURL: "http://localhost:8081",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    launchOptions: {
      slowMo: process.env.PW_SLOWMO ? Number(process.env.PW_SLOWMO) : 0,
    },
  },
  projects: [
    {
      name: "api",
      testDir: "./e2e/api",
    },
    {
      name: "ui-desktop",
      testDir: "./e2e/ui",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "ui-mobile",
      testDir: "./e2e/ui",
      grep: /@smoke|@mobile/,
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "flows",
      testDir: "./e2e/flows",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "security",
      testDir: "./e2e/security",
    },
  ],
  webServer: [
    {
      command: "node src/server.js",
      cwd: path.resolve(__dirname, "../hollis-blue-collor-backend"),
      url: "http://localhost:5000/health",
      reuseExistingServer: true,
      timeout: 30 * 1000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:8081",
      reuseExistingServer: true,
      timeout: 30 * 1000,
    },
  ],
});
