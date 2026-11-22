import { afterEach, describe, expect, it, vi } from "vitest";
import { isBuild, shareInFlight } from "./in-flight";

/** Promesse réglée à la main. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}

describe("shareInFlight", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("appels simultanés : une seule exécution, même résultat pour tous", async () => {
    const d = deferred<number>();
    const fn = vi.fn(() => d.promise);
    const shared = shareInFlight(fn);
    const all = Promise.all([shared(), shared(), shared()]);
    d.resolve(7);
    expect(await all).toEqual([7, 7, 7]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("sans keep : oublié une fois réglé (l'appel suivant relit)", async () => {
    const fn = vi.fn(async () => 1);
    const shared = shareInFlight(fn);
    await shared();
    await shared();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("keep vrai : résultat gardé pour la suite du processus", async () => {
    const fn = vi.fn(async () => 1);
    const shared = shareInFlight(fn, { keep: () => true });
    await shared();
    await shared();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("une erreur n'est jamais gardée, même avec keep : l'appel suivant réessaie", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValueOnce(2);
    const shared = shareInFlight(fn as () => Promise<number>, { keep: () => true });
    await expect(shared()).rejects.toThrow("réseau");
    expect(await shared()).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("une clé par argument : deux clés différentes, deux exécutions", async () => {
    const fn = vi.fn(async (x: string) => x.toUpperCase());
    const shared = shareInFlight(fn, { key: (x) => x });
    expect(await Promise.all([shared("a"), shared("b"), shared("a")])).toEqual(["A", "B", "A"]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("isBuild : vrai seulement pendant next build", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(isBuild()).toBe(true);
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    expect(isBuild()).toBe(false);
  });
});
