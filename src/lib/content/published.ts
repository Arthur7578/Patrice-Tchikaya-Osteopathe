import type { Motif, SiteContent } from "./types";

/**
 * Pages détaillées publiées (case Page_Validée + seuil de mots) : motifs d'abord, puis pages d'information,
 * dans l'ordre de Notion. Source unique des listes de liens (pied de page, /articles, « À lire aussi »,
 * sitemap, llms.txt).
 */
export const publishedPages = (content: Pick<SiteContent, "motifs" | "guides">): Motif[] =>
  [...content.motifs, ...content.guides].filter((entry) => entry.page);
