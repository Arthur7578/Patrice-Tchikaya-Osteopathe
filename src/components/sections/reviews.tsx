import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { GoogleMapsAttribution } from "@/components/ui/google-maps-attribution";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { StarRating } from "@/components/ui/star-rating";
import { getCopy } from "@/content/ui-copy";
import { formatRating, formatReviewDate } from "@/lib/content/format";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export function Reviews({ content }: { content: SiteContent }) {
  const copy = getCopy(content.locale);
  const { reviews, rating, googleBusinessUrl } = content;
  if (reviews.length === 0) return null;

  const canLeaveReview = Boolean(googleBusinessUrl?.startsWith("https://g.page/r/"));

  return (
    <Section id="avis" labelledBy="reviews-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>{copy.reviews.eyebrow}</Eyebrow>
          <h2 id="reviews-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
            {copy.reviews.title}
          </h2>
        </div>
        {rating && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-5xl font-extrabold text-ink">{formatRating(rating.value, content.locale)}</p>
            <div>
              <StarRating locale={content.locale} value={rating.value} />
              <p className="mt-1 text-sm text-slate-500">
                {rating.count ? copy.reviews.ratingCount(rating.count) : copy.reviews.ratingLabel} {copy.ratingOn}{" "}
                <GoogleMapsAttribution />
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        tabIndex={0}
        aria-label={copy.reviews.listLabel}
        className="relative mt-10 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {reviews.map((review, i) => (
          <Reveal key={`${review.author}-${review.date}`} delay={i * 0.08} className="w-[85%] shrink-0 snap-start md:w-auto">
            <figure className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8">
              {review.rating !== null && <StarRating locale={content.locale} value={review.rating} showValue />}
              <blockquote className="mt-4 leading-relaxed text-slate-600">{review.text}</blockquote>
              <figcaption className="mt-4 text-sm text-slate-500">
                <span className="font-semibold text-ink">{review.author}</span>
                {formatReviewDate(review.date, content.locale) && <> · {formatReviewDate(review.date, content.locale)}</>}
                {" · "}
                {copy.reviews.source}
                {review.translated && <> · {copy.reviews.translated}</>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      {googleBusinessUrl && (
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <a
            href={googleBusinessUrl}
            target="_blank"
            rel="noopener"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            {copy.reviews.seeAll}
            <ArrowUpRight aria-hidden="true" />
            <span className="sr-only">{copy.newTab}</span>
          </a>
          {canLeaveReview && (
            <a
              href={`${googleBusinessUrl}/review`}
              target="_blank"
              rel="noopener"
              className="font-semibold text-sage-700 underline underline-offset-4"
            >
              {copy.reviews.leaveReview}
              <span className="sr-only">{copy.newTab}</span>
            </a>
          )}
        </div>
      )}
    </Section>
  );
}
