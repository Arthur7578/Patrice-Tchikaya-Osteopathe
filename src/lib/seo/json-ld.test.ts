import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/config/site";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import type { Motif, MotifPage, SiteContent } from "@/lib/content/types";
import { buildHomeGraph, buildMotifGraph, buildSiteGraph } from "./json-ld";

const META = { title: "Titre de test", description: "Description de test" };

type Node = Record<string, unknown>;
const nodesOf = (g: { "@graph"?: unknown }) => (g["@graph"] ?? []) as Node[];
const typesOf = (g: { "@graph"?: unknown }) => nodesOf(g).flatMap((n) => [n["@type"]].flat() as string[]);

function allGraphs(c: SiteContent = FALLBACK_CONTENT) {
  const motif = c.motifs[0] as Motif;
  const page: MotifPage = { lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage;
  return [
    buildSiteGraph(c),
    buildHomeGraph(c, META),
    buildMotifGraph(c, motif, page, { path: `/${motif.slug}`, ...META }),
  ];
}

describe("JSON-LD : règles non négociables (CLAUDE.md règle 7 et 10)", () => {
  it("n'émet jamais Physician, AggregateRating ni Review", () => {
    const json = JSON.stringify(allGraphs());
    const types = allGraphs().flatMap(typesOf);
    expect(types).not.toContain("Physician");
    expect(json).not.toMatch(/AggregateRating|"Review"|"Physician"/);
  });

  it("n'écrit jamais « médecin » ni « Dr » dans le JSON-LD", () => {
    const json = JSON.stringify(allGraphs());
    expect(json).not.toMatch(/médecin/i);
    expect(json).not.toMatch(/\bDr\b\.?/);
  });

  it("le cabinet est un MedicalBusiness et le praticien une Person", () => {
    const types = typesOf(buildSiteGraph(FALLBACK_CONTENT));
    expect(types).toEqual(expect.arrayContaining(["WebSite", "MedicalBusiness", "Person"]));
  });
});

describe("buildSiteGraph", () => {
  it("omet openingHoursSpecification et sameAs quand ils sont vides", () => {
    const c = { ...FALLBACK_CONTENT, openingHours: undefined, sameAs: [] } as unknown as SiteContent;
    const org = nodesOf(buildSiteGraph(c)).find((n) => (n["@type"] as string[]).includes("MedicalBusiness"))!;
    expect(org.openingHoursSpecification).toBeUndefined();
    expect(org.sameAs).toBeUndefined();
  });

  it("référence l'URL de RDV configurée dans le ReserveAction", () => {
    const org = nodesOf(buildSiteGraph(FALLBACK_CONTENT)).find((n) => (n["@type"] as string[]).includes("MedicalBusiness"))!;
    expect((org.potentialAction as Node).target).toBe(FALLBACK_CONTENT.booking.url);
  });
});

describe("buildHomeGraph", () => {
  it("contient WebPage + FAQPage avec une question par entrée de FAQ", () => {
    const graph = buildHomeGraph(FALLBACK_CONTENT, META);
    const faq = nodesOf(graph).find((n) => n["@type"] === "FAQPage")!;
    expect(typesOf(graph)).toContain("WebPage");
    expect((faq.mainEntity as unknown[]).length).toBe(FALLBACK_CONTENT.faq.length);
  });

  it("n'émet pas de FAQPage si la FAQ est vide", () => {
    const graph = buildHomeGraph({ ...FALLBACK_CONTENT, faq: [] }, META);
    expect(typesOf(graph)).not.toContain("FAQPage");
  });
});

describe("buildMotifGraph", () => {
  it("produit MedicalWebPage + BreadcrumbList relus par le praticien", () => {
    const motif = FALLBACK_CONTENT.motifs[0]!;
    const graph = buildMotifGraph(FALLBACK_CONTENT, motif, { lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage, {
      path: `/${motif.slug}`,
      ...META,
    });
    const page = nodesOf(graph).find((n) => n["@type"] === "MedicalWebPage")!;
    expect(typesOf(graph)).toEqual(["MedicalWebPage", "BreadcrumbList"]);
    expect(page.lastReviewed).toBe("2026-09-01");
    expect(page.reviewedBy).toEqual({ "@id": expect.stringContaining("#person") });
  });
});

describe("JSON-LD : structure exacte (contrat des données structurées)", () => {
  const S = SITE_URL;
  const img = (src: string | null, alt: string) => ({ src, alt, width: 800, height: 600 });
  const c: SiteContent = {
    ...FALLBACK_CONTENT,
    practitioner: { name: "Jeanne Test", title: "Ostéopathe D.O." },
    contact: {
      ...FALLBACK_CONTENT.contact,
      street: "1 rue A",
      postalCode: "1000",
      locality: "Ville",
      countryCode: "LU",
      countryName: "Luxembourg",
      phoneE164: "+3521",
      mobilePhone: { display: "+352 691 1", e164: "+3526911" },
      geo: { latitude: 49.5, longitude: 6.1 },
    },
    about: { ...FALLBACK_CONTENT.about, shortBio: "Bio courte", longBio: "Bio longue" },
    images: { hero: img("https://exemple.test/hero.jpg", "Hero"), portrait: img("https://exemple.test/p.jpg", "Portrait"), cabinet: img(null, "Cabinet") },
    openingHours: [
      { days: ["Mo", "Tu"], opens: "08:00", closes: "19:00" },
      { days: ["Sa"], opens: "09:00", closes: "12:00" },
    ],
    sameAs: ["https://g.page/r/ABC", "https://www.linkedin.com/in/test"],
    googleBusinessUrl: "https://g.page/r/ABC",
    languages: ["fr", "en"],
    booking: { ...FALLBACK_CONTENT.booking, url: "https://cal.eu/x" },
    payment: { ...FALLBACK_CONTENT.payment, otherMethods: null },
    motifs: [
      { ...FALLBACK_CONTENT.motifs[0]!, title: "Dos", slug: "dos", description: "Lombalgies" },
      { ...FALLBACK_CONTENT.motifs[1]!, title: "Sport", slug: "sport", description: "Entorses", page: null },
    ],
    faq: [{ question: "Q1 ?", answer: "R1." }],
  };
  const org = (graph: { "@graph"?: unknown }) => nodesOf(graph).find((n) => [n["@type"]].flat().includes("MedicalBusiness"))!;
  const person = (graph: { "@graph"?: unknown }) => nodesOf(graph).find((n) => n["@type"] === "Person")!;

  it("graphe du site : WebSite + cabinet (MedicalBusiness + MedicalOrganization) + praticien (Person)", () => {
    expect(buildSiteGraph(c)).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${S}/#website`,
          url: S,
          name: "Jeanne Test – Ostéopathe à Ville",
          inLanguage: "fr-LU",
          publisher: { "@id": `${S}/#organization` },
        },
        {
          "@type": ["MedicalBusiness", "MedicalOrganization"],
          "@id": `${S}/#organization`,
          name: "Jeanne Test – Ostéopathe D.O.",
          description: "Bio courte",
          url: S,
          telephone: "+3521",
          priceRange: "€€",
          currenciesAccepted: "EUR",
          paymentAccepted: "Wero",
          image: ["https://exemple.test/hero.jpg", "https://exemple.test/p.jpg"],
          address: { "@type": "PostalAddress", streetAddress: "1 rue A", postalCode: "1000", addressLocality: "Ville", addressCountry: "LU" },
          geo: { "@type": "GeoCoordinates", latitude: 49.5, longitude: 6.1 },
          hasMap:
            "https://www.google.com/maps/search/?api=1&query=Jeanne%20Test%20ost%C3%A9opathe%2C%201%20rue%20A%2C%201000%20Ville%2C%20Luxembourg",
          areaServed: [
            { "@type": "City", name: "Ville" },
            { "@type": "Country", name: "Luxembourg" },
          ],
          medicalSpecialty: "https://schema.org/Musculoskeletal",
          isAcceptingNewPatients: true,
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["https://schema.org/Monday", "https://schema.org/Tuesday"],
              opens: "08:00",
              closes: "19:00",
            },
            { "@type": "OpeningHoursSpecification", dayOfWeek: ["https://schema.org/Saturday"], opens: "09:00", closes: "12:00" },
          ],
          sameAs: ["https://g.page/r/ABC", "https://www.linkedin.com/in/test"],
          potentialAction: { "@type": "ReserveAction", name: "Prendre rendez-vous en ligne", target: "https://cal.eu/x" },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Motifs de consultation",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dos", description: "Lombalgies", url: `${S}/dos` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sport", description: "Entorses", url: undefined } },
            ],
          },
        },
        {
          "@type": "Person",
          "@id": `${S}/#person`,
          name: "Jeanne Test",
          jobTitle: "Ostéopathe D.O.",
          telephone: "+3526911",
          description: "Bio longue",
          image: "https://exemple.test/p.jpg",
          worksFor: { "@id": `${S}/#organization` },
          workLocation: { "@id": `${S}/#organization` },
          knowsAbout: ["Ostéopathie", "Dos", "Sport", "Troubles musculo-squelettiques", "Handball"],
          knowsLanguage: ["fr", "en"],
          sameAs: ["https://www.linkedin.com/in/test"],
        },
      ],
    });
  });

  it("tous les jours de la semaine sont traduits en URI schema.org", () => {
    const week = { days: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const, opens: "08:00", closes: "18:00" };
    const spec = org(buildSiteGraph({ ...c, openingHours: [{ ...week, days: [...week.days] }] })).openingHoursSpecification as Array<{ dayOfWeek: string[] }>;
    expect(spec[0]!.dayOfWeek).toEqual(
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => `https://schema.org/${d}`),
    );
  });

  it("autres moyens de paiement : ajoutés après Wero", () => {
    expect(org(buildSiteGraph({ ...c, payment: { ...c.payment, otherMethods: "Espèces" } })).paymentAccepted).toBe("Wero, Espèces");
  });

  it("champs facultatifs vides : propriétés absentes (jamais de valeur vide ou fausse)", () => {
    const bare: SiteContent = {
      ...c,
      images: { hero: img(null, "Hero"), portrait: img(null, "Portrait"), cabinet: img(null, "Cabinet") },
      contact: { ...c.contact, mobilePhone: null },
      openingHours: null,
      sameAs: [],
      languages: [],
    };
    const site = buildSiteGraph(bare);
    expect(org(site).image).toBeUndefined();
    expect(org(site).openingHoursSpecification).toBeUndefined();
    expect(org(site).sameAs).toBeUndefined();
    expect(person(site).image).toBeUndefined();
    expect(person(site).telephone).toBeUndefined();
    expect(person(site).knowsLanguage).toBeUndefined();
    expect(person(site).sameAs).toEqual([]);
    const home = nodesOf(buildHomeGraph(bare, { title: "T", description: "D" })).find((n) => n["@type"] === "WebPage")!;
    expect(home.primaryImageOfPage).toBeUndefined();
  });

  it("image du cabinet seule : utilisée pour le cabinet, pas pour le praticien", () => {
    const cabinetOnly = { ...c, images: { hero: img(null, "Hero"), portrait: img(null, "Portrait"), cabinet: img("https://exemple.test/c.jpg", "Cabinet") } };
    expect(org(buildSiteGraph(cabinetOnly)).image).toEqual(["https://exemple.test/c.jpg"]);
    expect(person(buildSiteGraph(cabinetOnly)).image).toBeUndefined();
  });

  it("graphe de l'accueil : WebPage + FAQPage (réponses du contenu)", () => {
    expect(buildHomeGraph(c, { title: "T", description: "D" })).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${S}/#webpage`,
          url: `${S}/`,
          name: "T",
          description: "D",
          inLanguage: "fr-LU",
          isPartOf: { "@id": `${S}/#website` },
          about: { "@id": `${S}/#organization` },
          primaryImageOfPage: { "@type": "ImageObject", url: "https://exemple.test/hero.jpg" },
        },
        {
          "@type": "FAQPage",
          "@id": `${S}/#faq`,
          isPartOf: { "@id": `${S}/#webpage` },
          mainEntity: [{ "@type": "Question", name: "Q1 ?", acceptedAnswer: { "@type": "Answer", text: "R1." } }],
        },
      ],
    });
  });

  it("graphe d'une page motif : MedicalWebPage relue par le praticien + fil d'Ariane identique à celui affiché", () => {
    const page = { ...FALLBACK_CONTENT.motifs[0]!.page!, lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage;
    expect(buildMotifGraph(c, c.motifs[0]!, page, { path: "/dos", title: "Dos à Ville", description: "Desc" })).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MedicalWebPage",
          "@id": `${S}/dos#webpage`,
          url: `${S}/dos`,
          name: "Dos à Ville",
          description: "Desc",
          inLanguage: "fr-LU",
          isPartOf: { "@id": `${S}/#website` },
          publisher: { "@id": `${S}/#organization` },
          reviewedBy: { "@id": `${S}/#person` },
          lastReviewed: "2026-09-01",
          breadcrumb: { "@id": `${S}/dos#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${S}/dos#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: `${S}/` },
            { "@type": "ListItem", position: 2, name: "Dos", item: `${S}/dos` },
          ],
        },
      ],
    });
  });
});
