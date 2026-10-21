import type { Metadata } from "next";
import { BackToHome } from "@/components/layout/back-to-home";
import { localeAlternates } from "@/config/i18n";
import { getCopy, LEGAL_PLACEHOLDERS } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { routeLocale } from "@/lib/i18n/route-locale";

const VERCEL_LEGAL_URL = "https://vercel.com/legal";

export async function generateMetadata({ params }: PageProps<"/[locale]/mentions-legales">): Promise<Metadata> {
  const c = await getSiteContent(await routeLocale(params));
  const { legalNotice } = getCopy(c.locale);
  return {
    title: legalNotice.title,
    description: legalNotice.metaDescription(c.practitioner.name, c.practitioner.title, c.contact.locality),
    alternates: localeAlternates(c.locale, "/mentions-legales"),
  };
}

/** Mentions légales, traduites avec le code (ui-copy*.ts) ; la version française fait foi (mention dans les autres langues). */
export default async function MentionsLegalesPage({ params }: PageProps<"/[locale]/mentions-legales">) {
  const c = await getSiteContent(await routeLocale(params));
  const copy = getCopy(c.locale);
  const t = copy.legalNotice;

  return (
    <main id="contenu">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t.title}</h1>
        {t.translationNote && <p className="mt-4 text-sm text-slate-500">{t.translationNote}</p>}

        <div className="prose-content mt-8 space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="text-xl font-semibold text-ink">{t.publisher}</h2>
            <p className="mt-2">
              {c.practitioner.name} — {c.practitioner.title}
              <br />
              {c.contact.street}, {c.contact.postalCode} {c.contact.locality}, {c.contact.countryName}
              <br />
              {t.phone} {c.contact.phoneDisplay}
              <br />
              {t.email} {c.contact.email ?? LEGAL_PLACEHOLDERS.email}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">{t.regulated}</h2>
            <p className="mt-2">{t.regulatedText(c.practitioner.name)}</p>
            <p className="mt-2">
              {t.authorization} {c.legal.authorizationNumber ?? LEGAL_PLACEHOLDERS.authorization}
              <br />
              {t.education} {c.about.education ?? LEGAL_PLACEHOLDERS.education}
              <br />
              {t.vat} {c.legal.vatStatus ?? LEGAL_PLACEHOLDERS.vat}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">{t.hosting}</h2>
            <p className="mt-2">
              {t.hostingText}{" "}
              <a
                href={VERCEL_LEGAL_URL}
                target="_blank"
                rel="noopener"
                className="font-semibold text-sage-700 underline underline-offset-4"
              >
                {VERCEL_LEGAL_URL.replace(/^https:\/\//, "")}
                <span className="sr-only"> {copy.newTab}</span>
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">{t.credits}</h2>
            <p className="mt-2">
              {t.creditsText(c.practitioner.name)} — {LEGAL_PLACEHOLDERS.photos}.
            </p>
          </section>
        </div>
        <BackToHome locale={c.locale} className="mt-12" />
      </div>
    </main>
  );
}
