/**
 * Synchronisation du contenu de secours (fallback.ts) avec Notion : `npm run fallback:sync`, lancé une fois par mois
 * par `.github/workflows/fallback-sync.yml`, qui ouvre une PR à relire (règle 2 : le contenu éditorial n'entre dans
 * le dépôt qu'après relecture). Ce module ne contient que la logique pure ; le script lit Notion et écrit le fichier.
 */
import type { ImageSlot, SiteContent, SiteImage } from "./types";

/** Une ligne Notion et la date de sa dernière modification. */
export type RowEdit = { database: string; id: string; lastEdited: string };

const DAY_MS = 86_400_000;

/**
 * Lignes modifiées depuis moins de `minDays` jours. Une date illisible compte comme récente : en cas de doute,
 * on attend plutôt que de figer un texte peut-être encore en cours de correction.
 */
export function recentEdits(rows: RowEdit[], now: Date, minDays: number): RowEdit[] {
  const limit = now.getTime() - minDays * DAY_MS;
  return rows.filter((row) => !(new Date(row.lastEdited).getTime() <= limit));
}

/**
 * Ce que le contenu de secours garde de Notion : tout, sauf les URL des photos (la CI ne dépend d'aucun hôte
 * d'images externe, règle 3), les identifiants de page Notion et les pages d'information (texte de santé relu
 * par Patrice dans Notion seulement). Même périmètre que `contentDrift`.
 */
export function toSnapshot(content: SiteContent): SiteContent {
  const images = Object.fromEntries(
    Object.entries(content.images).map(([slot, image]) => [slot, { ...image, src: null }]),
  ) as Record<ImageSlot, SiteImage>;
  return {
    ...content,
    images,
    guides: [],
    motifs: content.motifs.map((motif) => ({ ...motif, notionPageId: null })),
  };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function emit(value: unknown, indent: string): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Nombre non sérialisable : ${value}`);
    return String(value);
  }
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${inner}${emit(item, inner)},`).join("\n")}\n${indent}]`;
  }
  if (typeof value === "object") {
    // Clés triées : le fichier ne dépend pas de l'ordre de construction du contenu, deux synchronisations
    // identiques donnent exactement le même texte.
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    if (entries.length === 0) return "{}";
    const lines = entries.map(([key, item]) => `${inner}${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${emit(item, inner)},`);
    return `{\n${lines.join("\n")}\n${indent}}`;
  }
  throw new Error(`Valeur non sérialisable : ${typeof value}`);
}

const HEADER = `// FICHIER GÉNÉRÉ par \`npm run fallback:sync\` (workflow mensuel « Synchronisation du contenu de secours »). Ne pas
// modifier à la main : la prochaine synchronisation écraserait la modification. Pour changer un texte, le modifier
// dans Notion ; ce fichier le reprend à la prochaine synchronisation, après relecture de la PR.
//
// Copie de Notion (hors URL des photos, identifiants de page et pages d'information) qui sert aux tests, à la CI
// et au développement sans NOTION_TOKEN, et de valeur de départ aux champs obligatoires vides. Voir docs/DECISIONS.md.
import type { SiteContent } from "./types";

`;

/** Texte complet de fallback.ts pour ce contenu. */
export function serializeFallback(content: SiteContent): string {
  return `${HEADER}export const FALLBACK_CONTENT: SiteContent = ${emit(toSnapshot(content), "")};\n`;
}
