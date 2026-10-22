import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";

vi.mock("server-only", () => ({}));
// Cache de données Next : simulé par une Map (clé = parties de clé), pour vérifier ce qui est mis en cache et sous quelle clé.
const store = new Map<string, unknown>();
const cacheOptions: unknown[] = [];
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[], options: unknown) => async () => {
    cacheOptions.push(options);
    const key = keyParts.join("|");
    if (!store.has(key)) store.set(key, await fn());
    return store.get(key);
  },
}));
const translator = vi.fn<(batch: Record<string, string>, locale: string, names?: string[]) => Promise<Record<string, string>>>(
  async (batch, locale) => Object.fromEntries(Object.entries(batch).map(([k, v]) => [k, `[${locale}]${v}`])),
);
vi.mock("./translate", async (orig) => ({
  ...(await orig<typeof import("./translate")>()),
  createClaudeTranslator: () => translator,
}));

const { localizeContent, TRANSLATIONS_TAG } = await import("./localize");

describe("localizeContent", () => {
  beforeEach(() => {
    store.clear();
    cacheOptions.length = 0;
    translator.mockClear();
    vi.stubEnv("ANTHROPIC_API_KEY", "cle");
    // Cache disque propre à chaque test (sinon une traduction d'un test précédent serait relue).
    vi.stubEnv("TRANSLATION_CACHE_DIR", mkdtempSync(join(tmpdir(), "translations-")));
  });
  afterEach(() => {
    rmSync(process.env.TRANSLATION_CACHE_DIR!, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it("traduit chaque lot (en parallèle) et applique les traductions", async () => {
    const out = await localizeContent(C, "pt");
    expect(out.locale).toBe("pt");
    expect(out.seo.h1).toBe(`[pt]${C.seo.h1}`);
    expect(translator.mock.calls.every(([, locale]) => locale === "pt")).toBe(true);
    // Noms du praticien transmis à la vérification (« Dr Tchikaya » refusé).
    expect(translator.mock.calls[0]![2]).toEqual(C.practitioner.name.split(" "));
  });

  it("cache sans expiration, étiqueté (jamais purgé par /api/revalidate) : un contenu inchangé n'est pas retraduit", async () => {
    await localizeContent(C, "en");
    const calls = translator.mock.calls.length;
    await localizeContent(C, "en");
    expect(translator.mock.calls.length).toBe(calls);
    expect(cacheOptions[0]).toEqual({ revalidate: false, tags: [TRANSLATIONS_TAG] });
  });

  it("une modification ne fait retraduire que son lot", async () => {
    await localizeContent(C, "en");
    translator.mockClear();
    await localizeContent({ ...C, faq: [{ question: "Nouvelle ?", answer: "Oui." }, ...C.faq.slice(1)] }, "en");
    expect(translator).toHaveBeenCalledTimes(1);
    expect(Object.keys(translator.mock.calls[0]![0])).toContain("faq.0.q");
  });

  it("une autre langue est un autre lot", async () => {
    await localizeContent(C, "en");
    translator.mockClear();
    await localizeContent(C, "lb");
    expect(translator).toHaveBeenCalled();
  });

  it("une erreur n'est pas mise en cache : l'appel suivant réessaie", async () => {
    translator.mockRejectedValueOnce(new Error("panne"));
    await expect(localizeContent(C, "en")).rejects.toThrow("panne");
    await expect(localizeContent(C, "en")).resolves.toMatchObject({ locale: "en" });
  });

  it("sans clé API, en mode identity (CI) : texte français, sans appel à l'API", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("TRANSLATION_MODE", "identity");
    const out = await localizeContent(C, "en");
    expect(out.seo.h1).toBe(C.seo.h1);
    expect(out.locale).toBe("en");
    expect(translator).not.toHaveBeenCalled();
  });
});
