/**
 * Attribution exigée par Google quand une donnée de l'API Places (ici, la note) est affichée sans
 * carte Google : texte « Google Maps » inchangé (non traduit), Roboto ou sans-serif, graisse 400,
 * gris #5e5e5e (contraste 5,6:1 sur sage-100, 6,5:1 sur blanc).
 */
export function GoogleMapsAttribution() {
  return (
    <span translate="no" className="font-normal text-gmp-attribution [font-family:Roboto,sans-serif]">
      Google Maps
    </span>
  );
}
