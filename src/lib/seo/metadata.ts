import { COPY } from "@/content/ui-copy";
import type { Motif, SiteContent } from "@/lib/content/types";

export function homeMeta(c: SiteContent) {
  const title = c.seo.metaTitle ?? `Ostéopathe à ${c.contact.locality} – ${c.practitioner.name}, D.O.`;
  const description =
    c.seo.metaDescription ??
    `Cabinet d'ostéopathie à ${c.contact.locality} (Luxembourg) : dos, cou, articulations, sport et TMS. Séance de ${c.consultation.durationLabel}. Prise de rendez-vous en ligne.`;
  return { title, description };
}

/** Page d'information (Type = Page d'information) : « {titre} | {praticien} » ; le titre Notion est déjà une phrase complète. */
export function guideMeta(c: SiteContent, guide: Motif) {
  return {
    path: `/${guide.slug}`,
    title: `${guide.title} | ${c.practitioner.name}`,
    description: guide.description.trim(),
  };
}

/** Page motif : « {Motif} à {ville} | {praticien} » ; description = Description_Courte (+ rappel local si ≤ 160 car.). */
export function motifMeta(c: SiteContent, motif: Motif) {
  const path = `/${motif.slug}`;
  const title = `${COPY.motifPage.h1(motif.title, c.contact.locality)} | ${c.practitioner.name}`;
  const base = motif.description.trim();
  const withLocal = `${base} Ostéopathe à ${c.contact.locality}, sans ordonnance.`;
  return { path, title, description: withLocal.length <= 160 ? withLocal : base };
}
