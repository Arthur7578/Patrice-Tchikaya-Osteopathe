import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { motifs, guides } = await getSiteContent();
  // lastModified seulement quand une vraie date existe (édition Notion) : une date = heure de génération
  // serait fausse à chaque requête et Google finirait par ignorer le champ pour tout le site.
  return [
    { url: `${SITE_URL}/` },
    // Pages motifs et guides publiés (phase 9), datées de leur dernière modification dans Notion.
    ...[...motifs, ...guides].flatMap((m) => (m.page ? [{ url: `${SITE_URL}/${m.slug}`, lastModified: new Date(m.page.lastEdited) }] : [])),
    { url: `${SITE_URL}/paiement` },
    { url: `${SITE_URL}/mentions-legales` },
    { url: `${SITE_URL}/confidentialite` },
  ];
}
