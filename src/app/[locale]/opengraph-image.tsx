import { ImageResponse } from "next/og";
import { ENABLED_LOCALES } from "@/config/i18n";
import { getCopy } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { routeLocale } from "@/lib/i18n/route-locale";

export const alt = "Patrice Tchikaya, ostéopathe D.O. à Dudelange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Une image par langue publiée, générée au build (comme les pages), régénérée avec elles. */
export const revalidate = 3600;
export function generateStaticParams() {
  return ENABLED_LOCALES.map((locale) => ({ locale }));
}

/** Image de partage, dans la langue de la page (/opengraph-image, /en/opengraph-image…). */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const c = await getSiteContent(await routeLocale(params));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#2d5a4c", color: "#fdfdfc" }}>
        <div style={{ fontSize: 32, opacity: 0.85 }}>{`${c.practitioner.title} • ${c.contact.locality}, ${c.contact.countryName}`}</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 16 }}>{c.practitioner.name}</div>
        <div style={{ fontSize: 34, marginTop: 24, maxWidth: 900, opacity: 0.9 }}>{getCopy(c.locale).ogImage.tagline(c.contact.locality)}</div>
      </div>
    ),
    size,
  );
}
