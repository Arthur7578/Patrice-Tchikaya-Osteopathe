import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_UPLOAD_SECRET } from "./e2e/constants";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * e2e sur le build de production : `npm run build` d'abord (ou laisser CI le faire), puis `npm run test:e2e`.
 * Chromium préinstallé (env cloud) : PLAYWRIGHT_CHROMIUM_PATH ou /opt/pw-browsers ; jamais de `playwright install`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Active l'outil d'upload (/admin/photos) pour le tester ; sans BLOB_READ_WRITE_TOKEN, aucun envoi réel.
    env: { ADMIN_UPLOAD_SECRET: E2E_ADMIN_UPLOAD_SECRET },
  },
});
