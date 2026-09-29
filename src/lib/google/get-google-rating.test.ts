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
  });

  it("aucune note renvoyée : null + avertissement (repli sur Notion)", async () => {
    fetchPlaceRating.mockResolvedValue({ name: null, rating: null });
    expect(await getGoogleRating()).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it("erreur API : jamais bloquant, null + avertissement", async () => {
    fetchPlaceRating.mockRejectedValue(new Error("timeout"));
    expect(await getGoogleRating()).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("timeout"));
  });
});
