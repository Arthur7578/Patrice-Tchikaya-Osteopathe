import { COPY_FR } from "@/content/ui-copy";

/**
 * Mention « Google Maps » affichée à côté de la note Places (badge du hero, encart d'avis). Nom de marque, identique
 * dans toutes les langues : pas besoin de la langue de la page.
 * Le style est hérité du texte environnant (police, graisse, couleur) pour rester homogène ;
 * ce choix s'écarte du style d'attribution demandé par Google (voir docs/DECISIONS.md).
 */
export function GoogleMapsAttribution() {
  return <span translate="no">{COPY_FR.googleMaps}</span>;
}
