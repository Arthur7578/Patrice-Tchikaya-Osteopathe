import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_UPLOAD_SECRET } from "./e2e/constants";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * e2e sur le build de production : `npm run build` d'abord (ou laisser CI le faire), puis `npm run test:e2e`.
 * Chromium préinstallé (env cloud) : PLAYWRIGHT_CHROMIUM_PATH ou /opt/pw-browsers ; jamais de `playwright install`.
 * Safari (WebKit, projet « iphone ») : en CI seulement, l'environnement cloud n'a pas WebKit.
 */
const chromium = {
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...chromium } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...chromium } },
    // Une grande part des visiteurs mobiles sont sur iPhone (Safari) : même parcours, moteur WebKit.
    ...(process.env.CI ? [{ name: "iphone", use: { ...devices["iPhone 13"] } }] : []),
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
