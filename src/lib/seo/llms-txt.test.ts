import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/config/site";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { buildLlmsTxt } from "./llms-txt";

describe("buildLlmsTxt", () => {
  const out = buildLlmsTxt(FALLBACK_CONTENT, "https://exemple.test");

  it("respecte le format llms.txt : un seul H1, résumé en citation, sections H2", () => {
    expect(out.match(/^# /gm)).toHaveLength(1);
    expect(out.split("\n")[0]).toContain(FALLBACK_CONTENT.practitioner.name);
    expect(out).toMatch(/^> .+/m);
    expect(out).toMatch(/^## /m);
  });

  it("reprend les faits du site (NAP, motifs, FAQ, lien de RDV)", () => {
    expect(out).toContain(FALLBACK_CONTENT.contact.phoneDisplay);
    expect(out).toContain(FALLBACK_CONTENT.contact.street);
    for (const m of FALLBACK_CONTENT.motifs) expect(out).toContain(m.title);
    for (const f of FALLBACK_CONTENT.faq) expect(out).toContain(f.question);
    expect(out).toContain(`](${FALLBACK_CONTENT.booking.url})`);
    expect(out).toContain("(https://exemple.test/mentions-legales)");
    expect(out).toContain(FALLBACK_CONTENT.payment.info);
    expect(out).toContain("(https://exemple.test/paiement)");
  });

  it("liste les guides publiés, jamais ceux sans page", () => {
    const page = { blocks: [], wordCount: 300, lastEdited: "2026-09-30T00:00:00.000Z" };
    const guide = (slug: string, published: boolean) => ({
      title: `Guide ${slug}`, slug, description: "Description.", icon: "Sparkles", notionPageId: null, page: published ? page : null,
    });
    const withGuides = buildLlmsTxt({ ...FALLBACK_CONTENT, guides: [guide("a", true), guide("b", false)] }, "https://exemple.test");
    expect(withGuides).toContain("[Guide a](https://exemple.test/a)");
    expect(withGuides).not.toContain("Guide b");
    expect(out).not.toContain("Pages d'information");
    expect(withGuides).toContain("(https://exemple.test/articles)"); // des pages sont publiées
  });

  it("n'écrit jamais « médecin » ni « Dr »", () => {
    expect(out).not.toMatch(/médecin|\bDr\b/i);
  });

  it("relie chaque motif à sa page détaillée quand elle est publiée", () => {
    for (const m of FALLBACK_CONTENT.motifs) expect(out).toContain(`- [${m.title}](https://exemple.test/${m.slug}) : `);
    const out2 = buildLlmsTxt({ ...FALLBACK_CONTENT, motifs: FALLBACK_CONTENT.motifs.map((m) => ({ ...m, page: null })) });
    for (const m of FALLBACK_CONTENT.motifs) expect(out2).toContain(`- ${m.title} : `);
  });

  it("omet les champs vides", () => {
    const out2 = buildLlmsTxt({ ...FALLBACK_CONTENT, consultation: { ...FALLBACK_CONTENT.consultation, price: null } });
    expect(out2).not.toContain("Tarif :");
  });
});

describe("buildLlmsTxt : sortie exacte (contrat du fichier /llms.txt)", () => {
  const C = FALLBACK_CONTENT;
  const full: SiteContent = {
    ...C,
    practitioner: { name: "Jeanne Test", title: "Ostéopathe D.O." },
    contact: {
      ...C.contact,
      street: "1 rue A",
      postalCode: "1000",
      locality: "Ville",
      countryName: "Luxembourg",
      phoneDisplay: "+352 1",
      mobilePhone: { display: "+352 691 1", e164: "+3526911" },
      email: "a@b.lu",
    },
    about: { ...C.about, shortBio: "  Bio  sur\nplusieurs   lignes\n" },
    openingHoursLines: ["Lundi : 8h – 12h", "Mardi : fermé"],
    languages: ["Français", "Anglais"],
    consultation: { ...C.consultation, durationLabel: "45 minutes", price: "90\n€", reimbursement: "Mutuelles\n remboursent" },
    payment: { ...C.payment, info: "Après  la séance." },
    access: { train: "Gare\nproche", bus: null, parking: "Parking", accessibility: null },
    motifs: [
      { ...C.motifs[0]!, title: "Dos", slug: "dos", description: "Lombalgies\n aiguës" },
      { ...C.motifs[1]!, title: "Sport", slug: "sport", description: "Entorses", page: null },
    ],
    faq: [{ question: "Q1\n ?", answer: "R1  longue." }],
    booking: { ...C.booking, url: "https://cal.eu/x" },
  };

  const pages = [
    "## Pages du site",
    "",
    "- [Page d'accueil](https://exemple.test/)",
    "- [Prise de rendez-vous en ligne](https://cal.eu/x)",
    "- [Tous les articles](https://exemple.test/articles)",
    "- [Régler votre séance](https://exemple.test/paiement)",
    "- [Mentions légales](https://exemple.test/mentions-legales)",
    "- [Confidentialité](https://exemple.test/confidentialite)",
    "",
  ];

  it("tous les champs renseignés : espaces normalisés, lien seulement vers les pages publiées", () => {
    expect(buildLlmsTxt(full, "https://exemple.test").split("\n")).toEqual([
      "# Jeanne Test – Ostéopathe D.O., Ville",
      "",
      "> Bio sur plusieurs lignes",
      "",
      "## Informations pratiques",
      "",
      "- Adresse : 1 rue A, 1000 Ville, Luxembourg",
      "- Téléphone : +352 1",
      "- Mobile : +352 691 1",
      "- E-mail : a@b.lu",
      "- Horaires : Lundi : 8h – 12h ; Mardi : fermé",
      "- Langues : Français, Anglais",
      "- Durée : 45 minutes",
      "- Tarif : 90 €",
      "- Remboursement : Mutuelles remboursent",
      "- Règlement : Après la séance.",
      "- Train : Gare proche",
      "- Stationnement : Parking",
      "",
      "## Motifs de consultation",
      "",
      "- [Dos](https://exemple.test/dos) : Lombalgies aiguës",
      "- Sport : Entorses",
      "",
      "## Questions fréquentes",
      "",
      "- Q1 ? R1 longue.",
      "",
      ...pages,
    ]);
  });

  it("champs facultatifs vides : lignes et sections omises (jamais de ligne vide ou « null »)", () => {
    const minimal: SiteContent = {
      ...full,
      contact: { ...full.contact, mobilePhone: null, email: null },
      openingHoursLines: [],
      languages: [],
      consultation: { ...full.consultation, price: null },
      access: { train: null, bus: null, parking: null, accessibility: null },
      motifs: [],
      faq: [],
    };
    expect(buildLlmsTxt(minimal, "https://exemple.test").split("\n")).toEqual([
      "# Jeanne Test – Ostéopathe D.O., Ville",
      "",
      "> Bio sur plusieurs lignes",
      "",
      "## Informations pratiques",
      "",
      "- Adresse : 1 rue A, 1000 Ville, Luxembourg",
      "- Téléphone : +352 1",
      "- Durée : 45 minutes",
      "- Remboursement : Mutuelles remboursent",
      "- Règlement : Après la séance.",
      "",
      // Aucune page détaillée publiée : pas de lien vers /articles.
      ...pages.filter((line) => !line.includes("/articles")),
    ]);
  });

  it("les quatre lignes d'accès, dans l'ordre train, bus, stationnement, PMR", () => {
    const access = { train: "T", bus: "B", parking: "P", accessibility: "A" };
    const lines = buildLlmsTxt({ ...full, access }, "https://exemple.test").split("\n");
    expect(lines.filter((l) => /^- (Train|Bus|Stationnement|Accès PMR) : /.test(l))).toEqual([
      "- Train : T",
      "- Bus : B",
      "- Stationnement : P",
      "- Accès PMR : A",
    ]);
  });

  it("sans URL explicite : utilise l'URL du site (SITE_URL)", () => {
    expect(buildLlmsTxt(full)).toContain(`- [Régler votre séance](${SITE_URL}/paiement)`);
  });
});
