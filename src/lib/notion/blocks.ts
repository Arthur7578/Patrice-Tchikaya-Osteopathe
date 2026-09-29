import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client";
import { isAllowedImageUrl } from "@/config/images";
import { SITE_URL } from "@/config/site";
import type { ContentBlock, RichText } from "@/lib/content/types";

type Warn = (message: string) => void;

const NOTION_HOST = /(^|\.)notion\.(so|site|com)$/;
const siteHost = new URL(SITE_URL).hostname.replace(/^www\./, "");

/**
 * Lien publiable : http(s) externe, mailto:, tel:, ou lien vers le site lui-même (rendu relatif).
 * Jamais une page Notion (espace privé ; Notion renvoie aussi des liens relatifs « /id-de-page »)
 * ni un protocole exécutable (javascript:, data:…).
 */
export function safeHref(href: string | null, warn: Warn): string | undefined {
  if (!href) return undefined;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    warn(`lien vers une page Notion retiré (${href}) : le site public n'y a pas accès`);
    return undefined;
  }
  if (url.protocol === "mailto:" || url.protocol === "tel:") return url.href;
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    warn(`lien retiré (protocole non autorisé) : ${href}`);
    return undefined;
  }
  if (NOTION_HOST.test(url.hostname)) {
    warn(`lien vers une page Notion retiré (${href}) : le site public n'y a pas accès`);
    return undefined;
  }
  if (url.hostname.replace(/^www\./, "") === siteHost) return `${url.pathname}${url.search}${url.hash}`;
  return url.href;
}

/** Texte enrichi Notion → segments (gras, italique, code, liens) ; couleurs et soulignés ignorés. */
export function toRichText(items: RichTextItemResponse[], warn: Warn): RichText[] {
  const segments: RichText[] = [];
  for (const item of items) {
    if (!item.plain_text) continue;
    const segment: RichText = { text: item.plain_text };
    if (item.annotations.bold) segment.bold = true;
    if (item.annotations.italic) segment.italic = true;
    if (item.annotations.code) segment.code = true;
    const href = safeHref(item.href, warn);
    if (href) segment.href = href;
    segments.push(segment);
  }
  return segments;
}

const isBlank = (text: RichText[]) => text.every((t) => t.text.trim() === "");

/**
 * Blocs Notion (un seul niveau) → blocs du site. Sous-ensemble prévu au plan (§14, phase 9) :
 * paragraphes, titres 2 et 3, listes, citations, encadrés, séparateurs, images externes.
 * Tout le reste est ignoré avec un avertissement (visible dans `npm run notion:check`).
 */
export function normalizeNotionBlocks(blocks: BlockObjectResponse[]): { blocks: ContentBlock[]; warnings: string[] } {
  const out: ContentBlock[] = [];
  const warnings: string[] = [];
  const warn: Warn = (message) => {
    if (!warnings.includes(message)) warnings.push(message);
  };
  const pushText = (type: "paragraph" | "quote" | "callout", items: RichTextItemResponse[]) => {
    const text = toRichText(items, warn);
    if (!isBlank(text)) out.push({ type, text });
  };
  const pushHeading = (level: 2 | 3, items: RichTextItemResponse[]) => {
    const text = toRichText(items, warn);
    if (!isBlank(text)) out.push({ type: "heading", level, text });
  };
  const pushListItem = (ordered: boolean, items: RichTextItemResponse[]) => {
    const item = toRichText(items, warn);
    if (isBlank(item)) return;
    const last = out.at(-1);
    if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
    else out.push({ type: "list", ordered, items: [item] });
  };

  for (const block of blocks) {
    if (block.in_trash) continue;
    if (block.has_children) warn(`contenu imbriqué dans un bloc « ${block.type} » ignoré (un seul niveau est affiché)`);
    switch (block.type) {
      case "paragraph":
        pushText("paragraph", block.paragraph.rich_text);
        break;
      case "heading_1":
        warn("titre 1 affiché comme titre 2 (la page a déjà son titre principal)");
        pushHeading(2, block.heading_1.rich_text);
        break;
      case "heading_2":
        pushHeading(2, block.heading_2.rich_text);
        break;
      case "heading_3":
        pushHeading(3, block.heading_3.rich_text);
        break;
      case "heading_4":
        warn("titre 4 affiché comme titre 3");
        pushHeading(3, block.heading_4.rich_text);
        break;
      case "bulleted_list_item":
        pushListItem(false, block.bulleted_list_item.rich_text);
        break;
      case "numbered_list_item":
        pushListItem(true, block.numbered_list_item.rich_text);
        break;
      case "quote":
        pushText("quote", block.quote.rich_text);
        break;
      case "callout":
        pushText("callout", block.callout.rich_text);
        break;
      case "divider":
        out.push({ type: "divider" });
        break;
      case "image": {
        const image = block.image;
        const alt = image.caption.map((t) => t.plain_text).join("").trim();
        if (image.type !== "external") {
          warn("image téléversée dans Notion ignorée (lien temporaire) : utiliser une image hébergée à l'extérieur");
        } else if (!isAllowedImageUrl(image.external.url)) {
          warn(`image ignorée : hôte non autorisé (${image.external.url}) — voir src/config/images.ts`);
        } else if (!alt) {
          warn("image sans légende ignorée : la légende sert de texte alternatif");
        } else {
          out.push({ type: "image", src: image.external.url, alt });
        }
        break;
      }
      default:
        warn(`bloc « ${block.type} » non pris en charge : ignoré`);
    }
  }
  return { blocks: out, warnings };
}
