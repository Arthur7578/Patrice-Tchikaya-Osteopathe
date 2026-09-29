import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { GoogleMapsAttribution } from "@/components/ui/google-maps-attribution";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { StarRating } from "@/components/ui/star-rating";
import { COPY } from "@/content/ui-copy";
import { formatRating, formatReviewDate } from "@/lib/content/format";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export function Reviews({ content }: { content: SiteContent }) {
  const { reviews, rating, googleBusinessUrl } = content;
  if (reviews.length === 0) return null;

  const canLeaveReview = Boolean(googleBusinessUrl?.startsWith("https://g.page/r/"));

  return (
    <Section id="avis" labelledBy="reviews-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>{COPY.reviews.eyebrow}</Eyebrow>
          <h2 id="reviews-title" className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
            {COPY.reviews.title}
          </h2>
        </div>
        {rating && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-5xl font-extrabold text-ink">{formatRating(rating.value)}</p>
            <div>
              <StarRating value={rating.value} />
              <p className="mt-1 text-sm text-slate-500">
                {rating.count ? `${rating.count} avis` : COPY.reviews.ratingLabel} {COPY.ratingOn}{" "}
                <GoogleMapsAttribution />
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        tabIndex={0}
        aria-label="Avis patients"
        className="mt-10 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {reviews.map((review, i) => (
          <Reveal key={`${review.author}-${review.date}`} delay={i * 0.08} className="w-[85%] shrink-0 snap-start md:w-auto">
            <figure className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8">
              {review.rating !== null && <StarRating value={review.rating} showValue />}
              <blockquote className="mt-4 leading-relaxed text-slate-600">{review.text}</blockquote>
              <figcaption className="mt-4 text-sm text-slate-500">
                <span className="font-semibold text-ink">{review.author}</span>
                {formatReviewDate(review.date) && <> · {formatReviewDate(review.date)}</>}
                {" · "}
                {COPY.reviews.source}
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
            {COPY.reviews.seeAll}
            <ArrowUpRight aria-hidden="true" />
            <span className="sr-only">{COPY.newTab}</span>
          </a>
          {canLeaveReview && (
            <a
              href={`${googleBusinessUrl}/review`}
              target="_blank"
              rel="noopener"
              className="font-semibold text-sage-700 underline underline-offset-4"
            >
              {COPY.reviews.leaveReview}
              <span className="sr-only">{COPY.newTab}</span>
            </a>
          )}
        </div>
      )}
    </Section>
  );
}
