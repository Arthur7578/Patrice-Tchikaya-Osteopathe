import { describe, expect, it } from "vitest";
import { COPY } from "@/content/ui-copy";
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

describe("Hero : image, note et durée", () => {
  const image = (src: string | null, alt: string) => ({ src, alt, width: 800, height: 1000 });

  it("photo du hero si elle existe, sinon le portrait, sinon un emplacement vide ; toujours prioritaire (LCP)", () => {
    const withHero = { ...C, images: { ...C.images, hero: image("https://exemple.test/hero.jpg", "Le cabinet"), portrait: image("https://exemple.test/p.jpg", "Portrait") } };
    const portraitOnly = { ...C, images: { ...C.images, hero: image(null, "Le cabinet"), portrait: image("https://exemple.test/p.jpg", "Portrait") } };
    const none = { ...C, images: { ...C.images, hero: image(null, "Le cabinet"), portrait: image(null, "Portrait") } };

    const heroImg = render(<Hero content={withHero} />).querySelector("img")!;
    expect(heroImg.getAttribute("alt")).toBe("Le cabinet");
    expect(heroImg.getAttribute("fetchpriority")).toBe("high");
    expect(render(<Hero content={portraitOnly} />).querySelector("img")?.getAttribute("alt")).toBe("Portrait");
    expect(render(<Hero content={none} />).querySelectorAll("img")).toHaveLength(0);
  });

  it("badge de note « 4,7/5 sur Google Maps » seulement si une note existe", () => {
    expect(visibleText(render(<Hero content={{ ...C, rating: { value: 4.7, count: 12 } }} />))).toContain("4,7/5 sur Google Maps");
    expect(visibleText(render(<Hero content={{ ...C, rating: null }} />))).not.toContain("/5");
  });

  it("carte « Consultation N min » seulement si la durée est connue", () => {
    const known = { ...C, consultation: { ...C.consultation, durationMinutes: 45 } };
    const unknown = { ...C, consultation: { ...C.consultation, durationMinutes: null } };
    expect(visibleText(render(<Hero content={known} />))).toContain("Consultation 45 min");
    expect(visibleText(render(<Hero content={unknown} />))).not.toContain("Consultation ");
  });

  it("téléphone du cabinet en lien tel:", () => {
    expect(render(<Hero content={C} />).querySelector(`#hero-cta a[href="tel:${C.contact.phoneE164}"]`)).not.toBeNull();
  });
});

describe("About : biographie et formation", () => {
  it("biographie longue : un paragraphe par bloc séparé d'une ligne vide", () => {
    const c = { ...C, about: { ...C.about, longBio: "Premier paragraphe.\n\nDeuxième paragraphe." } };
    const text = render(<About content={c} />).querySelectorAll("p").map((p) => p.text);
    expect(text).toEqual(expect.arrayContaining(["Premier paragraphe.", "Deuxième paragraphe."]));
  });

  it("formation : masquée sans diplôme ni formation continue ; sinon diplôme d'abord, puis chaque formation", () => {
    const none = { ...C, about: { ...C.about, education: null, continuingEducation: [] } };
    const both = { ...C, about: { ...C.about, education: "D.O. (2015)", continuingEducation: ["Pédiatrie", "Sport"] } };
    const onlyContinuing = { ...C, about: { ...C.about, education: null, continuingEducation: ["Sport"] } };
    const training = (c: SiteContent) =>
      render(<About content={c} />)
        .querySelectorAll("h3")
        .find((h) => h.text === COPY.about.training)
        ?.nextElementSibling?.querySelectorAll("li")
        .map((li) => li.text.trim());
    expect(training(none)).toBeUndefined();
    expect(training(both)).toEqual(["D.O. (2015)", "Pédiatrie", "Sport"]);
    expect(training(onlyContinuing)).toEqual(["Sport"]);
  });
});

describe("Reviews : avis et note Google", () => {
  it("aucun avis : section absente", () => {
    expect(render(<Reviews content={{ ...C, reviews: [] }} />).text.trim()).toBe("");
  });

  it("chaque avis affiche auteur, texte et étoiles, dans une zone défilable au clavier", () => {
    const root = render(<Reviews content={C} />);
    const figures = root.querySelectorAll("figure");
    expect(figures).toHaveLength(C.reviews.length);
    for (const [i, review] of C.reviews.entries()) {
      expect(figures[i]!.text).toContain(review.author);
      expect(figures[i]!.text).toContain(review.text.slice(0, 30));
    }
    expect(root.querySelector('[aria-label="Avis patients"]')?.getAttribute("tabindex")).toBe("0");
  });

  it("note : « N avis » si le nombre est connu, sinon « Note » ; rien sans note", () => {
    expect(visibleText(render(<Reviews content={{ ...C, rating: { value: 4.8, count: 23 } }} />))).toContain("23 avis sur Google Maps");
    expect(visibleText(render(<Reviews content={{ ...C, rating: { value: 4.8, count: null } }} />))).toContain("Note sur Google Maps");
    expect(visibleText(render(<Reviews content={{ ...C, rating: null }} />))).not.toContain("Google Maps");
  });

  it("« Laisser un avis » seulement pour un lien d'avis Google (g.page/r/…)", () => {
    const review = render(<Reviews content={{ ...C, googleBusinessUrl: "https://g.page/r/ABC" }} />);
    expect(review.querySelector('a[href="https://g.page/r/ABC/review"]')).not.toBeNull();
    const profile = render(<Reviews content={{ ...C, googleBusinessUrl: "https://maps.google.com/?cid=1" }} />);
    expect(profile.querySelector('a[href="https://maps.google.com/?cid=1"]')).not.toBeNull();
    expect(profile.querySelector('a[href$="/review"]')).toBeNull();
    expect(render(<Reviews content={{ ...C, googleBusinessUrl: null }} />).querySelectorAll('a[target="_blank"]')).toHaveLength(0);
  });
});

describe("PracticalInfo : horaires", () => {
  it("affiche chaque ligne d'horaires seulement si elles existent", () => {
    const withHours = { ...C, openingHoursLines: ["Lundi : 8h – 19h", "Samedi : 9h – 12h"] };
    expect(visibleText(render(<PracticalInfo content={withHours} />))).toContain("Samedi : 9h – 12h");
    expect(visibleText(render(<PracticalInfo content={{ ...C, openingHoursLines: [] }} />))).not.toContain("Lundi");
  });
});
