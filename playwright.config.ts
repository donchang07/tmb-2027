import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  // E2E는 프로덕션 빌드로 실행한다(SW·오프라인·성능 기준은 배포 빌드 기준). dev 서버(3000)와 충돌하지 않도록 3100 사용.
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    env: { NEXT_DIST_DIR: ".next-e2e" },
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 300_000,
  },
  projects: [
    { name: "mobile-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 640 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
