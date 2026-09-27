import Link from "next/link";
import { BookingLink } from "@/components/booking/booking-link";
import { buttonVariants } from "@/components/ui/button";
import { getSiteContent } from "@/lib/content/get-site-content";

export default async function NotFound() {
  const content = await getSiteContent();

  return (
    <main id="contenu">
      <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">Page introuvable</h1>
        <p className="mt-4 text-lg text-slate-600">
          La page que vous cherchez n&apos;existe pas ou plus. Vous pouvez revenir à l&apos;accueil ou prendre
          rendez-vous directement.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Retour à l&apos;accueil
          </Link>
          <BookingLink booking={content.booking} className={buttonVariants({ size: "lg" })}>
            Prendre rendez-vous en ligne
          </BookingLink>
        </div>
      </div>
    </main>
  );
}
