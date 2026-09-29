import { Car, CalendarDays, Clock, Euro, Languages, MapPin, Navigation, Phone, Receipt } from "lucide-react";
import { BookingInline } from "@/components/booking/booking-inline";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { SiteImage } from "@/components/ui/site-image";
import { COPY } from "@/content/ui-copy";
import { formatOpeningHours } from "@/lib/content/format";
import type { SiteContent } from "@/lib/content/types";
import { googleMapsDirectionsUrl, googleMapsSearchUrl } from "@/lib/maps";

export function PracticalInfo({ content }: { content: SiteContent }) {
  const { contact, consultation, openingHours, access, languages, images, googleBusinessUrl, booking } = content;
  const { labels } = COPY.infos;
  const mapUrl = googleBusinessUrl ?? googleMapsSearchUrl(content);

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

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-5">
            <dt className="text-sage-700">
              <MapPin aria-hidden="true" className="size-5" />
            </dt>
            <dd>
              <p className="font-semibold text-ink">{labels.address}</p>
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
                  href={mapUrl}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-sage-700 underline underline-offset-4"
                >
                  {COPY.infos.map}
                  <span className="sr-only">{COPY.newTab}</span>
                </a>
              </div>
            </dd>

            <dt className="text-sage-700">
              <Phone aria-hidden="true" className="size-5" />
            </dt>
            <dd>
              <p className="font-semibold text-ink">{labels.phone}</p>
              <a href={`tel:${contact.phoneE164}`} className="text-slate-600 hover:text-sage-700">
                {contact.phoneDisplay}
              </a>
            </dd>

            <dt className="text-sage-700">
              <Clock aria-hidden="true" className="size-5" />
            </dt>
            <dd>
              <p className="font-semibold text-ink">{labels.duration}</p>
              <p className="text-slate-600">{consultation.durationLabel}</p>
            </dd>

            {consultation.price && (
              <>
                <dt className="text-sage-700">
                  <Euro aria-hidden="true" className="size-5" />
                </dt>
                <dd>
                  <p className="font-semibold text-ink">{labels.price}</p>
                  <p className="text-slate-600">{consultation.price}</p>
                </dd>
              </>
            )}

            <dt className="text-sage-700">
              <Receipt aria-hidden="true" className="size-5" />
            </dt>
            <dd>
              <p className="font-semibold text-ink">{labels.reimbursement}</p>
              <p className="text-slate-600">{consultation.reimbursement}</p>
            </dd>

            {openingHours && (
              <>
                <dt className="text-sage-700">
                  <CalendarDays aria-hidden="true" className="size-5" />
                </dt>
                <dd>
                  <p className="font-semibold text-ink">{labels.hours}</p>
                  {formatOpeningHours(openingHours).map((line) => (
                    <p key={line} className="text-slate-600">
                      {line}
                    </p>
                  ))}
                </dd>
              </>
            )}

            {access.length > 0 && (
              <>
                <dt className="text-sage-700">
                  <Car aria-hidden="true" className="size-5" />
                </dt>
                <dd>
                  <p className="font-semibold text-ink">{labels.access}</p>
                  {access.map((item) => (
                    <p key={item.kind} className="text-slate-600">
                      <span className="font-medium text-ink">{COPY.infos.accessKinds[item.kind]} : </span>
                      {item.text}
                    </p>
                  ))}
                </dd>
              </>
            )}

            {languages.length > 0 && (
              <>
                <dt className="text-sage-700">
                  <Languages aria-hidden="true" className="size-5" />
                </dt>
                <dd>
                  <p className="font-semibold text-ink">{labels.languages}</p>
                  <p className="text-slate-600">{languages.join(", ")}</p>
                </dd>
              </>
            )}
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
