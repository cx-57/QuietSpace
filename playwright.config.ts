import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", fullyParallel: false, workers: 1,
  projects: [
    { name: "curated", testMatch: "core.spec.ts" },
    { name: "connected-test-double", testMatch: "connected.spec.ts", use: { baseURL: "http://127.0.0.1:3101" } },
    ...(process.env.QUIETSPACE_REAL_DATABASE_TESTS === "1" ? [{ name: "real-postgres", testMatch: "postgres.spec.ts", use: { baseURL: "http://127.0.0.1:3102" } }] : []),
  ],
  use: { baseURL: "http://127.0.0.1:3100", headless: true, channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", trace: "retain-on-failure" },
  webServer: [
    { command: "npm run start -- --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false,
      env: { QUIETSPACE_DATA_MODE: "curated", REPORTS_ENABLED: "false", NEXT_TELEMETRY_DISABLED: "1" } },
    { command: "node tests/support/mock-supabase.mjs", url: "http://127.0.0.1:3987/health", reuseExistingServer: false },
    { command: "npm run dev -- --port 3101", url: "http://127.0.0.1:3101", reuseExistingServer: false, timeout: 60000,
      env: { QUIETSPACE_DATA_MODE: "supabase", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3987", NEXT_PUBLIC_SUPABASE_ANON_KEY: "SAMPLE_TEST_PUBLIC_KEY",
        SUPABASE_SERVICE_ROLE_KEY: "SAMPLE_TEST_SERVER_KEY", REPORTS_ENABLED: "true", APP_ORIGIN: "http://127.0.0.1:3101",
        REPORT_ABUSE_SECRET: "SAMPLE test secret only with at least 32 characters", REPORT_TRUSTED_IP_HEADER: "x-test-verified-ip", NEXT_TELEMETRY_DISABLED: "1", QUIETSPACE_TEST_OUTPUT: ".next-connected-test" } },
    ...(process.env.QUIETSPACE_REAL_DATABASE_TESTS === "1" ? [{ command: "npm run dev -- --port 3102", url: "http://127.0.0.1:3102", reuseExistingServer: false, timeout:60000,
      env: { QUIETSPACE_DATA_MODE:"postgres", DATABASE_URL:"postgresql://quietspace_app@127.0.0.1:55432/quietspace_browser_test", APP_ORIGIN:"http://127.0.0.1:3102", REPORTS_ENABLED:"true", REPORT_TRUSTED_IP_HEADER:"", REPORT_ABUSE_SECRET:"SAMPLE test secret only with at least 32 characters",QUIETSPACE_TEST_OUTPUT:".next-postgres-test",NEXT_TELEMETRY_DISABLED:"1" } }] : []),
  ],
});
