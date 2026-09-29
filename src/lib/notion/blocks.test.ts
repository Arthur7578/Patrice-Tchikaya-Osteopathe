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
  });
});
