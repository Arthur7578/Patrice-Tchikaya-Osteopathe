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

describe("parsePlaceRating : bornes", () => {
  it("note entre 1 et 5 incluses ; 0 (fiche sans avis) ou hors bornes => pas de note", () => {
    expect(parsePlaceRating({ rating: 1 }).rating).toEqual({ value: 1, count: null });
    expect(parsePlaceRating({ rating: 5 }).rating).toEqual({ value: 5, count: null });
    expect(parsePlaceRating({ rating: 0 }).rating).toBeNull();
    expect(parsePlaceRating({ rating: 0.9 }).rating).toBeNull();
    expect(parsePlaceRating({ rating: 5.1 }).rating).toBeNull();
  });

  it("nombre d'avis : entier strictement positif, sinon inconnu", () => {
    expect(parsePlaceRating({ rating: 5, userRatingCount: 1 }).rating).toEqual({ value: 5, count: 1 });
    expect(parsePlaceRating({ rating: 5, userRatingCount: 0 }).rating).toEqual({ value: 5, count: null });
    expect(parsePlaceRating({ rating: 5, userRatingCount: -3 }).rating).toEqual({ value: 5, count: null });
    expect(parsePlaceRating({ rating: 5, userRatingCount: "12" }).rating).toEqual({ value: 5, count: null });
  });

  it("nom de la fiche : texte seulement", () => {
    expect(parsePlaceRating({ displayName: { text: 42 }, rating: 5 }).name).toBeNull();
    expect(parsePlaceRating({ displayName: "Cabinet", rating: 5 }).name).toBeNull();
  });
});

describe("fetchPlaceRating : erreurs de l'API", () => {
  const call = (response: Response) =>
    fetchPlaceRating({ apiKey: "k", placeId: "p", revalidate: 3600, fetchImpl: vi.fn(async () => response) });

  it("message exact, sans détail quand la réponse d'erreur n'en donne pas", async () => {
    await expect(call(Response.json({}, { status: 403 }))).rejects.toThrow(/^Places API 403$/);
    await expect(call(Response.json({ error: {} }, { status: 403 }))).rejects.toThrow(/^Places API 403$/);
    await expect(call(Response.json(null, { status: 500 }))).rejects.toThrow(/^Places API 500$/);
    await expect(call(new Response("<html>Bad gateway</html>", { status: 502 }))).rejects.toThrow(/^Places API 502$/);
  });

  it("avec détail : « Places API <statut> : <message> »", async () => {
    await expect(call(Response.json({ error: { message: "Quota dépassé." } }, { status: 429 }))).rejects.toThrow(
      /^Places API 429 : Quota dépassé\.$/,
    );
  });

  it("abandonne après le délai (5 s par défaut) : signal d'annulation transmis", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ rating: 5 }));
    await fetchPlaceRating({ apiKey: "k", placeId: "p", revalidate: 60, fetchImpl });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
