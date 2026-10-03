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

  it("points Hero_Points : seuls ceux listés, dans l'ordre ; tarif précédé de « Tarif : », masqué s'il manque", () => {
    const points = (c: typeof C) =>
      [...render(<Hero content={c} />).querySelectorAll("ul li")].map((li) => li.textContent?.trim());
    const withPrice = {
      ...C,
      consultation: { ...C.consultation, price: "90 €", durationLabel: "45 minutes" },
      rowOrder: { ...C.rowOrder, hero: ["tarif", "duree", "confirmation"] as typeof C.rowOrder.hero },
    };
    expect(points(withPrice)).toEqual(["Tarif : 90 €", "Séance de 45 minutes", "Confirmation par e-mail"]);
    expect(points({ ...withPrice, consultation: { ...withPrice.consultation, price: null } })).toEqual([
      "Séance de 45 minutes",
      "Confirmation par e-mail",
    ]);
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

describe("PracticalInfo : photo, langues, accès", () => {
  const image = (src: string | null) => ({ src, alt: "La salle de consultation", width: 1200, height: 800 });

  it("photo du cabinet seulement si une URL est renseignée (avec l'alt Notion)", () => {
    const withPhoto = { ...C, images: { ...C.images, cabinet: image("https://exemple.test/c.jpg") } };
    expect(render(<PracticalInfo content={withPhoto} />).querySelector('img[alt="La salle de consultation"]')).not.toBeNull();
    expect(render(<PracticalInfo content={{ ...C, images: { ...C.images, cabinet: image(null) } }} />).querySelector('img[alt="La salle de consultation"]')).toBeNull();
  });

  it("langues : ligne affichée seulement si des langues sont renseignées", () => {
    expect(visibleText(render(<PracticalInfo content={{ ...C, languages: ["Français", "Italien"] }} />))).toContain("Français, Italien");
    expect(visibleText(render(<PracticalInfo content={{ ...C, languages: [] }} />))).not.toContain(COPY.infos.labels.languages);
  });

  it("accès : chaque ligne (train, bus, stationnement, PMR) seulement si elle est renseignée", () => {
    const all = { ...C, access: { train: "Gare à 280 m", bus: "Lignes 8, 9", parking: "Parking à 150 m", accessibility: "Ascenseur" } };
    const none = { ...C, access: { train: null, bus: null, parking: null, accessibility: null } };
    const text = visibleText(render(<PracticalInfo content={all} />));
    for (const value of Object.values(all.access)) expect(text).toContain(value);
    const empty = visibleText(render(<PracticalInfo content={none} />));
    for (const label of [COPY.infos.labels.train, COPY.infos.labels.bus, COPY.infos.labels.parking, COPY.infos.labels.accessibility]) {
      expect(empty).not.toContain(label);
    }
  });

  it("carte : fiche Google si elle existe, sinon recherche Google Maps ; itinéraire toujours proposé (nouvel onglet)", () => {
    const withProfile = render(<PracticalInfo content={{ ...C, googleBusinessUrl: "https://g.page/r/ABC" }} />);
    expect(withProfile.querySelector('a[href="https://g.page/r/ABC"]')).not.toBeNull();
    const without = render(<PracticalInfo content={{ ...C, googleBusinessUrl: null }} />);
    expect(without.querySelector('a[href^="https://www.google.com/maps/search/"]')).not.toBeNull();
    const directions = without.querySelector('a[href^="https://www.google.com/maps/dir/"]')!;
    expect(directions.getAttribute("target")).toBe("_blank");
    expect(directions.getAttribute("rel")).toBe("noopener");
  });
});

describe("Faq : accordéon et aide", () => {
  it("première question ouverte au chargement, les autres fermées ; aide avec le téléphone du cabinet", () => {
    const root = render(<Faq content={C} />);
    const rows = root.querySelectorAll("#faq details.faq-item");
    expect(rows.map((d) => d.hasAttribute("open"))).toEqual(C.faq.map((_, i) => i === 0));
    // au-delà de 5 questions, le reste est replié derrière un <details> natif (réponses toujours dans le HTML)
    const more = root.querySelector("#faq details.faq-more");
    expect(more?.hasAttribute("open")).toBe(false);
    expect(more?.querySelectorAll("details.faq-item").length).toBe(Math.max(C.faq.length - 5, 0));
    expect(root.querySelector(`#faq a[href="tel:${C.contact.phoneE164}"]`)).not.toBeNull();
  });
});

describe("Motifs : ligne d'aide", () => {
  it("phrase d'aide puis le numéro du cabinet, en lien tel:", () => {
    const root = render(<Motifs content={C} />);
    expect(visibleText(root)).toContain(`${COPY.motifs.helpLine} ${C.contact.phoneDisplay}`);
    expect(root.querySelector(`a[href="tel:${C.contact.phoneE164}"]`)?.text).toBe(C.contact.phoneDisplay);
  });
});

describe("PracticalInfo : téléphones, tarif, horaires et structure des listes", () => {
  const mobile = { display: "+352 691 044 147", e164: "+352691044147" };
  const labelsOf = (root: ReturnType<typeof render>) => root.querySelectorAll("dd > p.font-semibold").map((p) => p.text);

  it("« Cabinet : » puis le numéro ; « Mobile : » puis le mobile, en lien tel:", () => {
    const root = render(<PracticalInfo content={{ ...C, contact: { ...C.contact, mobilePhone: mobile } }} />);
    const text = visibleText(root);
    expect(text).toContain(`Cabinet : ${C.contact.phoneDisplay}`);
    expect(text).toContain(`Mobile : ${mobile.display}`);
    expect(root.querySelector(`a[href="tel:${mobile.e164}"]`)?.text).toBe(mobile.display);
  });

  it("tarif et horaires : ligne avec son libellé si renseignés, aucune ligne sinon", () => {
    const full = render(<PracticalInfo content={{ ...C, consultation: { ...C.consultation, price: "60 €" }, openingHoursLines: ["Lundi : 8h – 19h"] }} />);
    expect(labelsOf(full)).toEqual(expect.arrayContaining([COPY.infos.labels.price, COPY.infos.labels.hours]));
    const empty = render(<PracticalInfo content={{ ...C, consultation: { ...C.consultation, price: null }, openingHoursLines: [] }} />);
    expect(labelsOf(empty)).not.toContain(COPY.infos.labels.price);
    expect(labelsOf(empty)).not.toContain(COPY.infos.labels.hours);
  });

  it("listes valides : chaque <dt> dans un <dl>, aucun <dl> imbriqué ni vide (y compris sans tarif)", () => {
    const root = render(<PracticalInfo content={{ ...C, consultation: { ...C.consultation, price: null } }} />);
    expect(root.querySelectorAll("dt").every((dt) => dt.parentNode?.rawTagName === "dl")).toBe(true);
    expect(root.querySelectorAll("dl dl")).toHaveLength(0);
    expect(root.querySelectorAll("dl").filter((dl) => dl.querySelectorAll("dt").length === 0)).toHaveLength(0);
  });
});

describe("PracticalInfo : essentiel visible, détails repliés", () => {
  const sumOf = (d: ReturnType<typeof render>) => d.querySelector("summary h3")?.text;
  const folded = (root: ReturnType<typeof render>) => root.querySelectorAll("#infos details");
  const essentialLabels = (root: ReturnType<typeof render>) =>
    root.querySelectorAll("#infos > div > div > div > dl > dd > p.font-semibold").map((p) => p.text);

  it("adresse, téléphone, durée, tarif et horaires hors des blocs repliables ; transports et « bon à savoir » repliés", () => {
    const root = render(<PracticalInfo content={{ ...C, consultation: { ...C.consultation, price: "60 €" }, openingHoursLines: ["Lundi : 8h – 19h"] }} />);
    const { labels } = COPY.infos;
    expect(essentialLabels(root)).toEqual([labels.address, labels.phone, labels.duration, labels.price, labels.hours]);
    const blocks = folded(root);
    expect(blocks.map(sumOf)).toEqual([COPY.infos.transportTitle, COPY.infos.moreTitle]);
    expect(blocks.every((d) => !d.hasAttribute("open"))).toBe(true);
    expect(blocks[0].querySelectorAll("dd > p.font-semibold").map((p) => p.text)).toEqual([labels.train, labels.bus, labels.parking, labels.accessibility]);
    expect(blocks[1].querySelectorAll("dd > p.font-semibold").map((p) => p.text)).toEqual([labels.payment, labels.reimbursement, labels.languages]);
  });

  it("sous chaque titre replié : les libellés des seules lignes renseignées", () => {
    const access = { ...C.access, bus: null, accessibility: null };
    const root = render(<PracticalInfo content={{ ...C, access, languages: [] }} />);
    const hints = folded(root).map((d) => d.querySelector("summary span")?.text);
    expect(hints).toEqual([
      `${COPY.infos.labels.train} · ${COPY.infos.labels.parking}`,
      `${COPY.infos.labels.payment} · ${COPY.infos.labels.reimbursement}`,
    ]);
  });

  it("bloc « Venir au cabinet » absent quand aucun transport n'est renseigné", () => {
    const none = { train: null, bus: null, parking: null, accessibility: null };
    const blocks = folded(render(<PracticalInfo content={{ ...C, access: none }} />));
    expect(blocks.map(sumOf)).toEqual([COPY.infos.moreTitle]);
  });

  it("ordre Notion respecté dans chaque groupe (Infos_Ordre, Acces_Ordre)", () => {
    const rowOrder = {
      infos: ["langues", "horaires", "tarif", "reglement", "acces", "duree", "remboursement", "telephone"] as const,
      access: ["pmr", "adresse", "parking", "train", "bus"] as const,
    };
    const root = render(<PracticalInfo content={{ ...C, rowOrder: { ...C.rowOrder, infos: [...rowOrder.infos], access: [...rowOrder.access] }, consultation: { ...C.consultation, price: "60 €" } }} />);
    const { labels } = COPY.infos;
    expect(essentialLabels(root)).toEqual([labels.hours, labels.price, labels.address, labels.duration, labels.phone]);
    const [transport, more] = folded(root).map((d) => d.querySelectorAll("dd > p.font-semibold").map((p) => p.text));
    expect(transport).toEqual([labels.accessibility, labels.parking, labels.train, labels.bus]);
    expect(more).toEqual([labels.languages, labels.payment, labels.reimbursement]);
  });

  it("l'ancre #acces (liens des guides) vise la ligne Adresse, toujours visible", () => {
    const root = render(<PracticalInfo content={C} />);
    expect(root.querySelectorAll("#acces")).toHaveLength(1);
    expect(root.querySelector("#acces")?.closest("details")).toBeNull();
    expect(root.querySelector("#acces")?.nextElementSibling?.querySelector("address")).not.toBeNull();
  });
});

describe("About : paragraphes de la biographie", () => {
  it("un retour à la ligne simple reste dans le paragraphe ; lignes vides en fin ignorées", () => {
    const c = { ...C, about: { ...C.about, longBio: "Premier.\nsuite\n\nDeuxième.\n\n" } };
    const paragraphs = render(<About content={c} />).querySelectorAll("p").map((p) => p.text);
    expect(paragraphs).toEqual(expect.arrayContaining(["Premier.\nsuite", "Deuxième."]));
    expect(paragraphs).not.toContain("suite");
    expect(paragraphs.filter((t) => t.trim() === "")).toEqual([]);
  });
});

describe("Reviews : étoiles et date de chaque avis", () => {
  it("étoiles seulement si l'avis a une note ; « Auteur · mois année » seulement si l'avis est daté", () => {
    const reviews = [
      { author: "Anne S.", rating: 5, text: "Très bien.", date: "2026-03-01" },
      { author: "Paul S.", rating: null, text: "Correct.", date: null },
    ];
    const figures = render(<Reviews content={{ ...C, reviews }} />).querySelectorAll("figure");
    expect(figures[0]!.querySelector(".sr-only")?.text).toBe(COPY.starRating("5,0"));
    expect(figures[1]!.querySelectorAll("svg")).toHaveLength(0);
    const caption = (i: number) => visibleText(figures[i]!.querySelector("figcaption")!).trim();
    expect(caption(0)).toMatch(new RegExp(`^Anne S\\. · \\S+ 2026 · ${COPY.reviews.source}$`));
    expect(caption(1)).toBe(`Paul S. · ${COPY.reviews.source}`);
  });
});

