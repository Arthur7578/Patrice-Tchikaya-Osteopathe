import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT } from "./fallback";

vi.mock("server-only", () => ({}));
// `cache` de React n'existe qu'en runtime Next : on le rend transparent pour tester chaque appel.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T>(fn: T) => fn }));

// `unstable_cache` n'existe qu'en runtime Next : on le rend transparent, en gardant ses arguments pour les vérifier.
const unstableCache = vi.fn(<T>(fn: T, ...args: unknown[]) => {
  void args;
  return fn;
});
vi.mock("next/cache", () => ({ unstable_cache: unstableCache }));

const localizeContent = vi.fn(async (content: object, locale: string) => ({ ...content, locale }));
vi.mock("@/lib/i18n/localize", () => ({ localizeContent }));
// Langues publiées : fixées ici (elles dépendent de la clé API, lue à l'import de @/config/i18n).
vi.mock("@/config/i18n", async (orig) => ({ ...(await orig<typeof import("@/config/i18n")>()), ENABLED_LOCALES: ["fr", "en"] }));

const fetchSiteContent = vi.fn();
vi.mock("@/lib/notion/fetch-content", () => ({ fetchSiteContent }));
vi.mock("@/lib/notion/client", () => ({ createNotionClient: vi.fn(() => ({})) }));

const { getSiteContent } = await import("./get-site-content");
// Appel fait à l'import du module : relevé avant que les mocks soient réinitialisés entre les tests.
const cacheArgs = unstableCache.mock.calls[0]!.slice(1);

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
    expect(console.warn).toHaveBeenCalledWith("[content] NOTION_TOKEN absent → contenu de secours (src/lib/content/fallback.ts)");
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

  it("la lecture Notion est mise en cache (étiquette purgée par /api/revalidate, 60 s) sans jeton dans la clé", () => {
    expect(cacheArgs).toEqual([["site-content"], { revalidate: 60, tags: ["site-content"] }]);
  });

  it("erreur API Notion : propage l'erreur (jamais de repli silencieux)", async () => {
    vi.stubEnv("NOTION_TOKEN", "tok");
    fetchSiteContent.mockRejectedValue(new Error("Notion 500"));
    await expect(getSiteContent()).rejects.toThrow("Notion 500");
  });

  it("autre langue publiée : contenu français traduit (src/lib/i18n)", async () => {
    const content = await getSiteContent("en");
    expect(localizeContent).toHaveBeenCalledWith(FALLBACK_CONTENT, "en");
    expect(content.locale).toBe("en");
  });

  it("langue non publiée (traduction non configurée) : erreur, jamais de français sous une autre langue", async () => {
    await expect(getSiteContent("pt")).rejects.toThrow(/non publiée/);
  });

  it("français : page de réservation Doctena en français, même si l'URL collée dans Notion est en anglais", async () => {
    vi.stubEnv("NOTION_TOKEN", "tok");
    const booking = { url: "https://www.doctena.lu/en/booking-form/calendar/abc", provider: "generic" as const, calLink: null, calOrigin: null };
    fetchSiteContent.mockResolvedValue({ content: { ...FALLBACK_CONTENT, booking }, warnings: [] });
    expect((await getSiteContent()).booking.url).toBe("https://www.doctena.lu/fr/booking-form/calendar/abc");
  });
});
