import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { SITE_CONTENT_TAG } from "@/config/site";
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent } from "@/lib/notion/fetch-content";
import { FALLBACK_CONTENT } from "./fallback";
import type { SiteContent } from "./types";

/**
 * Lecture Notion partagée entre toutes les pages et toutes les requêtes (cache de données Next).
 * Sans lui, chaque page régénérée relisait Notion en entier (7 bases + le corps de chaque page publiée) :
 * une régénération en rafale (revalidation, build) dépassait la limite de l'API (« rate_limited ») et les
 * pages restaient périmées. Désormais au plus une lecture par minute, quel que soit le nombre de pages.
 * Le jeton est lu ici et non passé en argument : il ne doit pas entrer dans la clé de cache.
 * Une erreur n'est jamais mise en cache : la requête suivante réessaie.
 */
const readNotionContent = unstable_cache(
  async () => {
    const { content, warnings } = await fetchSiteContent(createNotionClient(process.env.NOTION_TOKEN ?? ""));
    for (const w of warnings) console.warn(`[notion] ${w}`);
    return content;
  },
  ["site-content"],
  { revalidate: 60, tags: [SITE_CONTENT_TAG] },
);

/**
 * Point d'entrée UNIQUE du contenu, dédoublonné par rendu (React cache).
 * - Pas de NOTION_TOKEN : snapshot (dev/CI) ; interdit en production Vercel.
 * - Erreur API Notion : on LÈVE l'erreur. En ISR, Next conserve la dernière page valide ;
 *   au build, l'échec est visible. Jamais de retour silencieux au snapshot en prod.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    if (process.env.VERCEL_ENV === "production") {
      throw new Error("NOTION_TOKEN manquant en production : contenu Notion indisponible.");
    }
    console.warn("[content] NOTION_TOKEN absent → contenu de secours (src/lib/content/fallback.ts)");
    return FALLBACK_CONTENT;
  }
  return readNotionContent();
});
