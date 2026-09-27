import { CalendarDays, CircleCheck, Clock, Phone, Star } from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SiteImage } from "@/components/ui/site-image";
import { buttonVariants } from "@/components/ui/button";
import { COPY } from "@/content/ui-copy";
import { formatRating } from "@/lib/content/format";
import type { SiteContent } from "@/lib/content/types";

export function Hero({ content }: { content: SiteContent }) {
  const { seo, contact, consultation, booking, rating, images } = content;
  const heroImage = images.hero.src ? images.hero : images.portrait;

  return (
    <section aria-labelledby="hero-title" className="pt-10 pb-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <a
            href="#avis"
            className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-sm font-medium text-sage-800"
          >
            {rating && (
              <>
                <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
                {formatRating(rating.value)}/5 {COPY.hero.ratingSuffix}
                <span aria-hidden="true">•</span>
              </>
            )}
            Cabinet à {contact.locality}
          </a>

          <h1
            id="hero-title"
            className="mt-4 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl"
          >
            {seo.h1}
          </h1>
          <p className="mt-5 text-lg text-pretty text-slate-600">{seo.heroSubtitle}</p>

          <div id="hero-cta" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={booking.url} className={buttonVariants({ size: "lg" })}>
              <CalendarDays aria-hidden="true" />
              {COPY.cta.book}
            </a>
            <a href={`tel:${contact.phoneE164}`} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Phone aria-hidden="true" />
              Appeler le {contact.phoneDisplay}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-1.5">
              <CircleCheck aria-hidden="true" className="size-4 text-sage-700" />
              {COPY.hero.reassurance[0]}
            </li>
            <li className="flex items-center gap-1.5">
              <CircleCheck aria-hidden="true" className="size-4 text-sage-700" />
              Séance de {consultation.durationLabel}
            </li>
            <li className="flex items-center gap-1.5">
              <CircleCheck aria-hidden="true" className="size-4 text-sage-700" />
              {COPY.hero.reassurance[1]}
            </li>
          </ul>
        </div>

        <div className="relative lg:col-span-5">
          <div className="absolute -inset-3 -z-10 rotate-2 rounded-[2rem] bg-sage-100" aria-hidden="true" />
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
                <p className="text-sm font-semibold text-ink">Consultation {consultation.durationMinutes} min</p>
                <p className="text-xs text-slate-500">{COPY.hero.cardSubtitle}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
