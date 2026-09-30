import { describe, expect, it } from "vitest";
import { MOTIF_PAGES } from "@/config/site";
import { blockPlainText, blocksFromMarkdown, countWords, richTextToString } from "./blocks";
import { FALLBACK_CONTENT } from "./fallback";

describe("countWords", () => {
  it("compte les mots, apostrophes et traits d'union internes compris, sans la ponctuation", () => {
    const blocks = blocksFromMarkdown("L'ostéopathie du sport : c'est 1 week-end ?\n- Deux mots");
    expect(countWords(blocks)).toBe(8);
  });

  it("ne compte ni les séparateurs ni le texte alternatif des images", () => {
    expect(countWords([{ type: "divider" }, { type: "image", src: "https://x.test/a.jpg", alt: "Trois mots ici" }])).toBe(0);
  });
});

describe("blocksFromMarkdown", () => {
  it("reconnaît titres 2/3, listes, gras, séparateur et paragraphes (une ligne = un bloc)", () => {
    const blocks = blocksFromMarkdown(
      [
        "Intro.",
        "## Titre",
        "### Sous-titre",
        "- a",
        "- b",
        "1. **Un** : texte",
        "2. deux",
        "---",
        "**Alerte :**",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      { type: "paragraph", text: [{ text: "Intro." }] },
      { type: "heading", level: 2, text: [{ text: "Titre" }] },
      { type: "heading", level: 3, text: [{ text: "Sous-titre" }] },
      { type: "list", ordered: false, items: [[{ text: "a" }], [{ text: "b" }]] },
      { type: "list", ordered: true, items: [[{ text: "Un", bold: true }, { text: " : texte" }], [{ text: "deux" }]] },
      { type: "divider" },
      { type: "paragraph", text: [{ text: "Alerte :", bold: true }] },
    ]);
  });
});

describe("instantané des pages motifs (fallback.ts)", () => {
  const pages = FALLBACK_CONTENT.motifs.map((m) => ({ slug: m.slug, page: m.page }));

  it("chaque motif a une page publiable (seuil de mots atteint, nombre de mots à jour)", () => {
    for (const { slug, page } of pages) {
      expect(page, slug).not.toBeNull();
      expect(page!.wordCount, slug).toBeGreaterThanOrEqual(MOTIF_PAGES.minWords);
      expect(page!.wordCount, slug).toBe(countWords(page!.blocks));
    }
  });

  it("n'écrit jamais « médecin » ni « Dr », et n'utilise que des titres 2 et 3", () => {
    for (const { slug, page } of pages) {
      const text = page!.blocks.map(blockPlainText).join("\n");
      expect(text, slug).not.toMatch(/médecin|\bDr\b/i);
      for (const b of page!.blocks) if (b.type === "heading") expect([2, 3], slug).toContain(b.level);
    }
  });
});

describe("blocs : texte et mots", () => {
  it("texte d'un bloc : segments collés, éléments de liste séparés par une espace", () => {
    expect(richTextToString([{ text: "Ostéo" }, { text: "pathie", bold: true }])).toBe("Ostéopathie");
    expect(countWords([{ type: "list", ordered: false, items: [[{ text: "un deux" }], [{ text: "trois" }]] }])).toBe(3);
  });

  it("citations et encadrés comptent comme du texte", () => {
    expect(
      countWords([
        { type: "quote", text: [{ text: "une citation" }] },
        { type: "callout", text: [{ text: "un encadré important" }] },
      ]),
    ).toBe(5);
  });
});

describe("blocksFromMarkdown : cas limites", () => {
  it("lignes vides ignorées, espaces autour d'une ligne retirés", () => {
    expect(blocksFromMarkdown("Un.\n\n   \n  ## Titre  ")).toEqual([
      { type: "paragraph", text: [{ text: "Un." }] },
      { type: "heading", level: 2, text: [{ text: "Titre" }] },
    ]);
  });

  it("titre de niveau 4 ou dièses en milieu de ligne : paragraphe", () => {
    expect(blocksFromMarkdown("#### Trop profond")[0]!.type).toBe("paragraph");
    expect(blocksFromMarkdown("Texte ## pas un titre")[0]!.type).toBe("paragraph");
  });

  it("listes : numéros à plusieurs chiffres, tiret en milieu de ligne = paragraphe, liste en première ligne", () => {
    expect(blocksFromMarkdown("10. dixième")).toEqual([{ type: "list", ordered: true, items: [[{ text: "dixième" }]] }]);
    expect(blocksFromMarkdown("Texte - pas une liste")[0]!.type).toBe("paragraph");
    expect(blocksFromMarkdown("- a\n- b")).toEqual([{ type: "list", ordered: false, items: [[{ text: "a" }], [{ text: "b" }]] }]);
  });

  it("une liste qui suit un paragraphe commence une nouvelle liste", () => {
    expect(blocksFromMarkdown("Intro\n- a").map((b) => b.type)).toEqual(["paragraph", "list"]);
  });

  it("gras : seulement entre deux paires d'astérisques", () => {
    expect(blocksFromMarkdown("** pas gras")).toEqual([{ type: "paragraph", text: [{ text: "** pas gras" }] }]);
    expect(blocksFromMarkdown("pas gras **")).toEqual([{ type: "paragraph", text: [{ text: "pas gras **" }] }]);
    expect(blocksFromMarkdown("a **b** c")).toEqual([{ type: "paragraph", text: [{ text: "a " }, { text: "b", bold: true }, { text: " c" }] }]);
  });
});
