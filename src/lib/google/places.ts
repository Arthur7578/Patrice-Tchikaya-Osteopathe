import type { Rating } from "@/lib/content/types";

/** Places API (New) — Place Details : https://developers.google.com/maps/documentation/places/web-service/place-details */
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places/";

/**
 * `rating` et `userRatingCount` relèvent du SKU « Place Details Enterprise » (le plus élevé demandé
 * fixe le prix). `displayName` n'ajoute donc aucun coût et sert à vérifier dans les logs de build que
 * le Place ID désigne bien la fiche du cabinet.
 */
const FIELD_MASK = "displayName,rating,userRatingCount";

export type PlaceRating = { name: string | null; rating: Rating | null };

/** Réponse JSON -> note ; `rating: null` si la fiche n'a pas encore d'avis ou si la réponse est inattendue. */
export function parsePlaceRating(data: unknown): PlaceRating {
  const d = (data ?? {}) as { displayName?: { text?: unknown }; rating?: unknown; userRatingCount?: unknown };
  const name = typeof d.displayName?.text === "string" ? d.displayName.text : null;
  const value = typeof d.rating === "number" && d.rating >= 1 && d.rating <= 5 ? d.rating : null;
  const count =
    typeof d.userRatingCount === "number" && Number.isInteger(d.userRatingCount) && d.userRatingCount > 0
      ? d.userRatingCount
      : null;
  return { name, rating: value === null ? null : { value, count } };
}

type FetchPlaceRatingOptions = {
  apiKey: string;
  placeId: string;
  /** Durée de cache (s) du Data Cache Next : un seul appel facturé par période, partagé par toutes les pages. */
  revalidate: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/** Lève une erreur si l'API répond en erreur (clé invalide, Place ID inconnu, quota…) ou ne répond pas à temps. */
export async function fetchPlaceRating({
  apiKey,
  placeId,
  revalidate,
  timeoutMs = 5000,
  fetchImpl = fetch,
}: FetchPlaceRatingOptions): Promise<PlaceRating> {
  const res = await fetchImpl(`${PLACE_DETAILS_URL}${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate },
  });
  if (!res.ok) {
    const detail = await res.json().then(
      (body: { error?: { message?: string } }) => body?.error?.message,
      () => undefined,
    );
    throw new Error(`Places API ${res.status}${detail ? ` : ${detail}` : ""}`);
  }
  return parsePlaceRating(await res.json());
}
