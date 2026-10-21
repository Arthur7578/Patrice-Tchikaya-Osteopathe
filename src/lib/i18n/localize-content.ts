import { LOCALE_META, localePath, type Locale } from "@/config/i18n";
import type { Booking, ContentBlock, Motif, MotifPage, PaymentSection, RichText, SiteContent } from "@/lib/content/types";
import { markupToRichText, richTextToMarkup } from "./rich-text";

/**
 * Textes à traduire, rangés par lot : « general », « faq », « about », « payment », « cards » (titres et
 * descriptions des motifs et des pages d'information), puis un lot par page détaillée (« page:<slug> »).
 * Chaque lot est traduit et mis en cache séparément : modifier un texte dans Notion ne fait retraduire que son lot.
 * Clé = chemin du champ (stable d'une lecture Notion à l'autre).
 */
export type TranslationGroups = Record<string, Record<string, string>>;

/** Lot d'un champ hors pages détaillées, d'après le début de sa clé ; le reste va dans « general ». */
const GROUPS: Record<string, string> = { faq: "faq", about: "about", payment: "payment", paymentPage: "payment", motif: "cards", guide: "cards" };
const groupOf = (key: string) => GROUPS[key.split(".")[0]!] ?? "general";

/** (lot, clé, texte français) → texte affiché. */
type Visit = (group: string, key: string, text: string) => string;

/**
 * Seuls les champs listés ici sont traduits. Ne le sont jamais : noms propres (praticien, auteurs d'avis), adresse
 * postale et ville (recherchées telles quelles : « Dudelange »), téléphones, URL, slugs, icônes, avis patients
 * (citations : on ne met pas de mots traduits dans la bouche d'un patient), données juridiques (pages en français).
 */
function mapContent(c: SiteContent, visit: Visit): SiteContent {
  const s = (key: string, text: string) => (text.trim() ? visit(groupOf(key), key, text) : text);
  const opt = (key: string, text: string | null) => (text === null ? null : s(key, text));
  const section = (key: string, sec: PaymentSection | null): PaymentSection | null =>
    sec && {
      title: s(`${key}.title`, sec.title),
      cards: sec.cards.map((card, i) => ({ title: s(`${key}.${i}.title`, card.title), text: s(`${key}.${i}.text`, card.text) })),
    };
  // Clés par slug, pas par position : réordonner les lignes dans Notion ne fait rien retraduire.
  const entry = (kind: "motif" | "guide", m: Motif): Motif => ({
    ...m,
    title: s(`${kind}.${m.slug}.title`, m.title),
    description: s(`${kind}.${m.slug}.description`, m.description),
    page: m.page && mapPage(m.page, (key, text) => (text.trim() ? visit(`page:${m.slug}`, key, text) : text)),
  });
  const p = c.payment.page;

  return {
    ...c,
    practitioner: { ...c.practitioner, title: s("practitioner.title", c.practitioner.title) },
    seo: {
      h1: s("seo.h1", c.seo.h1),
      heroSubtitle: s("seo.heroSubtitle", c.seo.heroSubtitle),
      metaTitle: opt("seo.metaTitle", c.seo.metaTitle),
      metaDescription: opt("seo.metaDescription", c.seo.metaDescription),
    },
    contact: { ...c.contact, countryName: s("contact.countryName", c.contact.countryName) },
    consultation: {
      ...c.consultation,
      durationLabel: s("consultation.durationLabel", c.consultation.durationLabel),
      price: opt("consultation.price", c.consultation.price),
      reimbursement: s("consultation.reimbursement", c.consultation.reimbursement),
    },
    payment: {
      ...c.payment,
      info: s("payment.info", c.payment.info),
      otherMethods: opt("payment.otherMethods", c.payment.otherMethods),
      page: {
        eyebrow: opt("paymentPage.eyebrow", p.eyebrow),
        title: s("paymentPage.title", p.title),
        intro: opt("paymentPage.intro", p.intro),
        metaTitle: opt("paymentPage.metaTitle", p.metaTitle),
        metaDescription: opt("paymentPage.metaDescription", p.metaDescription),
        steps: section("paymentPage.steps", p.steps),
        caution: opt("paymentPage.caution", p.caution),
        reassurance: section("paymentPage.reassurance", p.reassurance),
        firstTime: section("paymentPage.firstTime", p.firstTime),
        help: { title: s("paymentPage.help.title", p.help.title), text: opt("paymentPage.help.text", p.help.text) },
        labels: {
          phone: s("paymentPage.labels.phone", p.labels.phone),
          email: s("paymentPage.labels.email", p.labels.email),
          name: s("paymentPage.labels.name", p.labels.name),
          price: s("paymentPage.labels.price", p.labels.price),
          caution: s("paymentPage.labels.caution", p.labels.caution),
          otherMethods: s("paymentPage.labels.otherMethods", p.labels.otherMethods),
        },
      },
    },
    openingHoursLines: c.openingHoursLines.map((line, i) => s(`openingHours.${i}`, line)),
    access: {
      train: opt("access.train", c.access.train),
      bus: opt("access.bus", c.access.bus),
      parking: opt("access.parking", c.access.parking),
      accessibility: opt("access.accessibility", c.access.accessibility),
    },
    languages: c.languages.map((l, i) => s(`languages.${i}`, l)),
    about: {
      title: s("about.title", c.about.title),
      shortBio: s("about.shortBio", c.about.shortBio),
      longBio: s("about.longBio", c.about.longBio),
      education: opt("about.education", c.about.education),
      continuingEducation: c.about.continuingEducation.map((t, i) => s(`about.continuingEducation.${i}`, t)),
      expertises: c.about.expertises.map((e, i) => ({
        ...e,
        title: s(`about.expertises.${i}.title`, e.title),
        text: s(`about.expertises.${i}.text`, e.text),
      })),
    },
    motifs: c.motifs.map((m) => entry("motif", m)),
    guides: c.guides.map((g) => entry("guide", g)),
    faq: c.faq.map((f, i) => ({ question: s(`faq.${i}.q`, f.question), answer: s(`faq.${i}.a`, f.answer) })),
    images: {
      hero: { ...c.images.hero, alt: s("images.hero.alt", c.images.hero.alt) },
      portrait: { ...c.images.portrait, alt: s("images.portrait.alt", c.images.portrait.alt) },
      cabinet: { ...c.images.cabinet, alt: s("images.cabinet.alt", c.images.cabinet.alt) },
    },
  };
}

/** Corps d'une page détaillée : chaque bloc de texte est traduit d'un seul tenant (gras et liens compris). */
function mapPage(page: MotifPage, visit: (key: string, text: string) => string): MotifPage {
  const rich = (key: string, segments: RichText[]): RichText[] => {
    const { markup, hrefs } = richTextToMarkup(segments);
    const translated = visit(key, markup);
    // Balisage abîmé par la traduction (rare : vérifié avant la mise en cache) : texte brut plutôt que rien.
    return markupToRichText(translated, hrefs) ?? [{ text: translated.replace(/<[^>]+>/g, "") }];
  };
  const blocks = page.blocks.map((block, i): ContentBlock => {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "quote":
      case "callout":
        return { ...block, text: rich(`${i}`, block.text) };
      case "list":
        return { ...block, items: block.items.map((item, j) => rich(`${i}.${j}`, item)) };
      case "image":
        return { ...block, alt: visit(`${i}.alt`, block.alt) };
      case "divider":
        return block;
    }
  });
  return { ...page, blocks };
}

/** Textes français à traduire, par lot. */
export function collectTranslatable(c: SiteContent): TranslationGroups {
  const groups: TranslationGroups = {};
  mapContent(c, (group, key, text) => {
    (groups[group] ??= {})[key] = text;
    return text;
  });
  return groups;
}

/** Contenu dans la langue `locale` ; un texte absent des traductions reste en français (jamais vide). */
export function applyTranslations(c: SiteContent, locale: Locale, translations: TranslationGroups): SiteContent {
  const localized = mapContent(c, (group, key, text) => translations[group]?.[key] ?? text);
  const withLinks = (m: Motif): Motif => (m.page ? { ...m, page: localizeLinks(m.page, locale) } : m);
  return {
    ...localized,
    locale,
    booking: localizeBooking(c.booking, locale),
    motifs: localized.motifs.map(withLinks),
    guides: localized.guides.map(withLinks),
  };
}

/** Liens internes du corps des pages (« /mal-de-dos ») vers la même page dans la langue de la page (« /en/mal-de-dos »). */
function localizeLinks(page: MotifPage, locale: Locale): MotifPage {
  const seg = (t: RichText): RichText => (t.href?.startsWith("/") ? { ...t, href: localePath(locale, t.href) } : t);
  const blocks = page.blocks.map((block): ContentBlock => {
    if (block.type === "list") return { ...block, items: block.items.map((item) => item.map(seg)) };
    if ("text" in block) return { ...block, text: block.text.map(seg) };
    return block;
  });
  return { ...page, blocks };
}

/**
 * Page de réservation dans la langue du visiteur quand le prestataire en a une : Doctena met la langue en tête
 * du chemin (« /fr/booking-form/… », « /en/… », « /pt/… ») ; on remplace ce segment, quelle que soit la langue
 * saisie dans Notion. Tout autre prestataire garde l'URL de Notion telle quelle.
 */
export function localizeBooking(booking: Booking, locale: Locale): Booking {
  let url: URL;
  try {
    url = new URL(booking.url);
  } catch {
    return booking;
  }
  if (!/(^|\.)doctena\.[a-z]+$/.test(url.hostname)) return booking;
  const parts = url.pathname.split("/");
  const lang = LOCALE_META[locale].bookingLang;
  if (!/^[a-z]{2}$/.test(parts[1] ?? "") || parts[1] === lang) return booking;
  parts[1] = lang;
  url.pathname = parts.join("/");
  return { ...booking, url: url.toString() };
}
