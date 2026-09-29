import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import { COPY } from "@/content/ui-copy";
import { richTextToString } from "@/lib/content/blocks";
import { normalizeSlug } from "@/lib/content/parse";
import type { ContentBlock, RichText } from "@/lib/content/types";

const LINK = "font-semibold text-sage-700 underline underline-offset-4 hover:text-sage-800";

function Inline({ text }: { text: RichText[] }) {
  return text.map((t, i) => {
    let node: ReactNode = t.text;
    if (t.code) node = <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-ink">{node}</code>;
    if (t.italic) node = <em>{node}</em>;
    if (t.bold) node = <strong className="font-semibold text-ink">{node}</strong>;
    if (t.href) {
      node = /^https?:/.test(t.href) ? (
        <a href={t.href} target="_blank" rel="noopener" className={LINK}>
          {node}
          <span className="sr-only"> {COPY.newTab}</span>
        </a>
      ) : (
        <a href={t.href} className={LINK}>
          {node}
        </a>
      );
    }
    return <Fragment key={i}>{node}</Fragment>;
  });
}

/** id d'ancre stable par titre (« Questions fréquentes » → #questions-frequentes), dédoublonné. */
function headingIds(blocks: ContentBlock[]): Map<number, string> {
  const ids = new Map<number, string>();
  const seen = new Map<string, number>();
  blocks.forEach((block, i) => {
    if (block.type !== "heading") return;
    const base = normalizeSlug(richTextToString(block.text));
    if (!base) return;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    ids.set(i, n === 1 ? base : `${base}-${n}`);
  });
  return ids;
}

/** Corps d'une page motif (blocs Notion normalisés). Server Component, 0 Ko de JS. */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const ids = headingIds(blocks);
  return blocks.map((block, i) => {
    switch (block.type) {
      case "paragraph":
        return (
          <p key={i} className="mt-5 leading-relaxed text-pretty">
            <Inline text={block.text} />
          </p>
        );
      case "heading":
        return block.level === 2 ? (
          <h2 key={i} id={ids.get(i)} className="mt-12 text-2xl font-bold tracking-tight text-balance text-ink md:text-3xl">
            <Inline text={block.text} />
          </h2>
        ) : (
          <h3 key={i} id={ids.get(i)} className="mt-8 text-lg font-semibold text-balance text-ink">
            <Inline text={block.text} />
          </h3>
        );
      case "list": {
        const items = block.items.map((item, j) => (
          <li key={j} className="pl-1 leading-relaxed">
            <Inline text={item} />
          </li>
        ));
        return block.ordered ? (
          <ol key={i} className="mt-5 list-decimal space-y-3 pl-6 marker:font-semibold marker:text-sage-700">
            {items}
          </ol>
        ) : (
          <ul key={i} className="mt-5 list-disc space-y-2 pl-6 marker:text-sage-600">
            {items}
          </ul>
        );
      }
      case "quote":
        return (
          <blockquote key={i} className="mt-6 border-l-4 border-sage-300 pl-5 text-lg italic">
            <Inline text={block.text} />
          </blockquote>
        );
      case "callout":
        return (
          <div key={i} role="note" className="mt-6 rounded-2xl bg-sage-50 p-5 leading-relaxed ring-1 ring-sage-100">
            <Inline text={block.text} />
          </div>
        );
      case "divider":
        return <hr key={i} className="my-10 border-slate-200" />;
      case "image":
        return (
          <div key={i} className="relative mt-8 aspect-[3/2] overflow-hidden rounded-2xl bg-sage-100">
            <Image src={block.src} alt={block.alt} fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
          </div>
        );
    }
  });
}
