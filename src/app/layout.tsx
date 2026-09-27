import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { JsonLd } from "@/components/seo/json-ld";
import { ALLOW_INDEXING, SITE_URL } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";
import { buildSiteGraph } from "@/lib/seo/json-ld";
import { homeMeta } from "@/lib/seo/metadata";
import "./globals.css";

/** ISR : régénération au plus toutes les heures (+ /api/revalidate pour publier tout de suite). */
export const revalidate = 3600;

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-jakarta" });

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  const { title, description } = homeMeta(c);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${c.practitioner.name}, ostéopathe à ${c.contact.locality}` },
    description,
    applicationName: `${c.practitioner.name} – ${c.practitioner.title}`,
    robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", locale: "fr_LU", siteName: `${c.practitioner.name} – ${c.practitioner.title}` },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false }, // numéros gérés via liens tel: explicites
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#2d5a4c", colorScheme: "light", viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const c = await getSiteContent();
  return (
    <html lang="fr-LU" className={jakarta.variable}>
      <head>
        <JsonLd data={buildSiteGraph(c)} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <SkipLink />
        <SiteHeader content={c} />
        {children}
        <SiteFooter content={c} />
        <MobileActionBar booking={c.booking} phoneE164={c.contact.phoneE164} phoneDisplay={c.contact.phoneDisplay} />
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
