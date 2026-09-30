import type { Metadata } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    expect(text).toContain("4,7");
    expect(text).toContain("42");
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
