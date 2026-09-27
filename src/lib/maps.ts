import type { SiteContent } from "@/lib/content/types";

const fullAddress = (c: SiteContent) =>
  `${c.contact.street}, ${c.contact.postalCode} ${c.contact.locality}, ${c.contact.countryName}`;

/** Lien « voir sur la carte » (Maps URLs officielles, sans clé API). */
export const googleMapsSearchUrl = (c: SiteContent) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.practitioner.name} ostéopathe, ${fullAddress(c)}`)}`;

/** Lien « itinéraire ». */
export const googleMapsDirectionsUrl = (c: SiteContent) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(c))}`;
