import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";
import { publishedPages } from "@/lib/content/published";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = publishedPages(await getSiteContent());
  // lastModified seulement quand une vraie date existe (édition Notion) : une date = heure de génération
  // serait fausse à chaque requête et Google finirait par ignorer le champ pour tout le site.
  const edited = pages.map((p) => new Date(p.page!.lastEdited));
  const newest = edited.length > 0 ? new Date(Math.max(...edited.map((d) => d.getTime()))) : null;
  return [
    { url: `${SITE_URL}/` },
    // Pages motifs et pages d'information publiées (phase 9), datées de leur dernière modification dans Notion.
    ...pages.map((p, i) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: edited[i] })),
    // /articles liste ces pages : sa date est celle de la plus récente (absente s'il n'y a rien à lister).
    ...(newest ? [{ url: `${SITE_URL}/articles`, lastModified: newest }] : []),
    { url: `${SITE_URL}/paiement` },
    { url: `${SITE_URL}/mentions-legales` },
    { url: `${SITE_URL}/confidentialite` },
  ];
}
