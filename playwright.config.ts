import { defineConfig, devices } from "@playwright/test";

const jwtAccess = process.env.JWT_ACCESS_SECRET ?? "01234567890123456789012345678901";
const jwtRefresh = process.env.JWT_REFRESH_SECRET ?? "01234567890123456789012345678901";
const dbUrl =
  process.env.DATABASE_URL ?? "postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/fitmeals_dev?schema=public";

const apiEnv = {
  ...process.env,
  DATABASE_URL: dbUrl,
  JWT_ACCESS_SECRET: jwtAccess,
  JWT_REFRESH_SECRET: jwtRefresh,
  AUTH_RETURN_REFRESH_BODY: "true",
  NODE_ENV: "development",
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "customer-chromium",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3000" },
    },
    {
      name: "admin-chromium",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3001" },
    },
    {
      name: "rider-mobile",
      use: { ...devices["Pixel 5"], baseURL: "http://127.0.0.1:3002" },
    },
  ],
  webServer: [
    {
      command: "npx --yes pnpm@9.15.0 --filter @fitmeals/api dev",
      url: "http://127.0.0.1:4000/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: apiEnv,
    },
    {
      command: "npx --yes pnpm@9.15.0 --filter @fitmeals/customer-web dev",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000" },
    },
    {
      command: "npx --yes pnpm@9.15.0 --filter @fitmeals/admin-dashboard dev",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000" },
    },
    {
      command: "npx --yes pnpm@9.15.0 --filter @fitmeals/rider-web dev",
      url: "http://127.0.0.1:3002",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000" },
    },
  ],
});
