import { afterEach, describe, expect, it, vi } from "vitest";
import { NAV } from "@/content/ui-copy";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { bookingAnchors, expectSiteRules, render, visibleText } from "@/test/render";
import { BackToHome } from "./back-to-home";
import { MobileActionBar } from "./mobile-action-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SkipLink } from "./skip-link";

vi.mock("./mobile-menu", () => ({ MobileMenu: () => <div data-testid="mobile-menu" /> }));

describe("SiteHeader", () => {
  const root = render(<SiteHeader content={C} />);

  it("respecte les règles du site", () => expectSiteRules(root));

  it("n'a aucun <h1> (un seul par page, dans le contenu)", () => {
    expect(root.querySelectorAll("h1")).toHaveLength(0);
  });

  it("liste l'accueil et toute la navigation, et embarque le menu mobile", () => {
    const hrefs = root.querySelectorAll("a").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
    for (const item of NAV) expect(hrefs).toContain(item.href);
    expect(root.querySelector('[data-testid="mobile-menu"]')).not.toBeNull();
  });

  it("propose un CTA de RDV en vrai <a href> (règle 6)", () => {
    expect(bookingAnchors(root, C.booking.url).length).toBeGreaterThanOrEqual(1);
  });
});

describe("SiteFooter", () => {
  const root = render(<SiteFooter content={C} />);

  it("respecte les règles du site", () => expectSiteRules(root));

  it("lie les pages légales et le téléphone du cabinet", () => {
    const hrefs = root.querySelectorAll("a").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(["/mentions-legales", "/confidentialite", `tel:${C.contact.phoneE164}`]));
  });

  it("ne répète pas le lien « Accueil » (réservé au header)", () => {
    expect(visibleText(root)).not.toMatch(/\bAccueil\b/);
  });

  it("affiche le numéro mobile seulement s'il est renseigné", () => {
    const mobile = { display: "+352 691 000 000", e164: "+352691000000" };
    const withMobile = { ...C, contact: { ...C.contact, mobilePhone: mobile } } as SiteContent;
    const without = { ...C, contact: { ...C.contact, mobilePhone: null } } as SiteContent;
    expect(render(<SiteFooter content={withMobile} />).querySelector(`a[href="tel:${mobile.e164}"]`)).not.toBeNull();
    expect(render(<SiteFooter content={without} />).querySelector(`a[href="tel:${mobile.e164}"]`)).toBeNull();
  });
});

describe("MobileActionBar", () => {
  const root = render(<MobileActionBar booking={C.booking} phoneE164={C.contact.phoneE164} phoneDisplay={C.contact.phoneDisplay} />);

  it("contient un appel (tel:) et un RDV en vrais liens <a href>", () => {
    expect(root.querySelector(`a[href="tel:${C.contact.phoneE164}"]`)).not.toBeNull();
    expect(bookingAnchors(root, C.booking.url)).toHaveLength(1);
  });
});

describe("SkipLink et BackToHome", () => {
  it("le lien d'évitement pointe vers #contenu", () => {
    expect(render(<SkipLink />).querySelector("a")?.getAttribute("href")).toBe("#contenu");
  });

  it("BackToHome renvoie vers l'accueil", () => {
    expect(render(<BackToHome />).querySelector("a")?.getAttribute("href")).toBe("/");
  });
});

describe("SiteFooter : horaires", () => {
  it("liste les horaires seulement s'ils existent", () => {
    const withHours = { ...C, openingHoursLines: ["Lundi : 8h – 19h"] };
    expect(visibleText(render(<SiteFooter content={withHours} />))).toContain("Lundi : 8h – 19h");
    expect(visibleText(render(<SiteFooter content={{ ...C, openingHoursLines: [] }} />))).not.toContain("Lundi");
  });
});

describe("SiteFooter : lien « Gérer les cookies »", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["absent sans identifiant GTM", "", false],
    ["absent avec un identifiant invalide", "GTM-abc", false],
    ["présent (rouvre la bannière) avec un identifiant valide", "GTM-ABC123", true],
  ])("%s", (_label, id, expected) => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", id);
    expect(Boolean(render(<SiteFooter content={C} />).querySelector('a[href="#cookies"]'))).toBe(expected);
  });
});
