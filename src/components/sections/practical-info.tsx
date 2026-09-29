import {
  Accessibility,
  Bus,
  CalendarDays,
  Clock,
  Euro,
  Languages,
  MapPin,
  Navigation,
  Phone,
  Receipt,
  SquareParking,
  TrainFront,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { BookingInline } from "@/components/booking/booking-inline";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { InfoRow } from "@/components/ui/info-row";
import { Section } from "@/components/ui/section";
import { SiteImage } from "@/components/ui/site-image";
import { COPY } from "@/content/ui-copy";
import type { AccessRowId, InfoRowId } from "@/lib/content/rows";
import type { SiteContent } from "@/lib/content/types";
import { googleMapsDirectionsUrl, googleMapsSearchUrl } from "@/lib/maps";

const DL = "grid grid-cols-[auto_1fr] gap-x-4 gap-y-5";

/** Infos pratiques : blocs réordonnables depuis Notion (Infos_Ordre) ; le bloc « Accès » groupe ses lignes (Acces_Ordre). */
export function PracticalInfo({ content }: { content: SiteContent }) {
  const { contact, consultation, payment, openingHoursLines, languages, images, booking, rowOrder } = content;
  const { labels } = COPY.infos;

  // Chaque bloc vaut false/null tant qu'il n'a rien à afficher.
  const blocks: Record<InfoRowId, ReactNode> = {
    acces: (
      <div id="acces">
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-sage-700 uppercase">{COPY.infos.accessTitle}</h3>
        <dl className={DL}>
          {rowOrder.access.map((id) => (
            <Fragment key={id}>{accessRow(id, content)}</Fragment>
          ))}
        </dl>
      </div>
    ),
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
    reglement: (
      <InfoRow icon={Wallet} label={labels.payment}>
        <p className="text-slate-600">{payment.info}</p>
        <Link
          href="/paiement"
          className="mt-1 inline-block text-sm font-semibold text-sage-700 underline underline-offset-4"
        >
          {COPY.infos.paymentLink}
        </Link>
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
          {images.cabinet.src && (
            <div className="mb-6 aspect-[3/2] overflow-hidden rounded-2xl bg-sage-100">
              <SiteImage
                image={images.cabinet}
                sizes="(min-width: 1024px) 45vw, 100vw"
                placeholder={<ImagePlaceholder />}
              />
            </div>
          )}
          <Eyebrow>{COPY.infos.eyebrow}</Eyebrow>
          <h2 id="infos-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
            {COPY.infos.title}
          </h2>
          <div className="mt-8 grid gap-y-5">
            {rowOrder.infos.map((id) => {
              const block = blocks[id];
              if (!block) return null;
              // Le bloc Accès porte déjà son propre <dl> ; chaque autre ligne a le sien (un <dl> ne contient que dt/dd).
              return id === "acces" ? <Fragment key={id}>{block}</Fragment> : <dl key={id} className={DL}>{block}</dl>;
            })}
          </div>
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

/** Une ligne du bloc Accès ; null tant que la valeur Notion est vide ou « [À …] ». */
function accessRow(id: AccessRowId, content: SiteContent): ReactNode {
  const { contact, access, googleBusinessUrl } = content;
  const { labels } = COPY.infos;
  const text = (icon: typeof Bus, label: string, value: string | null) =>
    value && (
      <InfoRow icon={icon} label={label}>
        <p className="text-slate-600">{value}</p>
      </InfoRow>
    );

  switch (id) {
    case "adresse":
      return (
        <InfoRow icon={MapPin} label={labels.address}>
          <address className="not-italic text-slate-600">
            {contact.street}
            <br />
            {contact.postalCode} {contact.locality}
          </address>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
            <a
              href={googleMapsDirectionsUrl(content)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 font-semibold text-sage-700 underline underline-offset-4"
            >
              <Navigation aria-hidden="true" className="size-4" />
              {COPY.infos.directions}
              <span className="sr-only">{COPY.newTab}</span>
            </a>
            <a
              href={googleBusinessUrl ?? googleMapsSearchUrl(content)}
              target="_blank"
              rel="noopener"
              className="font-semibold text-sage-700 underline underline-offset-4"
            >
              {COPY.infos.map}
              <span className="sr-only">{COPY.newTab}</span>
            </a>
          </div>
        </InfoRow>
      );
    case "train":
      return text(TrainFront, labels.train, access.train);
    case "bus":
      return text(Bus, labels.bus, access.bus);
    case "parking":
      return text(SquareParking, labels.parking, access.parking);
    case "pmr":
      return text(Accessibility, labels.accessibility, access.accessibility);
  }
}
