import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { JsonLd } from "@/components/seo/json-ld";
import { ENABLED_LOCALES, LOCALE_META } from "@/config/i18n";
import { ALLOW_INDEXING, SITE_URL } from "@/config/site";
import { getCopy } from "@/content/ui-copy";
import { jakarta } from "@/app/fonts";
import { getSiteContent } from "@/lib/content/get-site-content";
import { routeLocale } from "@/lib/i18n/route-locale";
import { buildSiteGraph } from "@/lib/seo/json-ld";
import { homeMeta } from "@/lib/seo/metadata";
import "../globals.css";

/** ISR : régénération au plus toutes les heures (+ /api/revalidate pour publier tout de suite). */
export const revalidate = 3600;

/**
 * Une page par langue publiée. Pas de `dynamicParams = false` ici : il s'appliquerait aussi aux pages motifs
 * (app/[locale]/[slug]) et une adresse inconnue tomberait sur la 404 globale. Une langue inconnue n'arrive jamais
 * jusqu'ici (le proxy réécrit toute adresse sans préfixe de langue vers /fr) et routeLocale renvoie une 404.
 */
export function generateStaticParams() {
  return ENABLED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const c = await getSiteContent(await routeLocale(params));
  const { title, description } = homeMeta(c);
  const siteName = `${c.practitioner.name} – ${c.practitioner.title}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: getCopy(c.locale).meta.titleTemplate(c.practitioner.name, c.contact.locality) },
    description,
    applicationName: siteName,
    robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", locale: LOCALE_META[c.locale].ogLocale, siteName },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false }, // numéros gérés via liens tel: explicites
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#2d5a4c", colorScheme: "light", viewportFit: "cover" };

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const c = await getSiteContent(await routeLocale(params));
  return (
    <html lang={LOCALE_META[c.locale].htmlLang} className={jakarta.variable}>
      <head>
        <JsonLd data={buildSiteGraph(c)} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <SkipLink locale={c.locale} />
        <SiteHeader content={c} />
        {children}
        <SiteFooter content={c} />
        <MobileActionBar
          booking={c.booking}
          phoneE164={c.contact.phoneE164}
          bookLabel={getCopy(c.locale).cta.bookMobile}
          callLabel={getCopy(c.locale).cta.callCabinet(c.contact.phoneDisplay)}
        />
        <CookieConsent copy={getCopy(c.locale).cookies} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
