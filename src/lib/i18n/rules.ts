/** Règle 10 en français : l'ostéopathe n'est ni « médecin » ni « Dr ». */
export const FRENCH_FORBIDDEN_TITLES = /médecin|\bDr\b/i;

/**
 * Règle 10 dans toutes les langues du site : « médecin » / « Dr » et leurs équivalents (anglais, luxembourgeois,
 * allemand). Le portugais « médico » n'y est pas : c'est aussi l'adjectif « médical » (« acompanhamento médico ») ;
 * les consignes du traducteur l'interdisent comme titre.
 */
export const FORBIDDEN_TITLES = /médecin|\bDr\b|\bdoctors?\b|\bphysicians?\b|\bDokter\b|\bDoktor\b|\bArzt\b|\bdoutor\b/i;
