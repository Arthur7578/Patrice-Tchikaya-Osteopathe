/**
 * Configuration technique (non éditoriale). Le contenu éditorial vient de Notion.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://osteopathe-tchikaya.lu"
).replace(/\/+$/, "");

/** Indexation autorisée uniquement sur la production Vercel (ou si forcé). */
export const ALLOW_INDEXING =
  process.env.VERCEL_ENV === "production" || process.env.ALLOW_INDEXING === "true";

/** IDs des bases Notion (visibles dans l'URL de chaque base). */
export const NOTION_DATABASES = {
  general: "3e84bf3fc728807289c3d8fd65392419", // Informations_generales
  images: "3e84bf3fc728802d8c71e4430540f4a6", // Medias_Images
  about: "3e84bf3fc72880b697fde52ac9061d49", // Section A_Propos
  motifs: "3e84bf3fc72880f89f2cf61ae9b23382", // Motifs_Consultation
  reviews: "3e84bf3fc7288023beb4d2739a387a17", // Avis_Patients
  faq: "3e84bf3fc7288062883dc5d447128b28", // FAQ_SEO
} as const;

export type NotionDatabaseKey = keyof typeof NOTION_DATABASES;

/**
 * Pages motifs (phase 9) : une page n'est publiée que si la case Notion est cochée (relecture de
 * Patrice) ET si son corps atteint le seuil de mots (pas de contenu mince). Voir docs/DECISIONS.md.
 */
export const MOTIF_PAGES = { validatedProperty: "Page_Validée", minWords: 300 } as const;

/**
 * Routes de premier niveau déjà prises par le site : jamais utilisables comme slug de page motif
 * (une route statique l'emporterait sur /[slug]). Les routes à point (robots.txt, llms.txt…) ne
 * peuvent pas entrer en collision : un slug normalisé ne contient jamais de point.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin", "api", "apple-icon", "confidentialite", "mentions-legales", "opengraph-image",
]);
