import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => Promise<unknown>) => fn }));
// Mémoire de traduction simulée (le store Blob est testé dans memory.test.ts).
const saved = new Map<string, string>();
const save = vi.fn(async (entries: Record<string, string>) => {
  for (const [k, v] of Object.entries(entries)) saved.set(k, v);
});
vi.mock("./memory", async (orig) => ({
  ...(await orig<typeof import("./memory")>()),
  blobTranslationMemory: () => ({ load: async () => new Map(saved), save }),
}));
const translator = vi.fn<(batch: Record<string, string>, locale: string) => Promise<Record<string, string>>>(async (batch, locale) =>
  Object.fromEntries(Object.entries(batch).filter(([k]) => k !== "refuse").map(([k, v]) => [k, `[${locale}]${v}`])),
);
vi.mock("./translate", async (orig) => ({ ...(await orig<typeof import("./translate")>()), createClaudeTranslator: () => translator }));

const { translateTexts } = await import("./localize");
const { memoryKey } = await import("./memory");

describe("traduction avec la mémoire (partagée par tous les déploiements)", () => {
  beforeEach(() => {
    saved.clear();
    save.mockClear();
    translator.mockClear();
    vi.stubEnv("ANTHROPIC_API_KEY", "cle");
    vi.stubEnv("TRANSLATION_CACHE_DIR", mkdtempSync(join(tmpdir(), "translations-")));
  });
  afterEach(() => {
    rmSync(process.env.TRANSLATION_CACHE_DIR!, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it("seuls les textes jamais traduits partent à l'API ; les traductions validées sont enregistrées", async () => {
    saved.set(memoryKey("de", "Bonjour"), "Guten Tag");
    expect(await translateTexts({ a: "Bonjour", b: "Merci" }, "de")).toEqual({ a: "Guten Tag", b: "[de]Merci" });
    expect(translator).toHaveBeenCalledTimes(1);
    expect(translator.mock.calls[0]![0]).toEqual({ b: "Merci" });
    expect(save).toHaveBeenCalledWith({ [memoryKey("de", "Merci")]: "[de]Merci" });
  });

  it("tout est en mémoire (ex. build de production après la preview) : aucun appel à l'API", async () => {
    saved.set(memoryKey("en", "Bonjour"), "Hello");
    saved.set(memoryKey("en", "Merci"), "Thanks");
    expect(await translateTexts({ x: "Bonjour", y: "Merci" }, "en")).toEqual({ x: "Hello", y: "Thanks" });
    expect(translator).not.toHaveBeenCalled();
  });

  it("un texte non traduit (refusé 3 fois) n'est pas enregistré : il sera redemandé", async () => {
    expect(await translateTexts({ ok: "Oui", refuse: "Non" }, "pt")).toEqual({ ok: "[pt]Oui" });
    expect(save).toHaveBeenCalledWith({ [memoryKey("pt", "Oui")]: "[pt]Oui" });
  });
});
