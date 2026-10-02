import { normalizeSlug } from "./parse";

/**
 * Variables utilisables dans les textes de la FAQ (base `FAQ_SEO`) : « {tarif} » et « {duree} » sont remplacées
 * par les valeurs de `Informations_generales`. Le prix et la durée ne sont ainsi saisis qu'à un seul endroit :
 * les modifier dans Notion met à jour toutes les réponses qui les citent. Nom de variable -> clé Notion source.
 */
export const TEXT_VARIABLES = { tarif: "Tarif_Consultation", duree: "Duree_Consultation" } as const;

export type TextVariable = keyof typeof TEXT_VARIABLES;

const isTextVariable = (name: string | null): name is TextVariable => name !== null && Object.hasOwn(TEXT_VARIABLES, name);

/**
 * Remplace chaque « {nom} » par sa valeur ; noms insensibles à la casse, aux accents et aux espaces (« { Durée } »).
 * Variable inconnue (faute de frappe) ou sans valeur (tarif non renseigné) : `null` + message, pour masquer le texte
 * plutôt que de publier « {tarif} » ou une phrase tronquée (« coûte , réglée… »).
 */
export function fillVariables(
  text: string,
  values: Record<TextVariable, string | null>,
  onError: (message: string) => void,
): string | null {
  let complete = true;
  const filled = text.replace(/\{([^{}]*)\}/g, (match, raw: string) => {
    const name = normalizeSlug(raw);
    if (!isTextVariable(name)) {
      complete = false;
      const known = Object.keys(TEXT_VARIABLES).map((v) => `{${v}}`).join(", ");
      onError(`variable inconnue « ${match} » (disponibles : ${known})`);
      return match;
    }
    const value = values[name];
    if (value === null) {
      complete = false;
      onError(`« ${match} » sans valeur (${TEXT_VARIABLES[name]} non renseigné)`);
      return match;
    }
    return value;
  });
  return complete ? filled : null;
}
