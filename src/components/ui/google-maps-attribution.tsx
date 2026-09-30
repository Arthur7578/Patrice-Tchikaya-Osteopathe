import { COPY } from "@/content/ui-copy";

/**
 * Mention « Google Maps » affichée à côté de la note Places (badge du hero, encart d'avis).
 * Le style est hérité du texte environnant (police, graisse, couleur) pour rester homogène ;
 * ce choix s'écarte du style d'attribution demandé par Google (voir docs/DECISIONS.md).
 */
export function GoogleMapsAttribution() {
  return <span translate="no">{COPY.googleMaps}</span>;
}
