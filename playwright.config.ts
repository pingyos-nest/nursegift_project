import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests. They change data (add/delete winners & prizes, then clean up),
 * so run them against a local/test database only — never production.
 *
 *   npm run dev            # with DEV_LOGIN=true in .env.local
 *   npm run test:e2e       # uses system Chrome; BASE_URL defaults to http://localhost:3000/dev/nursegift
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  outputDir: "e2e/test-results",
  use: {
    baseURL: (process.env.BASE_URL ?? "http://localhost:3000/dev/nursegift") + "/",
    channel: "chrome",
    viewport: { width: 1280, height: 860 },
  },
});
