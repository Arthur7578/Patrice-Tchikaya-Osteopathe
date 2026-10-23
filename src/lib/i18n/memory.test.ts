import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// Store Blob simulé : chemin → contenu.
const files = new Map<string, string>();
const list = vi.fn(async ({ prefix }: { prefix: string; cursor?: string; limit: number }) => ({
  blobs: [...files.keys()].filter((p) => p.startsWith(prefix)).map((pathname) => ({ pathname })),
  hasMore: false,
}));
const get = vi.fn(async (pathname: string) =>
  files.has(pathname) ? { statusCode: 200, stream: new Response(files.get(pathname)).body } : null,
);
const put = vi.fn(async (pathname: string, body: string, options: { allowOverwrite?: boolean }) => {
  if (files.has(pathname) && !options.allowOverwrite) throw new Error("This blob already exists");
  files.set(pathname, body);
  return {};
});
vi.mock("@vercel/blob", () => ({ list, get, put }));

const { blobTranslationMemory: memoryFor, memoryKey } = await import("./memory");
const memory = (env: Record<string, string> = { BLOB_STORE_ID: "store_x" }) => memoryFor(env as unknown as NodeJS.ProcessEnv);

beforeEach(() => {
  files.clear();
  vi.restoreAllMocks();
});

describe("memoryKey", () => {
  it("dépend du texte et de la langue, pas du modèle", () => {
    expect(memoryKey("en", "Bonjour")).toBe(memoryKey("en", "Bonjour"));
    expect(memoryKey("en", "Bonjour")).not.toBe(memoryKey("de", "Bonjour"));
    expect(memoryKey("en", "Bonjour")).not.toBe(memoryKey("en", "Bonjour !"));
  });
});

describe("blobTranslationMemory", () => {
  it("sans store Blob configuré (dev, CI) : null", () => {
    expect(memory({})).toBeNull();
    expect(memory({ BLOB_READ_WRITE_TOKEN: "jeton" })).not.toBeNull();
  });

  it("enregistre puis relit ; fichiers jamais réécrits, nommés par leur contenu (pas d'écrasement entre processus)", async () => {
    const m = memory()!;
    await m.save({ k1: "Hello" });
    await m.save({ k2: "Bye" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await m.save({ k1: "Hello" }); // même contenu : même fichier, réécrit à l'identique (deux processus), sans erreur
    expect(warn).not.toHaveBeenCalled();
    expect(files.size).toBe(2);
    expect([...files.keys()].every((p) => /^i18n\/translations\/[0-9a-f]{64}\.json$/.test(p))).toBe(true);
    expect(put).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ addRandomSuffix: false, allowOverwrite: true }));
    expect(await m.load()).toEqual(new Map([["k1", "Hello"], ["k2", "Bye"]]));
  });

  it("rien à enregistrer : aucune écriture", async () => {
    await memory()!.save({});
    expect(put).not.toHaveBeenCalled();
  });

  it("échec d'écriture : signalé, sans bloquer la page (au pire, une retraduction plus tard)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    put.mockRejectedValueOnce(new Error("store indisponible"));
    await expect(memory()!.save({ k: "v" })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("store indisponible"));
  });
});
