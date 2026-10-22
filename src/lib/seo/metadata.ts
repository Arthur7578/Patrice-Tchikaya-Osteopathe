import { localePath } from "@/config/i18n";
import { getCopy } from "@/content/ui-copy";
import type { Motif, SiteContent } from "@/lib/content/types";

export function homeMeta(c: SiteContent) {
  const { meta } = getCopy(c.locale);
  const title = c.seo.metaTitle ?? meta.homeTitle(c.contact.locality, c.practitioner.name);
  const description = c.seo.metaDescription ?? meta.homeDescription(c.contact.locality, c.consultation.durationLabel);
  return { title, description };
}

/** Page d'information (Type = Page d'information) : « {titre} | {praticien} » ; le titre Notion est déjà une phrase complète. */
export function guideMeta(c: SiteContent, guide: Motif) {
  return {
    path: localePath(c.locale, `/${guide.slug}`),
    title: `${guide.title} | ${c.practitioner.name}`,
    description: guide.description.trim(),
  };
}

/** Page motif : « {Motif} à {ville} | {praticien} » ; description = Description_Courte (+ rappel local si ≤ 160 car.). */
export function motifMeta(c: SiteContent, motif: Motif) {
  const copy = getCopy(c.locale);
  const path = localePath(c.locale, `/${motif.slug}`);
  const title = `${copy.motifPage.h1(motif.title, c.contact.locality)} | ${c.practitioner.name}`;
  const base = motif.description.trim();
  const withLocal = `${base} ${copy.meta.motifLocal(c.contact.locality)}`;
  return { path, title, description: withLocal.length <= 160 ? withLocal : base };
}
