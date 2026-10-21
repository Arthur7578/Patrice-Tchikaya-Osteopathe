import { track } from "@vercel/analytics";
import type { Booking } from "@/lib/content/types";

/**
 * Emplacement du bouton de RDV cliqué : seule donnée envoyée avec l'événement (aucune donnée personnelle).
 * Sert à mesurer l'entrée dans le parcours de réservation, quel que soit le prestataire (voir docs/DECISIONS.md).
 */
export type BookingPlacement = "header" | "hero" | "mobile-bar" | "faq" | "infos" | "motif-hero" | "motif-cta" | "not-found";

export const BOOKING_CLICK_EVENT = "booking_click";

/**
 * Compte un clic sur un bouton de RDV :
 * - Vercel Web Analytics (sans cookie, donc sans consentement) : `track()` ne fait rien si le script est absent ;
 * - dataLayer GTM, seulement s'il existe, c'est-à-dire seulement si le visiteur a accepté les cookies
 *   (`CookieConsent` crée `window.dataLayer` avec le script GTM). Un déclencheur est à créer dans GTM.
 * Une erreur de mesure ne doit jamais empêcher la prise de RDV : tout est protégé.
 */
export function trackBookingClick(placement: BookingPlacement, provider: Booking["provider"]) {
  try {
    track(BOOKING_CLICK_EVENT, { placement, provider });
  } catch {
    // mesure perdue, RDV intact
  }
  const dataLayer = (window as { dataLayer?: unknown }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: BOOKING_CLICK_EVENT, booking_placement: placement, booking_provider: provider });
  }
}
