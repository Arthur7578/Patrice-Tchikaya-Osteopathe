import type {
  BreadcrumbList, FAQPage, Graph, MedicalBusiness, MedicalWebPage, OpeningHoursSpecification, Person, WebPage, WebSite,
} from "schema-dts";
import { SITE_URL } from "@/config/site";
import { COPY } from "@/content/ui-copy";
import type { Motif, MotifPage, SiteContent } from "@/lib/content/types";
import { googleMapsSearchUrl } from "@/lib/maps";

export const ids = {
  website: `${SITE_URL}/#website`,
  organization: `${SITE_URL}/#organization`,
  person: `${SITE_URL}/#person`,
  webpage: (path = "/") => `${SITE_URL}${path}#webpage`,
  faq: `${SITE_URL}/#faq`,
};

const DAY_URI = {
  Mo: "https://schema.org/Monday", Tu: "https://schema.org/Tuesday", We: "https://schema.org/Wednesday",
  Th: "https://schema.org/Thursday", Fr: "https://schema.org/Friday", Sa: "https://schema.org/Saturday",
  Su: "https://schema.org/Sunday",
} as const;

/** Graphe global (layout) : WebSite + cabinet (MedicalBusiness) + praticien (Person). */
export function buildSiteGraph(c: SiteContent): Graph {
  const images = [c.images.hero.src, c.images.cabinet.src, c.images.portrait.src].filter(
    (s): s is string => Boolean(s),
  );
  const openingHoursSpecification: OpeningHoursSpecification[] | undefined = c.openingHours?.map((r) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: r.days.map((d) => DAY_URI[d]),
    opens: r.opens,
    closes: r.closes,
  }));

  // "Physician" = médecin au sens schema.org : titre protégé -> on ne l'affirme pas.
  // MedicalBusiness (LocalBusiness) + MedicalOrganization (autorise medicalSpecialty / isAcceptingNewPatients).
  const organization = {
    "@type": ["MedicalBusiness", "MedicalOrganization"],
    "@id": ids.organization,
    name: `${c.practitioner.name} – ${c.practitioner.title}`,
    description: c.about.shortBio,
    url: SITE_URL,
    telephone: c.contact.phoneE164,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: ["Wero", c.payment.otherMethods].filter(Boolean).join(", "), // cf. page /paiement
    image: images.length > 0 ? images : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.contact.street,
      postalCode: c.contact.postalCode,
      addressLocality: c.contact.locality,
      addressCountry: c.contact.countryCode,
    },
    geo: { "@type": "GeoCoordinates", latitude: c.contact.geo.latitude, longitude: c.contact.geo.longitude },
    hasMap: googleMapsSearchUrl(c),
    areaServed: [
      { "@type": "City", name: c.contact.locality },
      { "@type": "Country", name: "Luxembourg" },
    ],
    medicalSpecialty: "https://schema.org/Musculoskeletal",
    isAcceptingNewPatients: true,
    openingHoursSpecification,
    sameAs: c.sameAs.length > 0 ? c.sameAs : undefined,
    potentialAction: {
      "@type": "ReserveAction",
      name: "Prendre rendez-vous en ligne",
      target: c.booking.url,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Motifs de consultation",
      itemListElement: c.motifs.map((m) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: m.title,
          description: m.description,
          url: m.page ? `${SITE_URL}/${m.slug}` : undefined, // page détaillée publiée (phase 9)
        },
      })),
    },
  } as unknown as MedicalBusiness; // multi-type : schema-dts ne type pas les tableaux de @type

  const person: Person = {
    "@type": "Person",
    "@id": ids.person,
    name: c.practitioner.name,
    jobTitle: c.practitioner.title,
    // Ligne directe (mobile) du praticien ; le cabinet (MedicalBusiness) garde le numéro principal du NAP.
    telephone: c.contact.mobilePhone?.e164,
    description: c.about.longBio,
    image: c.images.portrait.src ?? undefined,
    worksFor: { "@id": ids.organization },
    workLocation: { "@id": ids.organization },
    knowsAbout: ["Ostéopathie", ...c.motifs.map((m) => m.title), "Troubles musculo-squelettiques", "Handball"],
    knowsLanguage: c.languages.length > 0 ? c.languages : undefined,
    sameAs: c.sameAs.filter((u) => u !== c.googleBusinessUrl),
  };

  const website: WebSite = {
    "@type": "WebSite",
    "@id": ids.website,
    url: SITE_URL,
    name: `${c.practitioner.name} – Ostéopathe à ${c.contact.locality}`,
    inLanguage: "fr-LU",
    publisher: { "@id": ids.organization },
  };

  return { "@context": "https://schema.org", "@graph": [website, organization, person] };
}

/** Graphe de la page d'accueil : WebPage + FAQPage (FAQ = contenu visible uniquement). */
export function buildHomeGraph(c: SiteContent, meta: { title: string; description: string }): Graph {
  const webpage: WebPage = {
    "@type": "WebPage",
    "@id": ids.webpage("/"),
    url: `${SITE_URL}/`,
    name: meta.title,
    description: meta.description,
    inLanguage: "fr-LU",
    isPartOf: { "@id": ids.website },
    about: { "@id": ids.organization },
    primaryImageOfPage: c.images.hero.src ? { "@type": "ImageObject", url: c.images.hero.src } : undefined,
  };
  const graph: Array<WebPage | FAQPage> = [webpage];
  if (c.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": ids.faq,
      isPartOf: { "@id": ids.webpage("/") },
      mainEntity: c.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Graphe d'une page détaillée (phase 9) : relue par le praticien (reviewedBy → Person ; la case Notion
 * « Page_Validée » en est la condition) + fil d'Ariane identique à celui affiché. Un motif est une
 * MedicalWebPage ; un guide (kiné, ordonnance, région frontalière…) une WebPage ordinaire.
 */
function buildPageGraph(
  c: SiteContent,
  entry: Motif,
  page: MotifPage,
  meta: { path: string; title: string; description: string },
  type: "MedicalWebPage" | "WebPage",
): Graph {
  const url = `${SITE_URL}${meta.path}`;
  const breadcrumbId = `${url}#breadcrumb`;
  const webpage = {
    "@type": type,
    "@id": ids.webpage(meta.path),
    url,
    name: meta.title,
    description: meta.description,
    inLanguage: "fr-LU",
    isPartOf: { "@id": ids.website },
    publisher: { "@id": ids.organization },
    reviewedBy: { "@id": ids.person },
    lastReviewed: page.lastEdited.slice(0, 10),
    breadcrumb: { "@id": breadcrumbId },
  } as MedicalWebPage | WebPage;
  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: COPY.motifPage.home, item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: entry.title, item: url },
    ],
  };
  return { "@context": "https://schema.org", "@graph": [webpage, breadcrumb] };
}

type PageMeta = { path: string; title: string; description: string };

export const buildMotifGraph = (c: SiteContent, motif: Motif, page: MotifPage, meta: PageMeta): Graph =>
  buildPageGraph(c, motif, page, meta, "MedicalWebPage");

export const buildGuideGraph = (c: SiteContent, guide: Motif, page: MotifPage, meta: PageMeta): Graph =>
  buildPageGraph(c, guide, page, meta, "WebPage");

/** Graphe de /articles : CollectionPage (liste des pages publiées) + fil d'Ariane identique à l'affichage. */
export function buildArticlesGraph(
  pages: Motif[],
  meta: { title: string; description: string },
): Graph {
  const path = "/articles";
  const url = `${SITE_URL}${path}`;
  const breadcrumbId = `${url}#breadcrumb`;
  const collection = {
    "@type": "CollectionPage",
    "@id": ids.webpage(path),
    url,
    name: meta.title,
    description: meta.description,
    inLanguage: "fr-LU",
    isPartOf: { "@id": ids.website },
    publisher: { "@id": ids.organization },
    breadcrumb: { "@id": breadcrumbId },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${SITE_URL}/${p.slug}` })),
    },
  } as unknown as WebPage;
  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: COPY.motifPage.home, item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: meta.title, item: url },
    ],
  };
  return { "@context": "https://schema.org", "@graph": [collection, breadcrumb] };
}
