import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

for (const f of [".env.test.local", ".env.local"]) {
  if (existsSync(f)) process.loadEnvFile(f);
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /qa-.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  fullyParallel: false,
  outputDir: "qa/traces",
  reporter: [["list"], ["json", { outputFile: "qa/results.json" }], ["html", { outputFolder: "qa/html-report", open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://utmb2027.vercel.app",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 640 } } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
