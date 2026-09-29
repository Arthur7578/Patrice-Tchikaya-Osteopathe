import { CalendarDays, Clock, Euro, Languages, Phone, Receipt } from "lucide-react";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { BookingInline } from "@/components/booking/booking-inline";
import { Eyebrow } from "@/components/ui/eyebrow";
import { InfoRow } from "@/components/ui/info-row";
import { Section } from "@/components/ui/section";
import { COPY } from "@/content/ui-copy";
import type { InfoRowId } from "@/lib/content/rows";
import type { SiteContent } from "@/lib/content/types";

/** Tarifs, horaires, contact. L'adresse et les transports sont dans la section « Accès » (access.tsx). */
export function PracticalInfo({ content }: { content: SiteContent }) {
  const { contact, consultation, openingHoursLines, languages, booking, rowOrder } = content;
  const { labels } = COPY.infos;

  // Chaque ligne renvoie null tant qu'elle n'a rien à afficher ; l'ordre vient de Notion (Infos_Ordre).
  const rows: Record<InfoRowId, ReactNode> = {
    telephone: (
      <InfoRow icon={Phone} label={labels.phone}>
        <p className="text-slate-500">
          {labels.phoneOffice}{" "}
          <a href={`tel:${contact.phoneE164}`} className="whitespace-nowrap text-slate-600 hover:text-sage-700">
            {contact.phoneDisplay}
          </a>
        </p>
        {contact.mobilePhone && (
          <p className="text-slate-500">
            {labels.phoneMobile}{" "}
            <a
              href={`tel:${contact.mobilePhone.e164}`}
              className="whitespace-nowrap text-slate-600 hover:text-sage-700"
            >
              {contact.mobilePhone.display}
            </a>
          </p>
        )}
      </InfoRow>
    ),
    duree: (
      <InfoRow icon={Clock} label={labels.duration}>
        <p className="text-slate-600">{consultation.durationLabel}</p>
      </InfoRow>
    ),
    tarif: consultation.price && (
      <InfoRow icon={Euro} label={labels.price}>
        <p className="text-slate-600">{consultation.price}</p>
      </InfoRow>
    ),
    remboursement: (
      <InfoRow icon={Receipt} label={labels.reimbursement}>
        <p className="text-slate-600">{consultation.reimbursement}</p>
      </InfoRow>
    ),
    horaires: openingHoursLines.length > 0 && (
      <InfoRow icon={CalendarDays} label={labels.hours}>
        {openingHoursLines.map((line) => (
          <p key={line} className="text-slate-600">
            {line}
          </p>
        ))}
      </InfoRow>
    ),
    langues: languages.length > 0 && (
      <InfoRow icon={Languages} label={labels.languages}>
        <p className="text-slate-600">{languages.join(", ")}</p>
      </InfoRow>
    ),
  };

  return (
    <Section id="infos" labelledBy="infos-title">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8">
          <Eyebrow>{COPY.infos.eyebrow}</Eyebrow>
          <h2 id="infos-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
            {COPY.infos.title}
          </h2>
          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-5">
            {rowOrder.infos.map((id) => (
              <Fragment key={id}>{rows[id]}</Fragment>
            ))}
          </dl>
        </div>

        <div id="rendez-vous">
          <h3 className="text-lg font-semibold text-ink">{COPY.infos.bookingTitle}</h3>
          <p className="mt-2 text-slate-600">{COPY.infos.bookingText}</p>
          <div className="mt-4">
            <BookingInline booking={booking} />
          </div>
          <a
            href={booking.url}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-block font-semibold text-sage-700 underline underline-offset-4"
          >
            {COPY.infos.bookingFallback}
            <span className="sr-only">{COPY.newTab}</span>
          </a>
        </div>
      </div>
    </Section>
  );
}
