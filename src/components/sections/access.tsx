import { Accessibility, Bus, MapPin, Navigation, SquareParking, TrainFront } from "lucide-react";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { InfoRow } from "@/components/ui/info-row";
import { Section } from "@/components/ui/section";
import { SiteImage } from "@/components/ui/site-image";
import { COPY } from "@/content/ui-copy";
import type { AccessRowId } from "@/lib/content/rows";
import type { SiteContent } from "@/lib/content/types";
import { googleMapsDirectionsUrl, googleMapsSearchUrl } from "@/lib/maps";
import { cn } from "@/lib/utils";

/** Venir au cabinet : adresse, itinéraire, transports, stationnement, PMR. Chaque ligne n'apparaît que si elle est renseignée. */
export function Access({ content }: { content: SiteContent }) {
  const { contact, access, images, googleBusinessUrl, rowOrder } = content;
  const { labels } = COPY.infos;
  const hasPhoto = Boolean(images.cabinet.src);
  const mapUrl = googleBusinessUrl ?? googleMapsSearchUrl(content);

  const text = (value: string | null) => value && <p className="text-slate-600">{value}</p>;
  const rows: Record<AccessRowId, ReactNode> = {
    adresse: (
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
          <a href={mapUrl} target="_blank" rel="noopener" className="font-semibold text-sage-700 underline underline-offset-4">
            {COPY.infos.map}
            <span className="sr-only">{COPY.newTab}</span>
          </a>
        </div>
      </InfoRow>
    ),
    train: access.train && (
      <InfoRow icon={TrainFront} label={labels.train}>
        {text(access.train)}
      </InfoRow>
    ),
    bus: access.bus && (
      <InfoRow icon={Bus} label={labels.bus}>
        {text(access.bus)}
      </InfoRow>
    ),
    parking: access.parking && (
      <InfoRow icon={SquareParking} label={labels.parking}>
        {text(access.parking)}
      </InfoRow>
    ),
    pmr: access.accessibility && (
      <InfoRow icon={Accessibility} label={labels.accessibility}>
        {text(access.accessibility)}
      </InfoRow>
    ),
  };

  return (
    <Section id="acces" labelledBy="acces-title" className="bg-sage-50/60">
      <div className={cn("grid gap-8 lg:items-start", hasPhoto && "lg:grid-cols-2")}>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8">
          <Eyebrow>{COPY.access.eyebrow}</Eyebrow>
          <h2 id="acces-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
            {COPY.access.title(contact.locality)}
          </h2>
          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-5">
            {rowOrder.access.map((id) => (
              <Fragment key={id}>{rows[id]}</Fragment>
            ))}
          </dl>
        </div>
        {hasPhoto && (
          <div className="aspect-[3/2] overflow-hidden rounded-2xl bg-sage-100">
            <SiteImage
              image={images.cabinet}
              sizes="(min-width: 1024px) 45vw, 100vw"
              placeholder={<ImagePlaceholder />}
            />
          </div>
        )}
      </div>
    </Section>
  );
}
