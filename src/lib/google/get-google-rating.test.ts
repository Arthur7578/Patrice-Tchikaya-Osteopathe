import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T>(fn: T) => fn }));
const fetchPlaceRating = vi.fn();
vi.mock("./places", () => ({ fetchPlaceRating }));

const { getGoogleRating } = await import("./get-google-rating");

describe("getGoogleRating", () => {
  beforeEach(() => {
    fetchPlaceRating.mockReset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "clé");
    vi.stubEnv("GOOGLE_PLACE_ID", "place");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["clé absente", { GOOGLE_PLACES_API_KEY: "" }],
    ["Place ID absent", { GOOGLE_PLACE_ID: "" }],
  ])("désactivé (%s) : null, sans appel à Google", async (_l, env) => {
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    expect(await getGoogleRating()).toBeNull();
    expect(fetchPlaceRating).not.toHaveBeenCalled();
  });

  it("renvoie la note et la garde 1 h (revalidate 3600)", async () => {
    const rating = { value: 4.9, count: 30 };
    fetchPlaceRating.mockResolvedValue({ name: "Cabinet", rating });
    expect(await getGoogleRating()).toBe(rating);
    expect(fetchPlaceRating).toHaveBeenCalledWith({ apiKey: "clé", placeId: "place", revalidate: 3600 });
    expect(console.info).toHaveBeenCalledWith("[google] note de « Cabinet » : 4.9 (30 avis)");
  });

  it("journal : identifiant de la fiche si Google ne renvoie pas son nom, « ? » si le nombre d'avis est inconnu", async () => {
    fetchPlaceRating.mockResolvedValue({ name: null, rating: { value: 5, count: null } });
    await getGoogleRating();
    expect(console.info).toHaveBeenCalledWith("[google] note de « place » : 5 (? avis)");
  });

  it("aucune note renvoyée : null + avertissement (repli sur Notion)", async () => {
    fetchPlaceRating.mockResolvedValue({ name: null, rating: null });
    expect(await getGoogleRating()).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("[google] « place » : aucune note renvoyée → Note_Google (Notion)");
    fetchPlaceRating.mockResolvedValue({ name: "Cabinet", rating: null });
    await getGoogleRating();
    expect(console.warn).toHaveBeenCalledWith("[google] « Cabinet » : aucune note renvoyée → Note_Google (Notion)");
  });

  it("erreur API : jamais bloquant, null + avertissement", async () => {
    fetchPlaceRating.mockRejectedValue(new Error("timeout"));
    expect(await getGoogleRating()).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("[google] note indisponible (timeout) → Note_Google (Notion)");
  });

  it("erreur qui n'est pas une Error : convertie en texte", async () => {
    fetchPlaceRating.mockRejectedValue("réseau coupé");
    expect(await getGoogleRating()).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("[google] note indisponible (réseau coupé) → Note_Google (Notion)");
  });
});
