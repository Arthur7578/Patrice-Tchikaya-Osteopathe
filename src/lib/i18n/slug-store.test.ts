import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const blobs: Array<{ pathname: string; uploadedAt: Date }> = [];
const list = vi.fn(async ({ cursor }: { prefix: string; cursor?: string; limit: number }) =>
  cursor === undefined
    ? { blobs: blobs.slice(0, 2), hasMore: blobs.length > 2, cursor: "page2" }
    : { blobs: blobs.slice(2), hasMore: false },
);
const put = vi.fn(async (pathname: string) => {
  if (blobs.some((b) => b.pathname === pathname)) throw new Error("This blob already exists");
  blobs.push({ pathname, uploadedAt: new Date(5000) });
  return {};
});
vi.mock("@vercel/blob", () => ({ list, put }));

const { blobSlugStore: storeFor, parseSlugPath, slugPath } = await import("./slug-store");
const blobSlugStore = (env: Record<string, string>) => storeFor(env as unknown as NodeJS.ProcessEnv);

beforeEach(() => {
  blobs.length = 0;
  list.mockClear();
  put.mockClear();
});

describe("chemins des enregistrements", () => {
  it("aller-retour ; tout autre chemin est ignoré", () => {
    const record = { pageKey: "3e84bf3f-0001", frSlug: "mal-de-dos", locale: "de" as const, slug: "ruckenschmerzen" };
    expect(slugPath(record)).toBe("i18n/slugs/3e84bf3f-0001/mal-de-dos/de/ruckenschmerzen");
    expect(parseSlugPath(slugPath(record), new Date(42))).toEqual({ ...record, createdAt: 42 });
    for (const bad of ["photo.jpg", "i18n/slugs/a/b/xx/c", "i18n/slugs/a/b/de", "i18n/slugs/a/b/de/c/d"]) expect(parseSlugPath(bad, new Date())).toBeNull();
  });
});

describe("blobSlugStore", () => {
  it("sans store Blob configuré (dev, CI) : null", () => {
    expect(blobSlugStore({})).toBeNull();
    expect(blobSlugStore({ BLOB_STORE_ID: "store_x" })).not.toBeNull();
    expect(blobSlugStore({ BLOB_READ_WRITE_TOKEN: "jeton" })).not.toBeNull();
  });

  it("liste toutes les pages de résultats et ne garde que les enregistrements de slugs", async () => {
    blobs.push(
      { pathname: "i18n/slugs/p1/a/de/a-de", uploadedAt: new Date(1) },
      { pathname: "photo-hero.jpg", uploadedAt: new Date(2) },
      { pathname: "i18n/slugs/p1/a/en/a-en", uploadedAt: new Date(3) },
    );
    const records = await blobSlugStore({ BLOB_STORE_ID: "s" })!.list();
    expect(records.map((r) => `${r.locale}:${r.slug}:${r.createdAt}`)).toEqual(["de:a-de:1", "en:a-en:3"]);
    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ prefix: "i18n/slugs/" }));
  });

  it("création : fichier public sans suffixe aléatoire (l'adresse est le contenu) ; déjà existant : ignoré", async () => {
    const store = blobSlugStore({ BLOB_STORE_ID: "s" })!;
    const record = { pageKey: "p1", frSlug: "a", locale: "pt" as const, slug: "a-pt" };
    await store.create(record);
    expect(put).toHaveBeenCalledWith("i18n/slugs/p1/a/pt/a-pt", "1", { access: "public", addRandomSuffix: false, contentType: "text/plain" });
    await expect(store.create(record)).resolves.toBeUndefined();
  });

  it("autre erreur d'écriture (enregistrement absent) : levée", async () => {
    put.mockRejectedValueOnce(new Error("panne"));
    await expect(blobSlugStore({ BLOB_STORE_ID: "s" })!.create({ pageKey: "p", frSlug: "a", locale: "de", slug: "b" })).rejects.toThrow("panne");
  });
});
