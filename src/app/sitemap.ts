import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, ENABLED_LOCALES, LOCALE_META, localePath } from "@/config/i18n";
import { SITE_URL } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";
import { publishedPages } from "@/lib/content/published";

export const revalidate = 3600;

/**
 * Une entrée par page et par langue publiée, chacune avec ses équivalents (hreflang, dont x-default = français) :
 * c'est ainsi que Google montre à chacun la version dans sa langue. Pages juridiques : français seulement.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = publishedPages(await getSiteContent());
  // lastModified seulement quand une vraie date existe (édition Notion) : une date = heure de génération
  // serait fausse à chaque requête et Google finirait par ignorer le champ pour tout le site.
  const edited = pages.map((p) => new Date(p.page!.lastEdited));
  const newest = edited.length > 0 ? new Date(Math.max(...edited.map((d) => d.getTime()))) : null;
  const translated: Array<{ path: string; lastModified?: Date }> = [
    { path: "/" },
    // Pages motifs et pages d'information publiées (phase 9), datées de leur dernière modification dans Notion.
    ...pages.map((p, i) => ({ path: `/${p.slug}`, lastModified: edited[i] })),
    // /articles liste ces pages : sa date est celle de la plus récente (absente s'il n'y a rien à lister).
    ...(newest ? [{ path: "/articles", lastModified: newest }] : []),
    { path: "/paiement" },
  ];
  const url = (locale: (typeof ENABLED_LOCALES)[number], path: string) => `${SITE_URL}${localePath(locale, path)}`;
  return [
    ...translated.flatMap(({ path, lastModified }) =>
      ENABLED_LOCALES.map((locale) => ({
        url: url(locale, path),
        ...(lastModified ? { lastModified } : {}),
        ...(ENABLED_LOCALES.length > 1
          ? {
              alternates: {
                languages: {
                  ...Object.fromEntries(ENABLED_LOCALES.map((l) => [LOCALE_META[l].hreflang, url(l, path)])),
                  "x-default": url(DEFAULT_LOCALE, path),
                },
              },
            }
          : {}),
      })),
    ),
    { url: `${SITE_URL}/mentions-legales` },
    { url: `${SITE_URL}/confidentialite` },
  ];
}
