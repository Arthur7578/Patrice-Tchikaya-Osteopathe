import "server-only";
import { cache } from "react";
import type { Rating } from "@/lib/content/types";
import { fetchPlaceRating } from "./places";

/** Aligné sur l'ISR du site (layout.tsx) : au plus un appel facturé par heure, toutes pages confondues. */
const REVALIDATE_SECONDS = 3600;

/**
 * Note Google en direct (API Google Places), pour ne pas avoir à la recopier dans Notion.
 * Désactivée tant que GOOGLE_PLACES_API_KEY et GOOGLE_PLACE_ID ne sont pas définies.
 * Jamais bloquante : en cas d'échec, null → le site garde Note_Google (Notion), ou masque la note.
 */
export const getGoogleRating = cache(async (): Promise<Rating | null> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;
  try {
    const { name, rating } = await fetchPlaceRating({ apiKey, placeId, revalidate: REVALIDATE_SECONDS });
    if (rating) console.info(`[google] note de « ${name ?? placeId} » : ${rating.value} (${rating.count ?? "?"} avis)`);
    else console.warn(`[google] « ${name ?? placeId} » : aucune note renvoyée → Note_Google (Notion)`);
    return rating;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[google] note indisponible (${reason}) → Note_Google (Notion)`);
    return null;
  }
});
