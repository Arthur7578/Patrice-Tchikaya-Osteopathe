import { SITE_URL } from "@/config/site";
import { COPY } from "@/content/ui-copy";
import { publishedPages } from "@/lib/content/published";
import type { SiteContent } from "@/lib/content/types";

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Contenu de /llms.txt (format llmstxt.org : H1, résumé en citation, sections de liens).
 * Entièrement dérivé de SiteContent (Notion) : rien à maintenir à la main, il suit le site.
 * Ne contient que des faits déjà affichés sur la page ; les champs vides sont omis.
 */
export function buildLlmsTxt(c: SiteContent, siteUrl: string = SITE_URL): string {
  const L = COPY.llms;
  const labels = COPY.infos.labels;
  const { contact } = c;
  const lines: string[] = [];

  lines.push(`# ${c.practitioner.name} – ${c.practitioner.title}, ${contact.locality}`, "");
  lines.push(`> ${oneLine(c.about.shortBio)}`, "");

  lines.push(`## ${L.practical}`, "");
  lines.push(`- ${labels.address} : ${contact.street}, ${contact.postalCode} ${contact.locality}, ${contact.countryName}`);
  lines.push(`- ${labels.phone} : ${contact.phoneDisplay}`);
  if (contact.mobilePhone) lines.push(`- ${labels.phoneMobile.replace(/[ \s]*:$/, "")} : ${contact.mobilePhone.display}`);
  if (contact.email) lines.push(`- E-mail : ${contact.email}`);
  if (c.openingHoursLines.length > 0) lines.push(`- ${labels.hours} : ${c.openingHoursLines.join(" ; ")}`);
  if (c.languages.length > 0) lines.push(`- ${labels.languages} : ${c.languages.join(", ")}`);
  lines.push(`- ${labels.duration} : ${c.consultation.durationLabel}`);
  if (c.consultation.price) lines.push(`- ${labels.price} : ${oneLine(c.consultation.price)}`);
  lines.push(`- ${labels.reimbursement} : ${oneLine(c.consultation.reimbursement)}`);
  lines.push(`- ${labels.payment} : ${oneLine(c.payment.info)}`);
  const access: Array<[string, string | null]> = [
    [labels.train, c.access.train],
    [labels.bus, c.access.bus],
    [labels.parking, c.access.parking],
    [labels.accessibility, c.access.accessibility],
  ];
  for (const [label, value] of access) if (value) lines.push(`- ${label} : ${oneLine(value)}`);
  lines.push("");

  if (c.motifs.length > 0) {
    lines.push(`## ${L.motifs}`, "");
    for (const m of c.motifs) {
      const title = m.page ? `[${m.title}](${siteUrl}/${m.slug})` : m.title; // page détaillée (phase 9)
      lines.push(`- ${title} : ${oneLine(m.description)}`);
    }
    lines.push("");
  }

  const guides = c.guides.filter((g) => g.page);
  if (guides.length > 0) {
    lines.push(`## ${L.guides}`, "");
    for (const g of guides) lines.push(`- [${g.title}](${siteUrl}/${g.slug}) : ${oneLine(g.description)}`);
    lines.push("");
  }

  if (c.faq.length > 0) {
    lines.push(`## ${L.faq}`, "");
    for (const f of c.faq) lines.push(`- ${oneLine(f.question)} ${oneLine(f.answer)}`);
    lines.push("");
  }

  lines.push(`## ${L.pages}`, "");
  lines.push(`- [${L.home}](${siteUrl}/)`);
  lines.push(`- [${L.booking}](${c.booking.url})`);
  if (publishedPages(c).length > 0) lines.push(`- [${COPY.footer.articles}](${siteUrl}/articles)`);
  lines.push(`- [${COPY.footer.payment}](${siteUrl}/paiement)`);
  lines.push(`- [${COPY.footer.legal}](${siteUrl}/mentions-legales)`);
  lines.push(`- [${COPY.footer.privacy}](${siteUrl}/confidentialite)`);
  lines.push("");

  return lines.join("\n");
}
