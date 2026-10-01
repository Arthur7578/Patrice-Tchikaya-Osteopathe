/**
 * Blocs de la section « Infos pratiques » (dont le bloc « Accès », qui groupe ses propres lignes), dans leur ordre par défaut.
 * Patrice peut les réordonner depuis Notion (clés `Infos_Ordre` pour les blocs, `Acces_Ordre` pour les lignes du bloc Accès ; base
 * `Informations_generales`) : une liste d'identifiants séparés par des virgules, ex. « tarif, duree, horaires ».
 * `reglement` : la ligne « Règlement » (phrase `Info_Paiement` + lien vers /paiement).
 */
export const INFO_ROW_IDS = ["acces", "telephone", "duree", "tarif", "reglement", "remboursement", "horaires", "langues"] as const;
export const ACCESS_ROW_IDS = ["adresse", "train", "bus", "parking", "pmr"] as const;

/**
 * Points rassurants sous les boutons du hero. Contrairement aux infos pratiques, Patrice **choisit** les points affichés
 * (clé `Hero_Points` de `Informations_generales`) : seuls ceux listés apparaissent, dans cet ordre. `duree` et `tarif`
 * viennent de `Duree_Consultation` / `Tarif_Consultation` ; `tarif` est masqué tant que le tarif n'est pas renseigné.
 */
export const HERO_POINT_IDS = ["ordonnance", "duree", "mutuelle", "tarif", "confirmation"] as const;
/** Sans clé `Hero_Points` (ou sans identifiant reconnu) : les trois points historiques. */
export const DEFAULT_HERO_POINTS = ["ordonnance", "duree", "mutuelle"] as const;

export type InfoRowId = (typeof INFO_ROW_IDS)[number];
export type AccessRowId = (typeof ACCESS_ROW_IDS)[number];
export type HeroPointId = (typeof HERO_POINT_IDS)[number];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** Identifiants reconnus dans la liste saisie, dans l'ordre et sans doublon ; les inconnus sont signalés puis ignorés. */
function parseIds<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  onUnknown?: (unknown: string) => void,
): T[] {
  const byName = new Map(allowed.map((id) => [normalize(id), id]));
  const chosen: T[] = [];
  for (const raw of (value ?? "").split(/[,;\n]+/)) {
    const name = raw.trim();
    if (!name || /^\[.*\]$/.test(name)) continue; // vide ou texte d'attente « [À COMPLÉTER …] »
    const id = byName.get(normalize(name));
    if (!id) onUnknown?.(name);
    else if (!chosen.includes(id)) chosen.push(id);
  }
  return chosen;
}

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
  const chosen = parseIds(value, defaults, onUnknown);
  return [...chosen, ...defaults.filter((id) => !chosen.includes(id))];
}

/**
 * Sélection saisie dans Notion -> uniquement les éléments listés, dans cet ordre (même syntaxe que `resolveRowOrder`).
 * Liste vide ou sans identifiant reconnu : `defaults`.
 */
export function resolveRowSelection<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  defaults: readonly T[],
  onUnknown?: (unknown: string) => void,
): T[] {
  const chosen = parseIds(value, allowed, onUnknown);
  return chosen.length > 0 ? chosen : [...defaults];
}
