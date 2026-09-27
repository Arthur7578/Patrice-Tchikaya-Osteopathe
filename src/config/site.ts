/**
 * Configuration technique (non éditoriale). Le contenu éditorial vient de Notion.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://osteopathe-tchikaya.lu"
).replace(/\/+$/, "");

/** Indexation autorisée uniquement sur la production Vercel (ou si forcé). */
export const ALLOW_INDEXING =
  process.env.VERCEL_ENV === "production" || process.env.ALLOW_INDEXING === "true";

/** Coordonnées GPS du cabinet — À VÉRIFIER sur Google Maps (clic droit sur le bâtiment). */
export const GEO = { latitude: 49.4808, longitude: 6.0841 } as const;

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
