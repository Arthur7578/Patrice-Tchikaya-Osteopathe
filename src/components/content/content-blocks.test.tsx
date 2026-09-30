import { describe, expect, it } from "vitest";
import { COPY } from "@/content/ui-copy";
import type { ContentBlock, RichText } from "@/lib/content/types";
import { expectSiteRules, render } from "@/test/render";
import { ContentBlocks } from "./content-blocks";

const t = (text: string, marks: Omit<RichText, "text"> = {}): RichText => ({ text, ...marks });
const html = (blocks: ContentBlock[]) => render(<>{ContentBlocks({ blocks })}</>);

describe("ContentBlocks : corps des pages motifs", () => {
  it("rend chaque type de bloc avec la bonne balise", () => {
    const root = html([
      { type: "paragraph", text: [t("Un paragraphe.")] },
      { type: "heading", level: 2, text: [t("Titre deux")] },
      { type: "heading", level: 3, text: [t("Titre trois")] },
      { type: "list", ordered: false, items: [[t("puce 1")], [t("puce 2")]] },
      { type: "list", ordered: true, items: [[t("étape 1")], [t("étape 2")], [t("étape 3")]] },
      { type: "quote", text: [t("Une citation")] },
      { type: "callout", text: [t("Un encadré")] },
      { type: "divider" },
    ]);
    expect(root.querySelector("p")?.text).toBe("Un paragraphe.");
    expect(root.querySelector("h2")?.text).toBe("Titre deux");
    expect(root.querySelector("h3")?.text).toBe("Titre trois");
    expect(root.querySelectorAll("ul > li").map((li) => li.text)).toEqual(["puce 1", "puce 2"]);
    expect(root.querySelectorAll("ol > li").map((li) => li.text)).toEqual(["étape 1", "étape 2", "étape 3"]);
    expect(root.querySelector("blockquote")?.text).toBe("Une citation");
    expect(root.querySelector('[role="note"]')?.text).toBe("Un encadré");
    expect(root.querySelectorAll("hr")).toHaveLength(1);
    expect(root.querySelectorAll("h1"), "jamais de <h1> : il appartient à la page (règle 8)").toHaveLength(0);
  });

  it("ancres stables sur les titres, sans accents et dédoublonnées", () => {
    const root = html([
      { type: "heading", level: 2, text: [t("Questions fréquentes")] },
      { type: "heading", level: 3, text: [t("Questions "), t("fréquentes", { bold: true })] },
      { type: "heading", level: 2, text: [t("Questions fréquentes")] },
      { type: "heading", level: 2, text: [t("!!!")] },
    ]);
    expect(root.querySelectorAll("h2, h3").map((h) => h.getAttribute("id") ?? null)).toEqual([
      "questions-frequentes",
      "questions-frequentes-2",
      "questions-frequentes-3",
      null,
    ]);
  });

  it("mise en forme du texte : gras, italique, code, combinables", () => {
    const root = html([
      {
        type: "paragraph",
        text: [t("gras", { bold: true }), t("ital", { italic: true }), t("code", { code: true }), t("tout", { bold: true, italic: true, code: true })],
      },
    ]);
    const p = root.querySelector("p")!;
    expect(p.querySelector("strong")?.text).toBe("gras");
    expect(p.querySelector("em")?.text).toBe("ital");
    expect(p.querySelector("code")?.text).toBe("code");
    expect(p.querySelector("strong > em > code")?.text).toBe("tout");
  });

  it("lien externe : nouvel onglet, rel=noopener, et annonce « nouvel onglet » pour les lecteurs d'écran", () => {
    const a = html([{ type: "paragraph", text: [t("source", { href: "https://www.example.org/etude" })] }]).querySelector("a")!;
    expect(a.getAttribute("href")).toBe("https://www.example.org/etude");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener");
    expect(a.querySelector(".sr-only")?.text.trim()).toBe(COPY.newTab);
  });

  it.each(["/traitement-lumbago", "mailto:cabinet@exemple.lu", "tel:+35251929"])("lien interne ou de contact (%s) : même onglet", (href) => {
    const a = html([{ type: "paragraph", text: [t("lien", { href, bold: true })] }]).querySelector("a")!;
    expect(a.getAttribute("href")).toBe(href);
    expect(a.getAttribute("target")).toBeFalsy();
    expect(a.querySelector(".sr-only")).toBeNull();
    expect(a.querySelector("strong")?.text).toBe("lien");
  });

  it("image : alt Notion (la légende) toujours présent", () => {
    const root = html([{ type: "image", src: "https://exemple.test/photo.jpg", alt: "Salle de consultation" }]);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("Salle de consultation");
    expectSiteRules(root);
  });
});
