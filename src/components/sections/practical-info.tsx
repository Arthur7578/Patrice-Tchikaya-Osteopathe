import {
  Accessibility,
  Bus,
  CalendarDays,
  ChevronDown,
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

/** Rubriques toujours visibles (`acces` = la ligne Adresse) ; les autres sont dans des blocs repliables (DECISIONS 2026-10-02). */
const ESSENTIAL_IDS = ["acces", "telephone", "duree", "tarif", "horaires"] as const satisfies readonly InfoRowId[];
type FoldedId = Exclude<InfoRowId, (typeof ESSENTIAL_IDS)[number]> | Exclude<AccessRowId, "adresse">;
const isEssential = (id: InfoRowId) => (ESSENTIAL_IDS as readonly InfoRowId[]).includes(id);

/**
 * Infos pratiques : l'essentiel (adresse, téléphone, durée, tarif, horaires) reste visible ; transports et
 * « bon à savoir » sont repliés dans des <details> (présents dans le HTML, sans JS). Dans chaque groupe, l'ordre
 * suit Notion (Infos_Ordre pour les blocs, Acces_Ordre pour les lignes de transport).
 */
export function PracticalInfo({ content }: { content: SiteContent }) {
  const { contact, consultation, payment, openingHoursLines, languages, images, booking, rowOrder } = content;
  const { labels } = COPY.infos;
  const foldedLabels: Record<FoldedId, string> = {
    train: labels.train,
    bus: labels.bus,
    parking: labels.parking,
    pmr: labels.accessibility,
    reglement: labels.payment,
    remboursement: labels.reimbursement,
    langues: labels.languages,
  };

  // Chaque bloc vaut false/null tant qu'il n'a rien à afficher.
  const blocks: Record<InfoRowId, ReactNode> = {
    acces: accessRow("adresse", content),
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
          <dl className={`mt-8 ${DL}`}>
            {rowOrder.infos.filter(isEssential).map((id) => (
              <Fragment key={id}>{blocks[id]}</Fragment>
            ))}
          </dl>
          <div className="mt-8 divide-y divide-slate-200/80 border-y border-slate-200/80">
            <Folded
              title={COPY.infos.transportTitle}
              rows={rowOrder.access
                .filter((id) => id !== "adresse")
                .map((id) => ({ id, label: foldedLabels[id], node: accessRow(id, content) }))}
            />
            <Folded
              title={COPY.infos.moreTitle}
              rows={rowOrder.infos
                .filter((id) => !isEssential(id))
                .map((id) => ({ id, label: foldedLabels[id as FoldedId], node: blocks[id] }))}
            />
          </div>
        </div>

        <div id="rendez-vous">
          <h3 className="text-lg font-semibold text-ink">{COPY.infos.bookingTitle}</h3>
          <p className="mt-2 text-slate-600">{COPY.infos.bookingText}</p>
          <div className="mt-4">
            <BookingInline booking={booking} />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {COPY.infos.bookingFallbackHint}{" "}
            <a
              href={booking.url}
              target="_blank"
              rel="noopener"
              className="font-medium text-sage-700 underline underline-offset-4"
            >
              {COPY.infos.bookingFallback}
              <span className="sr-only"> {COPY.newTab}</span>
            </a>
          </p>
        </div>
      </div>
    </Section>
  );
}

/**
 * Bloc repliable (<details> natif) : titre, puis en dessous les libellés des lignes renseignées, pour savoir ce qu'il
 * contient sans l'ouvrir. Rien n'est rendu si aucune ligne n'a de valeur (pas de <dl> vide).
 */
function Folded({ title, rows }: { title: string; rows: { id: string; label: string; node: ReactNode }[] }) {
  const filled = rows.filter((row) => row.node);
  if (filled.length === 0) return null;
  return (
    <details className="group py-4">
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-700 [&::-webkit-details-marker]:hidden">
        <h3 className="font-semibold text-ink">{title}</h3>
        <ChevronDown
          aria-hidden="true"
          className="row-span-2 size-5 text-sage-700 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
        />
        <span className="text-sm text-slate-500">{filled.map((row) => row.label).join(" · ")}</span>
      </summary>
      <dl className={`mt-5 ${DL}`}>
        {filled.map((row) => (
          <Fragment key={row.id}>{row.node}</Fragment>
        ))}
      </dl>
    </details>
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
        <InfoRow icon={MapPin} label={labels.address} id="acces">
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
