import type { SiteContent } from "@/lib/content/types";

export function homeMeta(c: SiteContent) {
  const title = c.seo.metaTitle ?? `Ostéopathe à ${c.contact.locality} – ${c.practitioner.name}, D.O.`;
  const description =
    c.seo.metaDescription ??
    `Cabinet d'ostéopathie à ${c.contact.locality} (Luxembourg) : dos, cou, articulations, sport et TMS. Séance de ${c.consultation.durationLabel}. Prise de rendez-vous en ligne.`;
  return { title, description };
}
