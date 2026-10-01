import type { BlockObjectResponse } from "@notionhq/client";
import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/config/site";
import { normalizeNotionBlocks, safeHref } from "./blocks";

type Annotations = { bold?: boolean; italic?: boolean; code?: boolean };

/** Segment de texte enrichi Notion, réduit à ce que lit le code. */
function rt(text: string, { href = null, ...a }: Annotations & { href?: string | null } = {}) {
  return {
    type: "text",
    plain_text: text,
    href,
    annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default", ...a },
  };
}

let seq = 0;
function block(type: string, payload: unknown, extra: Partial<{ has_children: boolean; in_trash: boolean }> = {}) {
  return { object: "block", id: `b${++seq}`, type, has_children: false, in_trash: false, ...extra, [type]: payload };
}
const text = (type: string, s: string, extra?: Partial<{ has_children: boolean }>) =>
  block(type, { rich_text: [rt(s)], color: "default" }, extra);
const run = (blocks: unknown[]) => normalizeNotionBlocks(blocks as BlockObjectResponse[]);

describe("normalizeNotionBlocks", () => {
  it("regroupe les éléments de liste consécutifs et sépare puces et numéros", () => {
    const { blocks, warnings } = run([
      text("bulleted_list_item", "a"),
      text("bulleted_list_item", "b"),
      text("numbered_list_item", "un"),
      text("numbered_list_item", "deux"),
      text("paragraph", "fin"),
      text("bulleted_list_item", "c"),
    ]);
    expect(blocks).toEqual([
      { type: "list", ordered: false, items: [[{ text: "a" }], [{ text: "b" }]] },
      { type: "list", ordered: true, items: [[{ text: "un" }], [{ text: "deux" }]] },
      { type: "paragraph", text: [{ text: "fin" }] },
      { type: "list", ordered: false, items: [[{ text: "c" }]] },
    ]);
    expect(warnings).toEqual([]);
  });

  it("conserve gras, italique, code et liens ; ignore couleurs et soulignés", () => {
    const { blocks } = run([
      block("paragraph", {
        color: "red",
        rich_text: [rt("gras", { bold: true }), rt(" et "), rt("lien", { href: "https://exemple.test/a", italic: true }), rt("x", { code: true })],
      }),
    ]);
    expect(blocks).toEqual([
      {
        type: "paragraph",
        text: [{ text: "gras", bold: true }, { text: " et " }, { text: "lien", italic: true, href: "https://exemple.test/a" }, { text: "x", code: true }],
      },
    ]);
  });

  it("titres : 2 et 3 tels quels, 1 → 2 et 4 → 3 avec avertissement", () => {
    const { blocks, warnings } = run([
      text("heading_1", "H1"),
      text("heading_2", "H2"),
      text("heading_3", "H3"),
      text("heading_4", "H4"),
    ]);
    expect(blocks.map((b) => (b.type === "heading" ? b.level : null))).toEqual([2, 2, 3, 3]);
    expect(warnings).toHaveLength(2);
  });

  it("citation, encadré, séparateur ; paragraphes vides et blocs à la corbeille ignorés", () => {
    const { blocks } = run([
      text("quote", "citation"),
      block("callout", { rich_text: [rt("encadré")], color: "default", icon: null }),
      block("divider", {}),
      text("paragraph", "   "),
      block("paragraph", { rich_text: [], color: "default" }),
      { ...text("paragraph", "supprimé"), in_trash: true },
    ]);
    expect(blocks).toEqual([
      { type: "quote", text: [{ text: "citation" }] },
      { type: "callout", text: [{ text: "encadré" }] },
      { type: "divider" },
    ]);
  });

  it("ignore les blocs non pris en charge et le contenu imbriqué, avec un avertissement dédoublonné", () => {
    const { blocks, warnings } = run([
      text("toggle", "bascule", { has_children: true }),
      text("to_do", "tâche"),
      text("to_do", "tâche 2"),
      text("bulleted_list_item", "parent", { has_children: true }),
    ]);
    expect(blocks).toEqual([{ type: "list", ordered: false, items: [[{ text: "parent" }]] }]);
    expect(warnings).toEqual([
      "contenu imbriqué dans un bloc « toggle » ignoré (un seul niveau est affiché)",
      "bloc « toggle » non pris en charge : ignoré",
      "bloc « to_do » non pris en charge : ignoré",
      "contenu imbriqué dans un bloc « bulleted_list_item » ignoré (un seul niveau est affiché)",
    ]);
  });

  it("images : externe autorisée avec légende = alt ; sinon ignorée avec avertissement", () => {
    const image = (img: object) => block("image", { caption: [], ...img });
    const { blocks, warnings } = run([
      image({ type: "external", external: { url: "https://images.unsplash.com/p.jpg" }, caption: [rt("Salle de soin")] }),
      image({ type: "file", file: { url: "https://s3.test/x.jpg", expiry_time: "" }, caption: [rt("Téléversée")] }),
      image({ type: "external", external: { url: "https://pirate.test/x.jpg" }, caption: [rt("Hôte inconnu")] }),
      image({ type: "external", external: { url: "https://images.unsplash.com/q.jpg" } }),
    ]);
    expect(blocks).toEqual([{ type: "image", src: "https://images.unsplash.com/p.jpg", alt: "Salle de soin" }]);
    expect(warnings).toHaveLength(3);
  });
});

describe("safeHref", () => {
  const warnings: string[] = [];
  const warn = (m: string) => warnings.push(m);

  it("garde http(s), mailto et tel ; rend relatifs les liens vers le site", () => {
    expect(safeHref("https://exemple.test/a?b=1#c", warn)).toBe("https://exemple.test/a?b=1#c");
    expect(safeHref("mailto:cabinet@exemple.test", warn)).toBe("mailto:cabinet@exemple.test");
    expect(safeHref("tel:+352519292", warn)).toBe("tel:+352519292");
    expect(safeHref(`${SITE_URL}/tms-ergonomie-bureau#canal`, warn)).toBe("/tms-ergonomie-bureau#canal");
    expect(warnings).toEqual([]);
  });

  it("retire les liens Notion (absolus ou relatifs) et les protocoles exécutables", () => {
    expect(safeHref("https://www.notion.so/abc123", warn)).toBeUndefined();
    expect(safeHref("/3e84bf3fc72880e581b0ed699e9db9eb", warn)).toBeUndefined();
    expect(safeHref("javascript:alert(1)", warn)).toBeUndefined();
    expect(safeHref(null, warn)).toBeUndefined();
    expect(warnings).toHaveLength(3);
    expect(warnings[1]).toBe(
      "lien vers une page Notion retiré (/3e84bf3fc72880e581b0ed699e9db9eb) : le site public n'y a pas accès",
    );
  });
});

describe("safeHref : cas limites", () => {
  const collect = () => {
    const warnings: string[] = [];
    return { warnings, warn: (m: string) => warnings.push(m) };
  };

  it("tout hôte Notion est retiré (domaine nu ou sous-domaine, .so/.site/.com), avec un avertissement explicite", () => {
    const { warnings, warn } = collect();
    for (const href of ["https://notion.so/abc", "https://patrice.notion.site/page", "https://www.notion.com/x"]) {
      expect(safeHref(href, warn), href).toBeUndefined();
    }
    expect(warnings[0]).toBe("lien vers une page Notion retiré (https://notion.so/abc) : le site public n'y a pas accès");
  });

  it("hôtes qui ressemblent à Notion sans l'être : gardés", () => {
    const { warnings, warn } = collect();
    expect(safeHref("https://mynotion.so/x", warn)).toBe("https://mynotion.so/x");
    expect(safeHref("https://notion.so.exemple.test/x", warn)).toBe("https://notion.so.exemple.test/x");
    expect(warnings).toEqual([]);
  });

  it("protocoles : http accepté, ftp et data refusés avec un avertissement qui cite le lien", () => {
    const { warnings, warn } = collect();
    expect(safeHref("http://exemple.test/", warn)).toBe("http://exemple.test/");
    expect(safeHref("ftp://exemple.test/f", warn)).toBeUndefined();
    expect(safeHref("data:text/html,x", warn)).toBeUndefined();
    expect(warnings).toEqual(["lien retiré (protocole non autorisé) : ftp://exemple.test/f", "lien retiré (protocole non autorisé) : data:text/html,x"]);
  });

  it("liens vers le site : « www. » ignoré, chemin + paramètres + ancre gardés ; un autre sous-domaine reste absolu", () => {
    const { warn } = collect();
    const host = new URL(SITE_URL).hostname.replace(/^www\./, "");
    expect(safeHref(`https://www.${host}/paiement?x=1#aide`, warn)).toBe("/paiement?x=1#aide");
    expect(safeHref(`https://blog.${host}/article`, warn)).toBe(`https://blog.${host}/article`);
  });

  it("chaîne vide : aucun lien, aucun avertissement", () => {
    const { warnings, warn } = collect();
    expect(safeHref("", warn)).toBeUndefined();
    expect(warnings).toEqual([]);
  });
});

describe("normalizeNotionBlocks : cas limites", () => {
  it("segments de texte vides ignorés ; blocs vides (titre, citation, élément de liste) ignorés", () => {
    const { blocks } = run([
      block("paragraph", { rich_text: [rt(""), rt("Texte")], color: "default" }),
      text("heading_2", "   "),
      text("quote", ""),
      text("bulleted_list_item", "  "),
      text("bulleted_list_item", "Élément"),
    ]);
    expect(blocks).toEqual([
      { type: "paragraph", text: [{ text: "Texte" }] },
      { type: "list", ordered: false, items: [[{ text: "Élément" }]] },
    ]);
  });

  it("listes : puces puis numéros = deux listes ; un paragraphe entre deux listes les sépare", () => {
    const { blocks } = run([
      text("bulleted_list_item", "a"),
      text("numbered_list_item", "1"),
      text("numbered_list_item", "2"),
      text("paragraph", "entre"),
      text("numbered_list_item", "3"),
    ]);
    expect(blocks.map((b) => (b.type === "list" ? `${b.ordered ? "ol" : "ul"}×${b.items.length}` : b.type))).toEqual([
      "ul×1",
      "ol×2",
      "paragraph",
      "ol×1",
    ]);
  });

  it("avertissements précis et dédoublonnés (contenu imbriqué, titres 1 et 4, bloc inconnu)", () => {
    const { warnings } = run([
      text("paragraph", "a", { has_children: true }),
      text("paragraph", "b", { has_children: true }),
      text("heading_1", "Titre 1"),
      text("heading_4", "Titre 4"),
      block("table", { table_width: 2 }),
    ]);
    expect(warnings).toEqual([
      "contenu imbriqué dans un bloc « paragraph » ignoré (un seul niveau est affiché)",
      "titre 1 affiché comme titre 2 (la page a déjà son titre principal)",
      "titre 4 affiché comme titre 3",
      "bloc « table » non pris en charge : ignoré",
    ]);
  });

  it("images : légende en plusieurs morceaux (une partie en gras) = un seul texte alternatif", () => {
    const { blocks } = run([
      block("image", {
        type: "external",
        external: { url: "https://images.unsplash.com/p.jpg" },
        caption: [rt("Salle de soin "), rt("lumineuse", { bold: true })],
      }),
    ]);
    expect(blocks).toEqual([{ type: "image", src: "https://images.unsplash.com/p.jpg", alt: "Salle de soin lumineuse" }]);
  });

  it("images : messages d'avertissement précis ; légende rognée", () => {
    const image = (img: object) => block("image", { caption: [], ...img });
    const { blocks, warnings } = run([
      image({ type: "external", external: { url: "https://images.unsplash.com/p.jpg" }, caption: [rt("  Salle  ")] }),
      image({ type: "file", file: { url: "https://s3.test/x.jpg", expiry_time: "" } }),
      image({ type: "external", external: { url: "https://pirate.test/x.jpg" }, caption: [rt("x")] }),
      image({ type: "external", external: { url: "https://images.unsplash.com/q.jpg" }, caption: [rt("   ")] }),
    ]);
    expect(blocks).toEqual([{ type: "image", src: "https://images.unsplash.com/p.jpg", alt: "Salle" }]);
    expect(warnings).toEqual([
      "image téléversée dans Notion ignorée (lien temporaire) : utiliser une image hébergée à l'extérieur",
      "image ignorée : hôte non autorisé (https://pirate.test/x.jpg) — voir src/config/images.ts",
      "image sans légende ignorée : la légende sert de texte alternatif",
    ]);
  });
});
