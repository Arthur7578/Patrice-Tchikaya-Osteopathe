import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadRobots() {
  vi.resetModules(); // ALLOW_INDEXING est évalué à l'import de @/config/site
  return (await import("./robots")).default();
}

describe("robots.txt", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ALLOW_INDEXING", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("hors production : interdit tout", async () => {
    expect(await loadRobots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("en production : autorise, protège /api/ et /admin/, déclare le sitemap", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const robots = await loadRobots();
    expect(robots.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] });
    expect(robots.sitemap).toMatch(/^https:\/\/.+\/sitemap\.xml$/);
  });

  it("ALLOW_INDEXING=true force l'indexation (hors Vercel)", async () => {
    vi.stubEnv("ALLOW_INDEXING", "true");
    expect((await loadRobots()).rules).toMatchObject({ allow: "/" });
  });
});
