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
    expect(root.querySelector("summary")?.getAttribute("aria-label")).toBe("Site language");
    expect(root.querySelectorAll("details a").map((a) => a.text)).toEqual(["Français", "Deutsch", "English", "Lëtzebuergesch", "Português"]);
    expectSiteRules(root);
  });

  it("en-tête en français : sélecteur présent, libellé français", () => {
    expect(render(<SiteHeader content={C} />).querySelector("summary")?.getAttribute("aria-label")).toBe("Langue du site");
  });

  it("pied de page : pages juridiques en français annoncées, aucune mention de traduction automatique", () => {
    const root = render(<SiteFooter content={EN} />);
    const text = visibleText(root);
    expect(text).not.toMatch(/translated/i);
    expect(text).toContain("Legal notice (in French)");
    expect(root.querySelector('a[href="/mentions-legales"]')?.getAttribute("hreflang")).toBe("fr");
    expect(hrefs(root)).toEqual(expect.arrayContaining(["/en/paiement", "/en#faq"]));
    expect(visibleText(render(<SiteFooter content={C} />))).not.toContain("(en français)");
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
