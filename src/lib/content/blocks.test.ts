import { describe, expect, it } from "vitest";
import { MOTIF_PAGES } from "@/config/site";
import { blockPlainText, blocksFromMarkdown, countWords } from "./blocks";
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
