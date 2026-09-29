import type { FAQPage, Graph, MedicalBusiness, OpeningHoursSpecification, Person, WebPage, WebSite } from "schema-dts";
import { SITE_URL } from "@/config/site";
import type { SiteContent } from "@/lib/content/types";
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
        itemOffered: { "@type": "Service", name: m.title, description: m.description },
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
