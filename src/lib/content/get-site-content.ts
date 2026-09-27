import "server-only";
import { cache } from "react";
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent } from "@/lib/notion/fetch-content";
import { FALLBACK_CONTENT } from "./fallback";
import type { SiteContent } from "./types";

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
  const { content, warnings } = await fetchSiteContent(createNotionClient(token));
  for (const w of warnings) console.warn(`[notion] ${w}`);
  return content;
});
