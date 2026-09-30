import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { bookingAnchors, expectSiteRules, render, visibleText } from "@/test/render";
import { About } from "./about";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { Motifs } from "./motifs";
import { PracticalInfo } from "./practical-info";
import { Reviews } from "./reviews";

const sections = { Hero, About, Motifs, Reviews, Faq, PracticalInfo };

describe.each(Object.entries(sections))("section %s", (_name, Section) => {
  it("respecte les règles du site (pas de « médecin », alt présent, pas de script tiers)", () => {
    expectSiteRules(render(<Section content={C} />));
  });

  it("ne contient jamais deux <h1> (règle 8)", () => {
    expect(render(<Section content={C} />).querySelectorAll("h1").length).toBeLessThanOrEqual(1);
  });
});

describe("Hero", () => {
  const root = render(<Hero content={C} />);

  it("porte l'unique <h1>, avec la ville", () => {
    const h1 = root.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(h1[0]!.text).toContain(C.contact.locality);
  });

  it("n'a aucune animation d'apparition (règle 4 : élément LCP)", () => {
    expect(root.querySelectorAll("[data-reveal]")).toHaveLength(0);
  });

  it("propose un CTA de RDV en vrai <a href> (règle 6)", () => {
    expect(bookingAnchors(root, C.booking.url).length).toBeGreaterThanOrEqual(1);
  });
});

describe("sections sous la ligne de flottaison", () => {
  it("About et Motifs utilisent Reveal (le Hero, jamais : voir plus haut)", () => {
    for (const S of [About, Motifs]) {
      expect(render(<S content={C} />).querySelectorAll("[data-reveal]").length, S.name).toBeGreaterThan(0);
    }
  });
});

describe("Faq", () => {
  it("affiche chaque réponse dans le HTML (contenu visible, requis par le JSON-LD FAQPage)", () => {
    const text = visibleText(render(<Faq content={C} />));
    for (const item of C.faq) {
      expect(text).toContain(item.question.slice(0, 30));
      expect(text).toContain(item.answer.slice(0, 30));
    }
  });

  it("n'affiche rien si la FAQ est vide", () => {
    const empty = { ...C, faq: [] } as SiteContent;
    const root = render(<Faq content={empty} />);
    expect(root.querySelector("#faq")).toBeNull();
    expect(root.text.trim()).toBe("");
  });
});

describe("Motifs", () => {
  it("affiche chaque motif ; ne lie que les pages publiées", () => {
    const root = render(<Motifs content={C} />);
    const text = visibleText(root);
    for (const m of C.motifs) expect(text).toContain(m.title);
    for (const m of C.motifs) {
      const linked = root.querySelectorAll(`a[href="/${m.slug}"]`).length > 0;
      expect(linked, m.slug).toBe(Boolean(m.page));
    }
  });
});

describe("PracticalInfo", () => {
  const root = render(<PracticalInfo content={C} />);

  it("lie le téléphone en tel: et propose le RDV en vrai <a href>", () => {
    expect(root.querySelectorAll(`a[href="tel:${C.contact.phoneE164}"]`).length).toBeGreaterThanOrEqual(1);
    expect(bookingAnchors(root, C.booking.url).length).toBeGreaterThanOrEqual(1);
  });

  it("masque le numéro mobile quand il n'est pas renseigné", () => {
    const without = { ...C, contact: { ...C.contact, mobilePhone: null } } as SiteContent;
    expect(render(<PracticalInfo content={without} />).querySelectorAll('a[href^="tel:+3526"]')).toHaveLength(0);
  });

  it("affiche la ligne tarif seulement si le tarif est renseigné", () => {
    const priced = { ...C, consultation: { ...C.consultation, price: "60 €" } } as SiteContent;
    const free = { ...C, consultation: { ...C.consultation, price: null } } as SiteContent;
    expect(visibleText(render(<PracticalInfo content={priced} />))).toContain("60");
    expect(visibleText(render(<PracticalInfo content={free} />))).not.toContain("60 €");
  });
});
