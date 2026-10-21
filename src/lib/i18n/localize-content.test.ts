import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { Booking, SiteContent } from "@/lib/content/types";
import { applyTranslations, collectTranslatable, localizeBooking, type TranslationGroups } from "./localize-content";

/** « Traduction » repérable : chaque texte préfixé par [EN]. */
const fakeTranslate = (groups: TranslationGroups): TranslationGroups =>
  Object.fromEntries(Object.entries(groups).map(([g, batch]) => [g, Object.fromEntries(Object.entries(batch).map(([k, v]) => [k, `[EN]${v}`]))]));

const withPage = (): SiteContent => ({
  ...C,
  guides: [
    {
      title: "Guide",
      slug: "guide",
      description: "Desc.",
      icon: "Sparkles",
      notionPageId: null,
      page: {
        wordCount: 300,
        lastEdited: "2026-10-01T00:00:00.000Z",
        blocks: [
          { type: "paragraph", text: [{ text: "Voir " }, { text: "le dos", href: "/mal-de-dos" }, { text: " ou " }, { text: "ce site", href: "https://exemple.test" }] },
          { type: "list", ordered: false, items: [[{ text: "un", bold: true }], [{ text: "deux", href: "/#faq" }]] },
          { type: "image", src: "https://img.test/a.jpg", alt: "Texte alternatif" },
          { type: "divider" },
        ],
      },
    },
  ],
});

describe("collectTranslatable", () => {
  const groups = collectTranslatable(withPage());

  it("un lot par thème et un lot par page détaillée (modifier une page ne fait retraduire qu'elle)", () => {
    expect(Object.keys(groups).sort()).toEqual(
      ["about", "cards", "faq", "general", "page:guide", "payment", "reviews", ...C.motifs.filter((m) => m.page).map((m) => `page:${m.slug}`)].sort(),
    );
  });

  it("contient les textes éditoriaux et les avis, jamais les noms propres, coordonnées, URL ni slugs", () => {
    const all = Object.values(groups).flatMap((batch) => Object.values(batch)).join("\n");
    expect(groups.general!["seo.h1"]).toBe(C.seo.h1);
    expect(groups.faq!["faq.0.q"]).toBe(C.faq[0]!.question);
    expect(groups["page:guide"]!["0"]).toBe('Voir <a n="0">le dos</a> ou <a n="1">ce site</a>');
    expect(groups["page:guide"]!["2.alt"]).toBe("Texte alternatif");
    expect(Object.values(groups.reviews!)).toEqual(C.reviews.map((r) => r.text));
    for (const value of [C.practitioner.name, C.contact.phoneDisplay, C.contact.street, C.booking.url, "/mal-de-dos", ...C.reviews.map((r) => r.author)]) {
      expect(all.split("\n"), value).not.toContain(value);
    }
  });

  it("ignore les textes vides", () => {
    const groupsEmpty = collectTranslatable({ ...C, seo: { ...C.seo, heroSubtitle: "  " } });
    expect(groupsEmpty.general).not.toHaveProperty("seo.heroSubtitle");
  });
});

describe("applyTranslations", () => {
  const source = withPage();
  const out = applyTranslations(source, "en", fakeTranslate(collectTranslatable(source)));

  it("remplace les textes, garde le reste tel quel et marque la langue", () => {
    expect(out.locale).toBe("en");
    expect(out.seo.h1).toBe(`[EN]${C.seo.h1}`);
    expect(out.faq[0]!.answer).toBe(`[EN]${C.faq[0]!.answer}`);
    expect(out.about.expertises[0]!.title).toBe(`[EN]${C.about.expertises[0]!.title}`);
    expect(out.images.hero.alt).toBe(`[EN]${C.images.hero.alt}`);
    expect(out.practitioner.name).toBe(C.practitioner.name);
    expect(out.contact).toEqual({ ...C.contact, countryName: `[EN]${C.contact.countryName}` });
    expect(out.reviews).toEqual(C.reviews.map((r) => ({ ...r, text: `[EN]${r.text}`, translated: true })));
    expect(out.motifs.map((m) => m.slug)).toEqual(C.motifs.map((m) => m.slug));
  });

  it("corps des pages : texte traduit, gras conservé, liens internes vers la même langue, liens externes inchangés", () => {
    const [paragraph, list, image, divider] = out.guides[0]!.page!.blocks;
    expect(paragraph).toEqual({
      type: "paragraph",
      text: [{ text: "[EN]Voir " }, { text: "le dos", href: "/en/mal-de-dos" }, { text: " ou " }, { text: "ce site", href: "https://exemple.test" }],
    });
    expect(list).toEqual({ type: "list", ordered: false, items: [[{ text: "[EN]" }, { text: "un", bold: true }], [{ text: "[EN]" }, { text: "deux", href: "/en#faq" }]] });
    expect(image).toEqual({ type: "image", src: "https://img.test/a.jpg", alt: "[EN]Texte alternatif" });
    expect(divider).toEqual({ type: "divider" });
  });

  it("traduction absente : le français reste (jamais de texte vide)", () => {
    expect(applyTranslations(source, "en", {}).seo.h1).toBe(C.seo.h1);
  });

  it("avis déjà dans la langue de la page (texte rendu inchangé) : pas de mention « traduit »", () => {
    const translations = fakeTranslate(collectTranslatable(source));
    translations.reviews!["reviews.0"] = C.reviews[0]!.text;
    const out = applyTranslations(source, "en", translations);
    expect(out.reviews[0]).toEqual(C.reviews[0]);
    expect(out.reviews[1]!.translated).toBe(true);
  });

  it("balisage abîmé par la traduction : texte brut sans balises plutôt que rien", () => {
    const broken = fakeTranslate(collectTranslatable(source));
    broken["page:guide"]!["0"] = "See <b>the back";
    expect(applyTranslations(source, "en", broken).guides[0]!.page!.blocks[0]).toEqual({ type: "paragraph", text: [{ text: "See the back" }] });
  });
});

describe("localizeBooking", () => {
  const doctena = (path: string): Booking => ({ url: `https://www.doctena.lu${path}`, provider: "generic", calLink: null, calOrigin: null });
  const id = "/booking-form/calendar/05c69bbb-4a62-480a-8dfd-dcc963c0b3f1";

  it.each([
    ["fr", `/fr${id}`],
    ["en", `/en${id}`],
    ["pt", `/pt${id}`],
    ["lb", `/fr${id}`], // pas de luxembourgeois chez Doctena : version française
  ] as const)("Doctena en %s → %s, quelle que soit la langue collée dans Notion", (locale, path) => {
    expect(localizeBooking(doctena(`/en${id}`), locale).url).toBe(`https://www.doctena.lu${path}`);
  });

  it("déjà dans la bonne langue, autre prestataire, ou URL sans langue : objet inchangé", () => {
    const fr = doctena(`/fr${id}`);
    expect(localizeBooking(fr, "fr")).toBe(fr);
    const cal: Booking = { url: "https://cal.eu/cabinet/consultation", provider: "cal", calLink: "cabinet/consultation", calOrigin: "https://app.cal.eu" };
    expect(localizeBooking(cal, "en")).toBe(cal);
    const noLang = doctena("/rdv");
    expect(localizeBooking(noLang, "en")).toBe(noLang);
    const bad: Booking = { ...cal, url: "pas une url" };
    expect(localizeBooking(bad, "en")).toBe(bad);
  });

  it("garde la requête et l'ancre de l'URL", () => {
    expect(localizeBooking(doctena(`/en${id}?ref=site#top`), "pt").url).toBe(`https://www.doctena.lu/pt${id}?ref=site#top`);
  });

  it("autres domaines Doctena (doctena.be…) aussi ; un domaine qui contient « doctena » sans l'être, non", () => {
    expect(localizeBooking({ ...doctena(""), url: `https://doctena.be/en${id}` }, "fr").url).toBe(`https://doctena.be/fr${id}`);
    const lookalike = { ...doctena(""), url: `https://notdoctena.lu.evil.test/en${id}` };
    expect(localizeBooking(lookalike, "fr")).toBe(lookalike);
  });
});
