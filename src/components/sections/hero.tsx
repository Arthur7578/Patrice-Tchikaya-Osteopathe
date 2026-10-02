import { CalendarDays, CircleCheck, Clock, Phone, Star } from "lucide-react";
import { BookingLink } from "@/components/booking/booking-link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { GoogleMapsAttribution } from "@/components/ui/google-maps-attribution";
import { SiteImage } from "@/components/ui/site-image";
import { buttonVariants } from "@/components/ui/button";
import { COPY } from "@/content/ui-copy";
import { formatRating } from "@/lib/content/format";
import type { HeroPointId } from "@/lib/content/rows";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export function Hero({ content }: { content: SiteContent }) {
  const { seo, contact, consultation, booking, rating, images, rowOrder } = content;
  const heroImage = images.hero.src ? images.hero : images.portrait;

  return (
    <section aria-labelledby="hero-title" className="pt-10 pb-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="min-w-0 lg:col-span-7">
          <a
            href="#avis"
            className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-sm font-medium text-sage-800"
          >
            {rating && (
              <>
                <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
                {formatRating(rating.value)}/5 {COPY.ratingOn} <GoogleMapsAttribution />
                <span aria-hidden="true">•</span>
              </>
            )}
            {COPY.hero.location(contact.locality)}
          </a>

          <h1
            id="hero-title"
            className="mt-4 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl"
          >
            {seo.h1}
          </h1>
          <p className="mt-5 text-lg text-pretty text-slate-600">{seo.heroSubtitle}</p>

          <div id="hero-cta" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookingLink booking={booking} className={cn(buttonVariants({ size: "lg" }), "max-sm:whitespace-normal max-sm:text-center")}>
              <CalendarDays aria-hidden="true" />
              {COPY.cta.book}
            </BookingLink>
            <a href={`tel:${contact.phoneE164}`} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Phone aria-hidden="true" />
              {COPY.cta.call(contact.phoneDisplay)}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {rowOrder.hero.map((id) => {
              const text = heroPoint(id, consultation);
              if (!text) return null;
              return (
                <li key={id} className="flex items-center gap-1.5">
                  <CircleCheck aria-hidden="true" className="size-4 text-sage-700" />
                  {text}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative lg:col-span-5">
          <div
            className="absolute inset-0 -z-10 rounded-[2rem] bg-sage-100 sm:-inset-3 sm:rotate-2"
            aria-hidden="true"
          />
          <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-sage-100 lg:aspect-[4/5]">
            <SiteImage
              image={heroImage}
              preload
              sizes="(min-width: 1024px) 40vw, 100vw"
              placeholder={<ImagePlaceholder />}
            />
          </div>
          {consultation.durationMinutes && (
            <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/5 sm:left-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700">
                <Clock aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{COPY.hero.cardTitle(consultation.durationMinutes)}</p>
                <p className="text-xs text-slate-500">{COPY.hero.cardSubtitle}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Texte d'un point du hero ; null = masqué (tarif non renseigné dans Notion). */
function heroPoint(id: HeroPointId, consultation: SiteContent["consultation"]): string | null {
  const { points } = COPY.hero;
  switch (id) {
    case "duree":
      return points.duree(consultation.durationLabel);
    case "tarif":
      return consultation.price;
    default:
      return points[id];
  }
}
