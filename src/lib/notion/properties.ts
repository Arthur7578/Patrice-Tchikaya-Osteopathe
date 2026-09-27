import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client";

type Properties = PageObjectResponse["properties"];

export function richTextToPlain(items: RichTextItemResponse[]): string {
  return items.map((t) => t.plain_text).join("").trim();
}

/** Texte brut d'une propriété (title, rich_text, url, number, select, email, phone). "" si absente. */
export function getText(props: Properties, name: string): string {
  const p = props[name];
  if (!p) return "";
  switch (p.type) {
    case "title":
      return richTextToPlain(p.title);
    case "rich_text":
      return richTextToPlain(p.rich_text);
    case "url":
      return p.url ?? "";
    case "number":
      return p.number === null ? "" : String(p.number);
    case "select":
      return p.select?.name ?? "";
    case "email":
      return p.email ?? "";
    case "phone_number":
      return p.phone_number ?? "";
    default:
      return "";
  }
}

/** URL portée par un lien dans un texte enrichi (href) ou par une propriété URL. */
export function getUrl(props: Properties, name: string): string | null {
  const p = props[name];
  if (!p) return null;
  if (p.type === "url") return p.url;
  if (p.type === "rich_text" || p.type === "title") {
    const items = p.type === "rich_text" ? p.rich_text : p.title;
    const href = items.find((t) => t.href)?.href;
    const candidate = (href ?? richTextToPlain(items)).trim();
    try {
      return new URL(candidate).toString();
    } catch {
      return null;
    }
  }
  return null;
}

export function getNumber(props: Properties, name: string): number | null {
  const p = props[name];
  return p?.type === "number" ? p.number : null;
}

/** null si la propriété n'existe pas (=> ne pas filtrer). */
export function getCheckbox(props: Properties, name: string): boolean | null {
  const p = props[name];
  return p?.type === "checkbox" ? p.checkbox : null;
}

export function getDateStart(props: Properties, name: string): string | null {
  const p = props[name];
  return p?.type === "date" ? (p.date?.start ?? null) : null;
}
