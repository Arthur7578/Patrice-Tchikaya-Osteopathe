import { describe, expect, it } from "vitest";
import { LOCALES } from "@/config/i18n";
import { FORBIDDEN_TITLES } from "@/lib/i18n/rules";
import { COPY_FR, getCopy, homeLink, navLinks } from "./ui-copy";

type Tree = { [key: string]: unknown };

/** Feuilles d'un dictionnaire : chemin → valeur (les fonctions sont appelées avec des valeurs repérables). */
function leaves(tree: Tree, prefix = ""): Array<[string, unknown]> {
  return Object.entries(tree).flatMap(([key, value]): Array<[string, unknown]> => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "function") return [[path, (value as (...args: unknown[]) => unknown)("«A»", "«B»", "«C»")]];
    if (value && typeof value === "object") return leaves(value as Tree, path);
    return [[path, value]];
  });
}

describe("textes d'interface : chaque langue", () => {
  const fr = leaves(COPY_FR);

  it.each(LOCALES)("%s : mêmes clés que le français, aucun texte vide ou resté identique par erreur", (locale) => {
    const copy = leaves(getCopy(locale));
    expect(copy.map(([path]) => path)).toEqual(fr.map(([path]) => path));
    // Seuls ces textes peuvent rester vides (mentions propres aux pages traduites) ; en français, ils le sont.
    const optional = new Set(["languages.frenchOnly"]);
    for (const [path, value] of copy) {
      if (!optional.has(path)) expect(String(value).trim(), `${locale} ${path}`).not.toBe("");
    }
  });

  it.each(LOCALES)("%s : chaque gabarit reprend ses valeurs (ville, prix, nom…)", (locale) => {
    const frTemplates = new Map(leaves(COPY_FR));
    for (const [path, value] of leaves(getCopy(locale))) {
      const expected = ["«A»", "«B»", "«C»"].filter((v) => String(frTemplates.get(path)).includes(v));
      for (const v of expected) expect(String(value), `${locale} ${path}`).toContain(v);
    }
  });

  it.each(LOCALES)("%s : règle 10, ni « médecin » ni « Dr » (ni « doctor », « Dokter »…)", (locale) => {
    for (const [path, value] of leaves(getCopy(locale))) expect(String(value), `${locale} ${path}`).not.toMatch(FORBIDDEN_TITLES);
  });

  it("pluriels : une seule question, un seul avis", () => {
    expect(getCopy("en").faq.more(1)).toBe("Show the next question");
    expect(getCopy("en").reviews.ratingCount(1)).toBe("1 review");
    expect(getCopy("pt").reviews.ratingCount(3)).toBe("3 opiniões");
  });

  it("pages juridiques en français seulement : signalé dans les autres langues, pas en français", () => {
    expect(COPY_FR.languages.frenchOnly).toBe("");
    for (const locale of ["de", "en", "lb", "pt"] as const) expect(getCopy(locale).languages.frenchOnly, locale).not.toBe("");
  });
});

describe("liens de navigation", () => {
  it("français sans préfixe, autres langues préfixées (ancres de l'accueil comprises)", () => {
    expect(homeLink("fr")).toEqual({ href: "/", label: "Accueil" });
    expect(homeLink("pt")).toEqual({ href: "/pt", label: "Início" });
    expect(navLinks("fr").map((l) => l.href)).toEqual(["/#a-propos", "/#motifs", "/#faq", "/#infos"]);
    expect(navLinks("en").map((l) => l.href)).toEqual(["/en#a-propos", "/en#motifs", "/en#faq", "/en#infos"]);
    expect(navLinks("lb").map((l) => l.label)).toEqual(Object.values(getCopy("lb").nav));
  });
});
