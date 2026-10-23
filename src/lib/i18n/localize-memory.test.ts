import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => Promise<unknown>) => fn }));
// Cache disque du build simulé (partagé entre les instances du module, comme le disque entre deux builds).
const disk = new Map<string, unknown>();
vi.mock("./file-cache", () => ({
  sharedOnDisk: async (key: string, compute: () => Promise<unknown>) => {
    if (!disk.has(key)) disk.set(key, await compute());
    return disk.get(key);
  },
}));
// Mémoire de traduction simulée (le store Blob est testé dans memory.test.ts).
const saved = new Map<string, string>();
let dropWrites = false;
const load = vi.fn(async () => new Map(saved));
const save = vi.fn(async (entries: Record<string, string>) => {
  if (!dropWrites) for (const [k, v] of Object.entries(entries)) saved.set(k, v);
});
vi.mock("./memory", async (orig) => ({
  ...(await orig<typeof import("./memory")>()),
  blobTranslationMemory: () => ({ load, save }),
}));
const translator = vi.fn<(batch: Record<string, string>, locale: string) => Promise<Record<string, string>>>(async (batch, locale) =>
  Object.fromEntries(Object.entries(batch).filter(([k]) => k !== "refuse").map(([k, v]) => [k, `[${locale}]${v}`])),
);
vi.mock("./translate", async (orig) => ({ ...(await orig<typeof import("./translate")>()), createClaudeTranslator: () => translator }));

const { memoryKey } = await import("./memory");
/** Module neuf (nouveau processus : rien en mémoire vive). */
const fresh = async () => {
  vi.resetModules();
  return (await import("./localize")).translateTexts;
};

describe("traduction avec la mémoire (partagée par tous les déploiements)", () => {
  beforeEach(() => {
    saved.clear();
    disk.clear();
    dropWrites = false;
    load.mockClear();
    save.mockClear();
    translator.mockClear();
    vi.stubEnv("ANTHROPIC_API_KEY", "cle");
    return () => vi.unstubAllEnvs();
  });

  it("seuls les textes jamais traduits partent à l'API ; les traductions validées sont enregistrées", async () => {
    saved.set(memoryKey("de", "Bonjour"), "Guten Tag");
    const translateTexts = await fresh();
    expect(await translateTexts({ a: "Bonjour", b: "Merci" }, "de")).toEqual({ a: "Guten Tag", b: "[de]Merci" });
    expect(translator).toHaveBeenCalledTimes(1);
    expect(translator.mock.calls[0]![0]).toEqual({ b: "Merci" });
    expect(save).toHaveBeenCalledTimes(1); // pas de recopie en double après la traduction
    expect(save).toHaveBeenCalledWith({ [memoryKey("de", "Merci")]: "[de]Merci" });
  });

  it("tout est en mémoire (ex. build de production après la preview) : aucun appel à l'API", async () => {
    saved.set(memoryKey("en", "Bonjour"), "Hello");
    saved.set(memoryKey("en", "Merci"), "Thanks");
    const translateTexts = await fresh();
    expect(await translateTexts({ x: "Bonjour", y: "Merci" }, "en")).toEqual({ x: "Hello", y: "Thanks" });
    expect(translator).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("lecture en cache périmée : relue sans cache avant d'appeler l'API (traduit entre-temps par un autre build)", async () => {
    saved.set(memoryKey("en", "Bonjour"), "Hello");
    load.mockResolvedValueOnce(new Map()); // lecture en cache (5 min) : pas encore à jour
    const translateTexts = await fresh();
    expect(await translateTexts({ x: "Bonjour" }, "en")).toEqual({ x: "Hello" });
    expect(translator).not.toHaveBeenCalled();
  });

  it("un texte non traduit (refusé 3 fois) n'est pas enregistré : il sera redemandé", async () => {
    const translateTexts = await fresh();
    expect(await translateTexts({ ok: "Oui", refuse: "Non" }, "pt")).toEqual({ ok: "[pt]Oui" });
    expect(save).toHaveBeenCalledWith({ [memoryKey("pt", "Oui")]: "[pt]Oui" });
  });

  it("traduction servie par le cache d'un build mais absente de la mémoire : recopiée, sans appel à l'API", async () => {
    dropWrites = true; // traduction faite avant la mémoire (ou écriture perdue)
    await (await fresh())({ a: "Merci", b: "OK" }, "lb");
    expect(saved.size).toBe(0);
    dropWrites = false;
    translator.mockClear();
    save.mockClear();
    await (await fresh())({ a: "Merci", b: "OK" }, "lb"); // autre processus : servi par le cache disque
    expect(translator).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith({ [memoryKey("lb", "Merci")]: "[lb]Merci", [memoryKey("lb", "OK")]: "[lb]OK" });
  });

  it("recopie : un texte identique au français n'est pas recopié (peut-être laissé en français après 3 refus)", async () => {
    disk.clear();
    translator.mockImplementationOnce(async (batch) => batch); // résultat d'un ancien build : français conservé
    dropWrites = true;
    await (await fresh())({ a: "Votre ostéopathe" }, "en");
    dropWrites = false;
    save.mockClear();
    await (await fresh())({ a: "Votre ostéopathe" }, "en");
    expect(save).not.toHaveBeenCalled();
  });
});
