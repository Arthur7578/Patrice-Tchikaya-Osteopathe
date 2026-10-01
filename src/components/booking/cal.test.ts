// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCalApi = vi.fn();
vi.mock("@calcom/embed-react", () => ({ getCalApi }));

/** Le module garde l'API popup en cache : on le recharge pour chaque test. */
async function loadCal() {
  vi.resetModules();
  return import("./cal");
}

describe("cal.ts", () => {
  beforeEach(() => {
    getCalApi.mockReset();
    delete (window as { Cal?: unknown }).Cal;
  });
  afterEach(() => vi.useRealTimers());

  it("namespaces distincts popup / inline (le 1er init d'un namespace fige son origine)", async () => {
    const { CAL_INLINE_NAMESPACE, CAL_POPUP_NAMESPACE, CAL_CONFIG } = await loadCal();
    expect(CAL_POPUP_NAMESPACE).not.toBe(CAL_INLINE_NAMESPACE);
    expect(CAL_POPUP_NAMESPACE && CAL_INLINE_NAMESPACE).toBeTruthy(); // vide = espace de noms par défaut de Cal.com
    expect(CAL_CONFIG).toEqual({ layout: "month_view", theme: "light" });
  });

  it("loadCalPopup : initialise le namespace popup une seule fois", async () => {
    const api = Promise.resolve(vi.fn());
    getCalApi.mockReturnValue(api);
    const { loadCalPopup, CAL_POPUP_NAMESPACE } = await loadCal();
    expect(loadCalPopup()).toBe(api);
    expect(loadCalPopup()).toBe(api);
    expect(getCalApi).toHaveBeenCalledTimes(1);
    expect(getCalApi).toHaveBeenCalledWith({ namespace: CAL_POPUP_NAMESPACE });
  });

  it("waitForCalScript : se résout dès que embed.js a posé window.Cal.version", async () => {
    vi.useFakeTimers();
    const { waitForCalScript } = await loadCal();
    let settled = false;
    const promise = waitForCalScript(5000).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(300);
    expect(settled).toBe(false);
    (window as { Cal?: unknown }).Cal = { version: "1.5.3" };
    await vi.advanceTimersByTimeAsync(100);
    await promise;
    expect(settled).toBe(true);
  });

  it("waitForCalScript : déjà chargé → résolu immédiatement", async () => {
    (window as { Cal?: unknown }).Cal = { version: "1.5.3" };
    const { waitForCalScript } = await loadCal();
    await expect(waitForCalScript(0)).resolves.toBeUndefined();
  });

  it("waitForCalScript : rejette après le délai (bloqueur, réseau) pour basculer sur le lien direct", async () => {
    vi.useFakeTimers();
    const { waitForCalScript } = await loadCal();
    (window as { Cal?: unknown }).Cal = {}; // file d'attente posée par getCalApi, script pas encore exécuté
    const promise = waitForCalScript(1000);
    const rejection = expect(promise).rejects.toThrow("Cal.com embed indisponible");
    await vi.advanceTimersByTimeAsync(900);
    await vi.advanceTimersByTimeAsync(300);
    await rejection;
  });

  it("waitForCalScript : n'abandonne pas avant le délai", async () => {
    vi.useFakeTimers();
    const { waitForCalScript } = await loadCal();
    let rejected = false;
    waitForCalScript(1000).catch(() => (rejected = true));
    await vi.advanceTimersByTimeAsync(950);
    expect(rejected).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(rejected).toBe(true);
  });
});
