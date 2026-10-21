import Link from "next/link";
import { locale as rootLocale } from "next/root-params";
import { BookingLink } from "@/components/booking/booking-link";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/config/i18n";
import { getCopy } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";

/** 404 dans la langue de la page (la page not-found ne reçoit pas `params` : lecture via next/root-params). */
export default async function NotFound() {
  const value = await rootLocale();
  const content = await getSiteContent(isLocale(value) ? value : DEFAULT_LOCALE);
  const copy = getCopy(content.locale);

  return (
    <main id="contenu">
      <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{copy.notFound.title}</h1>
        <p className="mt-4 text-lg text-slate-600">{copy.notFound.text}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={localePath(content.locale, "/")} className={buttonVariants({ variant: "secondary", size: "lg" })}>
            {copy.backToHome}
          </Link>
          <BookingLink booking={content.booking} className={buttonVariants({ size: "lg" })}>
            {copy.cta.book}
          </BookingLink>
        </div>
      </div>
    </main>
  );
}
