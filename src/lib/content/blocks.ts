import type { ContentBlock, MotifPage, RichText } from "./types";

export const richTextToString = (text: RichText[]) => text.map((t) => t.text).join("");

/** Texte lisible d'un bloc (l'alt d'une image n'est pas du texte de la page : non compté). */
export function blockPlainText(block: ContentBlock): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return richTextToString(block.text);
    case "list":
      return block.items.map(richTextToString).join(" ");
    case "image":
    case "divider":
      return "";
  }
}

/** Un mot = lettres ou chiffres, apostrophes et traits d'union internes compris (« l'ostéopathie » = 1). */
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function countWords(blocks: ContentBlock[]): number {
  return blocks.reduce((total, block) => total + (blockPlainText(block).match(WORD)?.length ?? 0), 0);
}

/** « **gras** » : seule mise en forme présente dans les pages motifs à ce jour. */
function parseInline(text: string): RichText[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith("**") && part.endsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part }));
}

/**
 * Convertit le Markdown exporté par Notion (une ligne = un bloc : `##`, `###`, `- `, `1. `, `---`,
 * `**gras**`) en blocs. Sert à l'instantané de secours (fallback.ts) et aux tests ; en production,
 * les blocs viennent de l'API Notion (src/lib/notion/blocks.ts).
 */
export function blocksFromMarkdown(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^(#{2,3}) (.+)$/);
    const item = line.match(/^(?:-|(\d+)\.) (.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length as 2 | 3, text: parseInline(heading[2]) });
    } else if (item) {
      const ordered = item[1] !== undefined;
      const last = blocks.at(-1);
      if (last?.type === "list" && last.ordered === ordered) last.items.push(parseInline(item[2]));
      else blocks.push({ type: "list", ordered, items: [parseInline(item[2])] });
    } else if (line === "---") {
      blocks.push({ type: "divider" });
    } else {
      blocks.push({ type: "paragraph", text: parseInline(line) });
    }
  }
  return blocks;
}

/** Page motif à partir de son Markdown (instantané de secours). */
export function motifPageFromMarkdown(markdown: string, lastEdited: string): MotifPage {
  const blocks = blocksFromMarkdown(markdown);
  return { blocks, wordCount: countWords(blocks), lastEdited };
}
