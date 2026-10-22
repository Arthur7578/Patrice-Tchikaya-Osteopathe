import { describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { expectSiteRules, render, visibleText } from "@/test/render";

// Langues publiées fixées : le sélecteur n'apparaît que s'il y en a plusieurs.
vi.mock("@/config/i18n", async (orig) => ({ ...(await orig<typeof import("@/config/i18n")>()), ENABLED_LOCALES: ["fr", "de", "en", "lb", "pt"] }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const { SiteHeader } = await import("./layout/site-header");
const { SiteFooter } = await import("./layout/site-footer");
const { Hero } = await import("./sections/hero");
const { Motifs } = await import("./sections/motifs");
const { PracticalInfo } = await import("./sections/practical-info");
const { Reviews } = await import("./sections/reviews");

/** Contenu de secours rendu en anglais : textes Notion inchangés (pas de traduction ici), interface en anglais. */
const EN: SiteContent = { ...C, locale: "en" };
const hrefs = (root: ReturnType<typeof render>) => root.querySelectorAll("a").map((a) => a.getAttribute("href") ?? "");

describe("composants dans une autre langue", () => {
  it("en-tête : libellés anglais, liens internes préfixés /en, sélecteur des 5 langues", () => {
    const root = render(<SiteHeader content={EN} />);
    const text = visibleText(root);
    expect(text).toContain("Home");
    expect(text).toContain("Access & fees");
    expect(text).not.toContain("Accueil");
    expect(hrefs(root)).toEqual(expect.arrayContaining(["/en", "/en#a-propos", "/en#infos"]));
    expect(root.querySelector("summary")?.text).toMatch(/^Site language, ?en$/);
    expect(root.querySelectorAll("details a").map((a) => a.text)).toEqual(["Français", "Deutsch", "English", "Lëtzebuergesch", "Português"]);
    expectSiteRules(root);
  });

  it("en-tête en français : sélecteur présent, libellé français", () => {
    expect(render(<SiteHeader content={C} />).querySelector("summary")?.text).toMatch(/^Langue du site, ?fr$/);
  });

  it("pied de page : liens vers les pages de la langue (juridiques comprises), aucune mention de traduction", () => {
    const root = render(<SiteFooter content={EN} />);
    expect(visibleText(root)).not.toMatch(/translated/i);
    expect(hrefs(root)).toEqual(expect.arrayContaining(["/en/paiement", "/en#faq", "/en/mentions-legales", "/en/confidentialite"]));
    expect(visibleText(root)).toContain("Legal notice");
  });

  it("avis : mention « Translated » sous un avis traduit, rien sous un avis laissé tel quel", () => {
    const [first, second] = C.reviews;
    const root = render(<Reviews content={{ ...EN, reviews: [{ ...first!, text: "Great osteopath!", translated: true }, second!] }} />);
    const captions = root.querySelectorAll("figcaption").map((f) => f.text);
    expect(captions[0]).toContain("Translated");
    expect(captions[1]).not.toContain("Translated");
  });

  it("sections de l'accueil : nombres au format anglais, liens vers les pages de la langue", () => {
    const hero = render(<Hero content={EN} />);
    expect(visibleText(hero)).toContain("5.0/5 on Google Maps");
    expect(visibleText(hero)).toContain("Book an appointment online");
    const motifs = render(<Motifs content={EN} />);
    const published = C.motifs.find((m) => m.page)!;
    expect(hrefs(motifs)).toContain(`/en/${published.slug}`);
    expect(hrefs(render(<PracticalInfo content={EN} />))).toContain("/en/paiement");
    expect(visibleText(render(<Reviews content={EN} />))).toMatch(/\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/);
  });
});
