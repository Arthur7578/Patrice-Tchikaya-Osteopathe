import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT } from "./fallback";

vi.mock("server-only", () => ({}));
// `cache` de React n'existe qu'en runtime Next : on le rend transparent pour tester chaque appel.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T>(fn: T) => fn }));

const fetchSiteContent = vi.fn();
vi.mock("@/lib/notion/fetch-content", () => ({ fetchSiteContent }));
vi.mock("@/lib/notion/client", () => ({ createNotionClient: vi.fn(() => ({})) }));

const { getSiteContent } = await import("./get-site-content");

describe("getSiteContent", () => {
  beforeEach(() => {
    fetchSiteContent.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NOTION_TOKEN", "");
    vi.stubEnv("VERCEL_ENV", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sans NOTION_TOKEN (dev/CI) : renvoie le contenu de secours", async () => {
    expect(await getSiteContent()).toBe(FALLBACK_CONTENT);
    expect(fetchSiteContent).not.toHaveBeenCalled();
  });

  it("sans NOTION_TOKEN en production Vercel : lève au lieu de servir le snapshot", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(getSiteContent()).rejects.toThrow(/NOTION_TOKEN manquant/);
  });

  it("avec NOTION_TOKEN : renvoie le contenu Notion et journalise les avertissements", async () => {
    vi.stubEnv("NOTION_TOKEN", "tok");
    fetchSiteContent.mockResolvedValue({ content: { ...FALLBACK_CONTENT, faq: [] }, warnings: ["colonne absente"] });
    expect((await getSiteContent()).faq).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith("[notion] colonne absente");
  });

  it("erreur API Notion : propage l'erreur (jamais de repli silencieux)", async () => {
    vi.stubEnv("NOTION_TOKEN", "tok");
    fetchSiteContent.mockRejectedValue(new Error("Notion 500"));
    await expect(getSiteContent()).rejects.toThrow("Notion 500");
  });
});
