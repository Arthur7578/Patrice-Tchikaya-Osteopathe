import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/paiement`, lastModified: now },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now },
    { url: `${SITE_URL}/confidentialite`, lastModified: now },
    // Phase 9 : ajouter les pages motifs publiées (lastModified = last_edited_time Notion).
  ];
}
