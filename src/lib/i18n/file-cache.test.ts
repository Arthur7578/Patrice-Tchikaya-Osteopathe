import { existsSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { sharedOnDisk, translationCacheDir } = await import("./file-cache");

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "file-cache-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("sharedOnDisk", () => {
  it("appels simultanés (processus du build) : un seul calcul, même résultat pour tous", async () => {
    let calls = 0;
    const compute = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 30));
      return { a: "Hello" };
    };
    const results = await Promise.all([1, 2, 3].map(() => sharedOnDisk("k", compute, { dir, pollMs: 5 })));
    expect(results).toEqual([{ a: "Hello" }, { a: "Hello" }, { a: "Hello" }]);
    expect(calls).toBe(1);
    expect(readdirSync(dir)).toEqual(["k.json"]); // ni verrou ni fichier temporaire laissés
  });

  it("résultat relu sur disque (build suivant) sans recalcul", async () => {
    await sharedOnDisk("k", async () => ({ a: "Hello" }), { dir });
    const compute = vi.fn(async () => ({ a: "autre" }));
    expect(await sharedOnDisk("k", compute, { dir })).toEqual({ a: "Hello" });
    expect(compute).not.toHaveBeenCalled();
  });

  it("erreur : rien n'est écrit, le verrou est libéré, l'appel suivant recalcule", async () => {
    await expect(sharedOnDisk("k", async () => Promise.reject(new Error("panne")), { dir })).rejects.toThrow("panne");
    expect(readdirSync(dir)).toEqual([]);
    expect(await sharedOnDisk("k", async () => ({ a: "ok" }), { dir })).toEqual({ a: "ok" });
  });

  it("verrou abandonné (processus arrêté) : ignoré après le délai", async () => {
    writeFileSync(join(dir, "k.json.lock"), "");
    const old = new Date(Date.now() - 60_000);
    utimesSync(join(dir, "k.json.lock"), old, old);
    expect(await sharedOnDisk("k", async () => ({ a: "ok" }), { dir, staleMs: 1_000, pollMs: 5 })).toEqual({ a: "ok" });
    expect(existsSync(join(dir, "k.json.lock"))).toBe(false);
  });
});

describe("translationCacheDir", () => {
  it("TRANSLATION_CACHE_DIR si défini (créé au besoin), sinon .next/cache/translations", () => {
    vi.stubEnv("TRANSLATION_CACHE_DIR", join(dir, "sous-dossier"));
    expect(translationCacheDir()).toBe(join(dir, "sous-dossier"));
    expect(existsSync(join(dir, "sous-dossier"))).toBe(true);
    vi.stubEnv("TRANSLATION_CACHE_DIR", "");
    expect(translationCacheDir()).toBe(join(process.cwd(), ".next/cache/translations"));
  });
});
