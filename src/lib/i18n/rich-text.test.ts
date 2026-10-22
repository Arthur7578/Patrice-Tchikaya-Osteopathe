import { describe, expect, it } from "vitest";
import type { RichText } from "@/lib/content/types";
import { markupToRichText, richTextToMarkup } from "./rich-text";

describe("texte enrichi ↔ balisage de traduction", () => {
  const segments: RichText[] = [
    { text: "Avant " },
    { text: "gras", bold: true },
    { text: " et " },
    { text: "lien", href: "https://exemple.test/a" },
    { text: " puis " },
    { text: "tout", bold: true, italic: true, code: true, href: "/mal-de-dos" },
    { text: " <fin> & co" },
  ];

  it("aller-retour sans perte (formats, liens, caractères spéciaux)", () => {
    const { markup, hrefs } = richTextToMarkup(segments);
    expect(markup).toBe('Avant <b>gras</b> et <a n="0">lien</a> puis <a n="1"><b><i><code>tout</code></i></b></a> &lt;fin&gt; &amp; co');
    expect(hrefs).toEqual(["https://exemple.test/a", "/mal-de-dos"]);
    expect(markupToRichText(markup, hrefs)).toEqual(segments);
  });

  it("l'URL ne passe pas par le traducteur : le numéro du lien retrouve l'URL d'origine, même déplacé", () => {
    expect(markupToRichText('<a n="1">first</a> then <b>bold</b>', ["https://a.test", "https://b.test"])).toEqual([
      { text: "first", href: "https://b.test" },
      { text: " then " },
      { text: "bold", bold: true },
    ]);
  });

  it("fusionne les segments voisins de même format", () => {
    expect(markupToRichText("<b>a</b><b>b</b>c", [])).toEqual([{ text: "ab", bold: true }, { text: "c" }]);
  });

  it.each([
    ["balise non fermée", "<b>gras"],
    ["fermeture sans ouverture", "texte</i>"],
    ["balise ouverte deux fois", "<b><b>x</b></b>"],
    ["lien inconnu", '<a n="3">x</a>'],
    ["lien sans numéro", "<a>x</a>"],
    ["lien dans un lien", '<a n="0"><a n="0">x</a></a>'],
    ["fermeture de lien en trop", 'x</a>'],
  ])("balisage invalide (%s) : null", (_label, markup) => {
    expect(markupToRichText(markup, ["https://a.test"])).toBeNull();
  });
});
