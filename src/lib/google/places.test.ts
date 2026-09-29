import { describe, expect, it, vi } from "vitest";
import { fetchPlaceRating, parsePlaceRating } from "./places";

describe("parsePlaceRating", () => {
  it("lit la note et le nombre d'avis", () => {
    expect(parsePlaceRating({ displayName: { text: "Patrice Tchikaya" }, rating: 4.9, userRatingCount: 23 })).toEqual({
      name: "Patrice Tchikaya",
      rating: { value: 4.9, count: 23 },
    });
  });
  it("renvoie une note nulle si la fiche n'a pas d'avis ou si la réponse est inattendue", () => {
    expect(parsePlaceRating({ displayName: { text: "Cabinet" } }).rating).toBeNull();
    expect(parsePlaceRating({ rating: 7 }).rating).toBeNull();
    expect(parsePlaceRating({ rating: "5" }).rating).toBeNull();
    expect(parsePlaceRating(null)).toEqual({ name: null, rating: null });
    expect(parsePlaceRating({ rating: 5, userRatingCount: 2.5 }).rating).toEqual({ value: 5, count: null });
  });
});

describe("fetchPlaceRating", () => {
  it("appelle Place Details (New) avec la clé et un masque de champs minimal, mis en cache par Next", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ displayName: { text: "X" }, rating: 5, userRatingCount: 3 }));
    const result = await fetchPlaceRating({ apiKey: "k", placeId: "ChIJ abc", revalidate: 3600, fetchImpl });
    expect(result.rating).toEqual({ value: 5, count: 3 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate?: number } }];
    expect(url).toBe("https://places.googleapis.com/v1/places/ChIJ%20abc");
    expect(init.headers).toEqual({ "X-Goog-Api-Key": "k", "X-Goog-FieldMask": "displayName,rating,userRatingCount" });
    expect(init.next).toEqual({ revalidate: 3600 });
  });
  it("lève une erreur lisible si l'API refuse la requête", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: { message: "API key not valid." } }, { status: 400 }),
    );
    await expect(fetchPlaceRating({ apiKey: "bad", placeId: "p", revalidate: 3600, fetchImpl })).rejects.toThrow(
      "Places API 400 : API key not valid.",
    );
  });
});
