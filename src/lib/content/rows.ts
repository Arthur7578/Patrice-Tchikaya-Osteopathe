/**
 * Blocs de la section « Infos pratiques » (dont le bloc « Accès », qui groupe ses propres lignes), dans leur ordre par défaut.
 * Patrice peut les réordonner depuis Notion (clés `Infos_Ordre` pour les blocs, `Acces_Ordre` pour les lignes du bloc Accès ; base
 * `Informations_generales`) : une liste d'identifiants séparés par des virgules, ex. « tarif, duree, horaires ».
 * `reglement` : la ligne « Règlement » (phrase `Info_Paiement` + lien vers /paiement).
 */
export const INFO_ROW_IDS = ["acces", "telephone", "duree", "tarif", "reglement", "remboursement", "horaires", "langues"] as const;
export const ACCESS_ROW_IDS = ["adresse", "train", "bus", "parking", "pmr"] as const;

export type InfoRowId = (typeof INFO_ROW_IDS)[number];
export type AccessRowId = (typeof ACCESS_ROW_IDS)[number];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/**
 * Ordre saisi dans Notion -> ordre complet. Identifiants insensibles à la casse et aux accents ;
 * séparateurs : virgule, point-virgule, retour à la ligne. Une ligne oubliée n'est jamais perdue :
 * elle est ajoutée à la fin dans l'ordre par défaut. Les identifiants inconnus sont signalés puis ignorés.
 */
export function resolveRowOrder<T extends string>(
  value: string | null | undefined,
  defaults: readonly T[],
  onUnknown?: (unknown: string) => void,
): T[] {
  const byName = new Map(defaults.map((id) => [normalize(id), id]));
  const chosen: T[] = [];
  for (const raw of (value ?? "").split(/[,;\n]+/)) {
    const name = raw.trim();
    if (!name || /^\[.*\]$/.test(name)) continue; // vide ou texte d'attente « [À COMPLÉTER …] »
    const id = byName.get(normalize(name));
    if (!id) onUnknown?.(name);
    else if (!chosen.includes(id)) chosen.push(id);
  }
  return [...chosen, ...defaults.filter((id) => !chosen.includes(id))];
}
