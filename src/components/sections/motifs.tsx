import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { COPY } from "@/content/ui-copy";
import { MOTIF_ICONS, type MotifIconName } from "@/lib/icons";
import type { SiteContent } from "@/lib/content/types";

export function Motifs({ content }: { content: SiteContent }) {
  const { motifs, contact } = content;

  return (
    <Section id="motifs" labelledBy="motifs-title">
      <Eyebrow>{COPY.motifs.eyebrow}</Eyebrow>
      <h2 id="motifs-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
        {COPY.motifs.title(contact.locality)}
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-slate-600">{COPY.motifs.intro(contact.locality)}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {motifs.map((motif) => {
          const Icon = MOTIF_ICONS[motif.icon as MotifIconName];
          return (
            <li key={motif.slug}>
              <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-md motion-reduce:transform-none md:p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-sage-100 text-sage-700">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{motif.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{motif.description}</p>
              </article>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-slate-600">
        {COPY.motifs.helpLine}{" "}
        <a href={`tel:${contact.phoneE164}`} className="font-semibold text-sage-700 underline underline-offset-4">
          {contact.phoneDisplay}
        </a>
      </p>
    </Section>
  );
}
