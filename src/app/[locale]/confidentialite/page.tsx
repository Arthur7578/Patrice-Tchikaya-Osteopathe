import type { Metadata } from "next";
import { BackToHome } from "@/components/layout/back-to-home";
import { localeAlternates } from "@/config/i18n";
import { getCopy } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { routeLocale } from "@/lib/i18n/route-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/confidentialite">): Promise<Metadata> {
  const c = await getSiteContent(await routeLocale(params));
  const { privacy } = getCopy(c.locale);
  return {
    title: privacy.title,
    description: privacy.metaDescription(c.practitioner.name, c.practitioner.title, c.contact.locality),
    alternates: localeAlternates(c.locale, "/confidentialite"),
  };
}

/** Politique de confidentialité, traduite avec le code (ui-copy*.ts) ; la version française fait foi. */
export default async function ConfidentialitePage({ params }: PageProps<"/[locale]/confidentialite">) {
  const c = await getSiteContent(await routeLocale(params));
  const copy = getCopy(c.locale);
  const t = copy.privacy;
  const gtmEnabled = /^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID ?? "");
  // Hôte du prestataire de RDV (ex. www.doctena.lu), nommé quand ses pages sont ouvertes par un simple lien.
  const bookingHost = new URL(c.booking.url).hostname;

  return (
    <main id="contenu">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t.title}</h1>
        {copy.legalNotice.translationNote && <p className="mt-4 text-sm text-slate-500">{copy.legalNotice.translationNote}</p>}

        <div className="mt-8 space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="text-xl font-semibold text-ink">{t.collected}</h2>
            <p className="mt-2">{t.collectedText}</p>
          </section>

          {gtmEnabled && (
            <section id="cookies">
              <h2 className="text-xl font-semibold text-ink">{t.gtm}</h2>
              <p className="mt-2">{t.gtmText}</p>
              <p className="mt-2">{t.gtmChoice}</p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold text-ink">{t.booking}</h2>
            <p className="mt-2">{c.booking.provider === "cal" ? t.bookingText : t.bookingExternalText(bookingHost)}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">{t.audience}</h2>
            <p className="mt-2">{t.audienceText}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">{t.rights}</h2>
            <p className="mt-2">{t.rightsText(c.practitioner.name, c.contact.phoneDisplay)}</p>
            <p className="mt-2">{t.authority}</p>
          </section>
        </div>
        <BackToHome locale={c.locale} className="mt-12" />
      </div>
    </main>
  );
}
