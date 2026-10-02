import type { Metadata } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { bookingAnchors, expectSiteRules, jsonLdNodes, renderPage, visibleText } from "@/test/render";

const getSiteContent = vi.fn<() => Promise<SiteContent>>();
const getGoogleRating = vi.fn();
vi.mock("@/lib/content/get-site-content", () => ({ getSiteContent }));
vi.mock("@/lib/google/get-google-rating", () => ({ getGoogleRating }));
// next/font est résolu par le compilateur Next : hors runtime, on le remplace par un objet de classes.
vi.mock("next/font/google", () => ({ Plus_Jakarta_Sans: () => ({ variable: "", className: "" }) }));

const { default: Home, generateMetadata: homeMetadata } = await import("./page");
const { default: Motif, generateMetadata: motifMetadata, generateStaticParams } = await import("./[slug]/page");
const { default: Mentions, generateMetadata: mentionsMetadata } = await import("./mentions-legales/page");
const { default: Confidentialite, generateMetadata: confidentialiteMetadata } = await import("./confidentialite/page");
const { default: NotFound } = await import("./not-found");
const { generateMetadata: layoutMetadata } = await import("./layout");

beforeEach(() => {
  getSiteContent.mockReset().mockResolvedValue(C);
  getGoogleRating.mockReset().mockResolvedValue(null);
});

const canonical = async (metadata: Promise<Metadata>) => (await metadata).alternates?.canonical;

describe("règle 9 : canonical défini par page, jamais dans le layout racine", () => {
  it("le layout n'en définit pas", async () => {
    expect((await layoutMetadata()).alternates).toBeUndefined();
  });

  it("chaque page définit le sien", async () => {
    const motif = C.motifs.find((m) => m.page)!;
    expect(await canonical(homeMetadata())).toBe("/");
    expect(await canonical(mentionsMetadata())).toBe("/mentions-legales");
    expect(await canonical(confidentialiteMetadata())).toBe("/confidentialite");
    expect(await canonical(motifMetadata({ params: Promise.resolve({ slug: motif.slug }) } as never))).toBe(`/${motif.slug}`);
  });
});

describe("page d'accueil", () => {
  it("un seul <h1>, JSON-LD FAQPage/WebPage, règles du site, CTA de RDV en vrai lien", async () => {
    const root = await renderPage(Home);
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(jsonLdNodes(root).map((n) => n["@type"])).toEqual(expect.arrayContaining(["WebPage", "FAQPage"]));
    expect(bookingAnchors(root, C.booking.url).length).toBeGreaterThanOrEqual(2);
    expectSiteRules(root);
  });

  it("la note Google en direct remplace celle de Notion", async () => {
    getGoogleRating.mockResolvedValue({ value: 4.7, count: 42 });
    const text = visibleText(await renderPage(Home));
    expect(text).toContain("4,7/5 sur Google Maps"); // badge du hero
    expect(text).toContain("42 avis sur Google Maps"); // encart des avis
    getGoogleRating.mockResolvedValue(null);
    expect(visibleText(await renderPage(Home))).not.toContain("4,7/5");
  });
});

describe("pages légales", () => {
  it.each([
    ["mentions légales", Mentions],
    ["confidentialité", Confidentialite],
  ])("%s : un seul <h1>, règles du site, retour à l'accueil", async (_n, Page) => {
    const root = await renderPage(Page);
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(root.querySelector('a[href="/"]')).not.toBeNull();
    expectSiteRules(root);
  });
});

describe("page introuvable", () => {
  it("un seul <h1>, retour à l'accueil et RDV en vrai lien", async () => {
    const root = await renderPage(NotFound);
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(root.querySelector('a[href="/"]')).not.toBeNull();
    expect(bookingAnchors(root, C.booking.url)).toHaveLength(1);
  });
});

describe("pages motifs ([slug])", () => {
  const published = C.motifs.filter((m) => m.page);
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) }) as never;

  it("le contenu de secours publie au moins une page motif", () => {
    expect(published.length).toBeGreaterThan(0);
  });

  it.each(published.map((m) => [m.slug]))("/%s : un seul <h1> avec la ville, JSON-LD, RDV, règles", async (slug) => {
    const root = await renderPage(() => Motif(params(slug)));
    const h1 = root.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(h1[0]!.text).toContain(C.contact.locality);
    expect(jsonLdNodes(root).map((n) => n["@type"])).toEqual(["MedicalWebPage", "BreadcrumbList"]);
    expect(bookingAnchors(root, C.booking.url).length).toBeGreaterThanOrEqual(2);
    // Un lien d'appel dans l'en-tête de page, un autre dans l'encart de rendez-vous final.
    expect(root.querySelectorAll(`a[href="tel:${C.contact.phoneE164}"]`)).toHaveLength(2);
    expectSiteRules(root);
  });

  it("slug inconnu ou motif sans page publiée : 404 (notFound)", async () => {
    // Erreur spécifique de notFound() (digest 404), pas n'importe quel plantage.
    const notFoundError = expect.objectContaining({ digest: expect.stringMatching(/404/) });
    await expect(Motif(params("inconnu"))).rejects.toEqual(notFoundError);
    const unpublished = { ...C, motifs: C.motifs.map((m) => ({ ...m, page: null })) };
    getSiteContent.mockResolvedValue(unpublished);
    await expect(Motif(params(C.motifs[0]!.slug))).rejects.toEqual(notFoundError);
  });

  it("generateMetadata renvoie {} pour un slug sans page (pas de métadonnées inventées)", async () => {
    expect(await motifMetadata(params("inconnu"))).toEqual({});
  });

  it("generateMetadata : titre absolu, canonical, image de partage redonnée (openGraph remplace celui du layout)", async () => {
    const m = await motifMetadata(params(published[0]!.slug));
    expect(m.title).toEqual({ absolute: expect.stringContaining(C.contact.locality) });
    expect(m.openGraph?.images).toBeTruthy();
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("generateStaticParams : tous les motifs, sauf les slugs réservés", async () => {
    const withReserved = { ...C, motifs: [...C.motifs, { ...C.motifs[0]!, slug: "paiement" }] };
    getSiteContent.mockResolvedValue(withReserved);
    const slugs = (await generateStaticParams()).map((p) => p.slug);
    expect(slugs).toEqual(C.motifs.map((m) => m.slug));
    expect(slugs).not.toContain("paiement");
  });
});

describe("pages d'information ([slug], guides)", () => {
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) }) as never;
  const sample = C.motifs.find((m) => m.page)!;
  const guide = { ...sample, title: "Ostéopathe ou kiné : quelle différence ?", slug: "osteopathe-kinesitherapeute-difference" };
  const withGuide: SiteContent = { ...C, guides: [guide] };

  beforeEach(() => getSiteContent.mockResolvedValue(withGuide));

  it("un seul <h1> = titre Notion tel quel, JSON-LD WebPage + fil d'Ariane, RDV, règles du site", async () => {
    const root = await renderPage(() => Motif(params(guide.slug)));
    const h1 = root.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(h1[0]!.text).toBe(guide.title); // pas de « à Dudelange » ajouté
    expect(jsonLdNodes(root).map((n) => n["@type"])).toEqual(["WebPage", "BreadcrumbList"]);
    expect(bookingAnchors(root, C.booking.url).length).toBeGreaterThanOrEqual(2);
    expectSiteRules(root);
  });

  it("liens « à lire aussi » : guides puis motifs ; les motifs listent les guides à leur tour", async () => {
    const guidePage = await renderPage(() => Motif(params(guide.slug)));
    const motifLinks = C.motifs.filter((m) => m.page).map((m) => `/${m.slug}`);
    for (const href of motifLinks) expect(guidePage.querySelectorAll(`a[href="${href}"]`).length).toBeGreaterThan(0);
    const motifPage = await renderPage(() => Motif(params(sample.slug)));
    expect(motifPage.querySelectorAll(`a[href="/${guide.slug}"]`).length).toBeGreaterThan(0);
  });

  it("métadonnées : titre « {Titre} | praticien », description Notion, canonical", async () => {
    const m = await motifMetadata(params(guide.slug));
    expect(m.title).toEqual({ absolute: `${guide.title} | ${C.practitioner.name}` });
    expect(m.description).toBe(guide.description.trim());
    expect(m.alternates?.canonical).toBe(`/${guide.slug}`);
  });

  it("guide sans page publiée : 404 ; generateStaticParams inclut les guides", async () => {
    getSiteContent.mockResolvedValue({ ...C, guides: [{ ...guide, page: null }] });
    await expect(Motif(params(guide.slug))).rejects.toEqual(expect.objectContaining({ digest: expect.stringMatching(/404/) }));
    expect((await generateStaticParams()).map((p) => p.slug)).toContain(guide.slug);
  });

  it("accueil : liste « Bon à savoir » avec les seuls guides publiés", async () => {
    const root = await renderPage(() => Home());
    expect(root.querySelectorAll(`a[href="/${guide.slug}"]`).length).toBeGreaterThan(0);
    getSiteContent.mockResolvedValue({ ...C, guides: [{ ...guide, page: null }] });
    const without = await renderPage(() => Home());
    expect(without.querySelectorAll(`a[href="/${guide.slug}"]`)).toHaveLength(0);
  });
});

describe("confidentialité : section Google Tag Manager", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["absente sans identifiant GTM", "", false],
    ["absente avec un identifiant invalide", "GTM-abc'", false],
    ["absente si l'identifiant valide est précédé d'autre chose", "xGTM-ABC123", false],
    ["absente si l'identifiant valide est suivi d'autre chose", "GTM-ABC123'", false],
    ["présente (#cookies, cible du lien « Gérer les cookies ») avec un identifiant valide", "GTM-ABC123", true],
  ])("%s", async (_label, id, expected) => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", id);
    expect(Boolean((await renderPage(Confidentialite)).querySelector("#cookies"))).toBe(expected);
  });
});

describe("mentions légales : contenu", () => {
  const paragraphs = async (c: SiteContent) => {
    getSiteContent.mockResolvedValue(c);
    return (await renderPage(Mentions)).querySelectorAll("main p").map((p) => p.text.replace(/\s+/g, " ").trim()).join(" | ");
  };

  it("métadonnées : titre et description avec le praticien et la ville", async () => {
    expect(await mentionsMetadata()).toMatchObject({
      title: "Mentions légales",
      description: `Mentions légales du site de ${C.practitioner.name}, ${C.practitioner.title} à ${C.contact.locality}.`,
    });
  });

  it("valeurs Notion affichées à leur place", async () => {
    const text = await paragraphs({
      ...C,
      contact: { ...C.contact, email: "cabinet@exemple.lu" },
      legal: { authorizationNumber: "M-123", vatStatus: "Non assujetti" },
      about: { ...C.about, education: "D.O., 2010" },
    });
    expect(text).toContain(`Téléphone : ${C.contact.phoneDisplay}`);
    expect(text).toContain("E-mail : cabinet@exemple.lu");
    expect(text).toContain(`${C.practitioner.name} exerce sous autorisation`);
    expect(text).toContain("Numéro d'autorisation d'exercer : M-123");
    expect(text).toContain("École et année du diplôme : D.O., 2010");
    expect(text).toContain("Numéro de TVA / immatriculation : Non assujetti");
    expect(text).toContain("disponibles sur vercel.com/legal");
    expect(text).not.toContain("À COMPLÉTER — champ Notion");
  });

  it("champ vide dans Notion : texte d'attente qui nomme le champ à remplir", async () => {
    const text = await paragraphs({
      ...C,
      contact: { ...C.contact, email: null },
      legal: { authorizationNumber: null, vatStatus: null },
      about: { ...C.about, education: null },
    });
    expect(text).toContain("E-mail : [À COMPLÉTER : adresse e-mail professionnelle — champ Notion Email_Contact]");
    expect(text).toContain(
      "Numéro d'autorisation d'exercer : [À COMPLÉTER — champ Notion Numero_Autorisation_Exercer ; délivré par le ministère de la Santé]",
    );
    expect(text).toContain("École et année du diplôme : [À COMPLÉTER — champ Notion Formation, base Section A_Propos]");
    expect(text).toContain(
      "Numéro de TVA / immatriculation : [À COMPLÉTER — champ Notion Statut_TVA ; les soins de santé sont en général exonérés de TVA (art. 44 de la loi TVA), à confirmer avec votre comptable]",
    );
  });
});

describe("confidentialité et accueil : métadonnées", () => {
  it("confidentialité : titre et description avec le praticien et la ville", async () => {
    expect(await confidentialiteMetadata()).toMatchObject({
      title: "Confidentialité",
      description: `Politique de confidentialité du site de ${C.practitioner.name}, ${C.practitioner.title} à ${C.contact.locality}.`,
    });
  });

  it("accueil : titre absolu, partage (Open Graph et X) avec la grande image", async () => {
    const m = await homeMetadata();
    expect(m.title).toEqual({ absolute: expect.any(String) });
    expect(m.openGraph).toMatchObject({ url: "/", title: (m.title as { absolute: string }).absolute, description: m.description });
    expect(m.twitter).toEqual({
      card: "summary_large_image",
      title: (m.title as { absolute: string }).absolute,
      description: m.description,
      images: ["/opengraph-image"],
    });
  });
});
