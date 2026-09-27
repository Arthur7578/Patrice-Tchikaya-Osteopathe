import { ChevronDown, Phone } from "lucide-react";
import { BookingLink } from "@/components/booking/booking-link";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { COPY } from "@/content/ui-copy";
import type { FaqItem } from "@/lib/content/types";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * Accordéon natif <details name> : réponses présentes dans le HTML (indexables),
 * 0 Ko de JS, accessible clavier. (Radix Accordion retire du DOM le contenu fermé.)
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {items.map((item, i) => (
        <details key={item.question} name="faq" className="faq-item group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sage-700 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold text-ink">{item.question}</h3>
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-sage-700 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="faq-answer px-6 pb-6 leading-relaxed text-slate-600">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

export function Faq({ content }: { content: SiteContent }) {
  const { faq, contact, booking } = content;
  if (faq.length === 0) return null;

  return (
    <Section id="faq" labelledBy="faq-title">
      <div className="max-w-2xl">
        <Eyebrow>{COPY.faq.eyebrow}</Eyebrow>
        <h2 id="faq-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
          {COPY.faq.title}
        </h2>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FaqList items={faq} />
        </div>
        <div className="lg:sticky lg:top-24 lg:col-span-4">
          <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-slate-200/80 bg-white p-6">
            <div>
              <p className="font-semibold text-ink">{COPY.faq.helpTitle}</p>
              <p className="mt-2 text-sm text-slate-600">{COPY.faq.helpText}</p>
              <a
                href={`tel:${contact.phoneE164}`}
                className="mt-4 flex items-center gap-2 font-semibold text-sage-700 underline underline-offset-4"
              >
                <Phone aria-hidden="true" className="size-4 shrink-0" />
                {contact.phoneDisplay}
              </a>
            </div>
            <BookingLink booking={booking} className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
              {COPY.cta.bookShort}
            </BookingLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
