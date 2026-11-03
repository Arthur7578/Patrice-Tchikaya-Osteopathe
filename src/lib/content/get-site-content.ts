import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { DEFAULT_LOCALE, ENABLED_LOCALES, type Locale } from "@/config/i18n";
import { RESERVED_SLUGS, SITE_CONTENT_TAG } from "@/config/site";
import { localizeContent, translateTexts } from "@/lib/i18n/localize";
import { applySlugs, localizeBooking } from "@/lib/i18n/localize-content";
import { blobSlugStore } from "@/lib/i18n/slug-store";
import { resolveSlugs, type SlugMap, type SlugPage } from "@/lib/i18n/slugs";
import { publishedPages } from "./published";
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
 * Contenu français (source), dédoublonné par rendu (React cache).
 * - Pas de NOTION_TOKEN : snapshot (dev/CI) ; interdit en production Vercel.
 * - Erreur API Notion : on LÈVE l'erreur. En ISR, Next conserve la dernière page valide ;
 *   au build, l'échec est visible. Jamais de retour silencieux au snapshot en prod.
 */
const getFrenchContent = cache(async (): Promise<SiteContent> => {
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

/** Étiquette de la table des slugs traduits. */
export const TRANSLATED_SLUGS_TAG = "translated-slugs";

/**
 * Table des slugs traduits, mise en cache sans expiration sous la liste des pages publiées (argument de la fonction,
 * donc clé de cache) : le store Blob n'est lu (`list`, opération « avancée » facturée) qu'à l'ajout ou au renommage
 * d'une page dans Notion, jamais à chaque régénération (offre Hobby : 2 000 opérations avancées par mois pour tout le
 * compte, voir DECISIONS 02/11). Une erreur n'est jamais mise en cache. Un slug refusé 3 fois par le traducteur reste
 * en français jusqu'au prochain changement de pages : sa traduction partielle est elle-même en cache sans expiration,
 * la redemander à chaque rendu ne changerait rien (et relisait le store à chaque fois).
 */
const resolveSlugEntries = unstable_cache(
  async (pages: SlugPage[]) => {
    const store = blobSlugStore();
    if (!store) throw new Error("Stockage des slugs traduits indisponible.");
    return [...(await resolveSlugs({ pages, locales: ENABLED_LOCALES, store, translate: translateTexts, reserved: RESERVED_SLUGS }))];
  },
  ["translated-slugs-v2", ENABLED_LOCALES.join(","), [...RESERVED_SLUGS].sort().join(",")],
  { revalidate: false, tags: [TRANSLATED_SLUGS_TAG] },
);

/**
 * Slugs traduits et figés des pages publiées (src/lib/i18n/slugs.ts), par rendu. null (slugs français dans toutes les
 * langues) sans autre langue publiée ou sans stockage permanent (dev, CI) : un slug traduit non enregistré pourrait
 * changer, et avec lui l'adresse de la page. Erreur du stockage : levée (comme Notion ; ISR garde la dernière page).
 */
const getSlugMap = cache(async (): Promise<SlugMap | null> => {
  if (!blobSlugStore() || ENABLED_LOCALES.length < 2) return null;
  const pages = publishedPages(await getFrenchContent()).map((m) => ({ pageKey: m.notionPageId ?? `slug-${m.slug}`, frSlug: m.slug }));
  return new Map(await resolveSlugEntries(pages));
});

/**
 * Point d'entrée UNIQUE du contenu, dans la langue de la page (français par défaut), dédoublonné par rendu.
 * Les autres langues sont traduites automatiquement depuis le français (src/lib/i18n) : une modification dans
 * Notion se propage à toutes les langues à la régénération suivante. Erreur de traduction : levée (comme Notion).
 */
export const getSiteContent = cache(async (locale: Locale = DEFAULT_LOCALE): Promise<SiteContent> => {
  const content = await getFrenchContent();
  if (locale !== DEFAULT_LOCALE && !ENABLED_LOCALES.includes(locale)) {
    throw new Error(`Langue « ${locale} » non publiée (traduction non configurée).`);
  }
  const slugMap = await getSlugMap();
  if (locale === DEFAULT_LOCALE) {
    // Page de réservation en français même si l'URL collée dans Notion est celle d'une autre langue (Doctena « /en/… »).
    const booking = localizeBooking(content.booking, DEFAULT_LOCALE);
    const french = booking === content.booking ? content : { ...content, booking };
    return slugMap ? applySlugs(french, slugMap, DEFAULT_LOCALE) : french;
  }
  const localized = await localizeContent(content, locale);
  return slugMap ? applySlugs(localized, slugMap, locale) : localized;
});
