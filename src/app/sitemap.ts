import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { motifs } = await getSiteContent();
  return [
    { url: `${SITE_URL}/`, lastModified: now },
    // Pages motifs publiées (phase 9), datées de leur dernière modification dans Notion.
    ...motifs.flatMap((m) => (m.page ? [{ url: `${SITE_URL}/${m.slug}`, lastModified: new Date(m.page.lastEdited) }] : [])),
    { url: `${SITE_URL}/paiement`, lastModified: now },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now },
    { url: `${SITE_URL}/confidentialite`, lastModified: now },
  ];
}
