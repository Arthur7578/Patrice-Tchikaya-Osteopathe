import type { RichText } from "@/lib/content/types";

/**
 * Texte enrichi ↔ balisage minimal pour la traduction : une phrase avec un mot en gras se traduit d'un seul tenant
 * (l'ordre des mots change d'une langue à l'autre), puis on retrouve les segments. Les liens sont numérotés :
 * l'URL ne passe jamais par le traducteur, elle ne peut donc pas être modifiée.
 * `<a n="0">…</a>` · `<b>…</b>` · `<i>…</i>` · `<code>…</code>` ; `<`, `>` et `&` du texte sont échappés.
 */
export function richTextToMarkup(segments: RichText[]): { markup: string; hrefs: string[] } {
  const hrefs: string[] = [];
  const markup = segments
    .map((seg) => {
      let out = escape(seg.text);
      if (seg.code) out = `<code>${out}</code>`;
      if (seg.italic) out = `<i>${out}</i>`;
      if (seg.bold) out = `<b>${out}</b>`;
      if (seg.href) {
        hrefs.push(seg.href);
        out = `<a n="${hrefs.length - 1}">${out}</a>`;
      }
      return out;
    })
    .join("");
  return { markup, hrefs };
}

const TAG = /<(\/?)(a|b|i|code)(?: n="(\d+)")?>/g;

/** Inverse de richTextToMarkup ; null si le balisage est invalide (balise non fermée, lien inconnu…). */
export function markupToRichText(markup: string, hrefs: string[]): RichText[] | null {
  const segments: RichText[] = [];
  const open = { a: null as string | null, b: false, i: false, code: false };
  let last = 0;
  const push = (raw: string) => {
    if (!raw) return;
    const seg: RichText = { text: unescape(raw) };
    if (open.b) seg.bold = true;
    if (open.i) seg.italic = true;
    if (open.code) seg.code = true;
    if (open.a !== null) seg.href = open.a;
    const prev = segments.at(-1);
    if (prev && sameFormat(prev, seg)) prev.text += seg.text;
    else segments.push(seg);
  };
  for (const m of markup.matchAll(TAG)) {
    push(markup.slice(last, m.index));
    last = m.index + m[0].length;
    const [, closing, tag, n] = m;
    if (tag === "a") {
      if (closing) {
        if (open.a === null) return null;
        open.a = null;
      } else {
        const href = n === undefined ? undefined : hrefs[Number(n)];
        if (open.a !== null || href === undefined) return null;
        open.a = href;
      }
    } else {
      const key = tag as "b" | "i" | "code";
      if (open[key] === !closing) return null; // ouverture d'une balise déjà ouverte, ou fermeture d'une balise fermée
      open[key] = !closing;
    }
  }
  push(markup.slice(last));
  if (open.a !== null || open.b || open.i || open.code) return null;
  return segments;
}

const sameFormat = (a: RichText, b: RichText) =>
  a.bold === b.bold && a.italic === b.italic && a.code === b.code && a.href === b.href;

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescape = (text: string) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
