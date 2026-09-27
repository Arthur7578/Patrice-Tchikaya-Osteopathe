import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content/get-site-content";

export const alt = "Patrice Tchikaya, ostéopathe D.O. à Dudelange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const c = await getSiteContent();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#2d5a4c", color: "#fdfdfc" }}>
        <div style={{ fontSize: 32, opacity: 0.85 }}>{`${c.practitioner.title} • ${c.contact.locality}, Luxembourg`}</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 16 }}>{c.practitioner.name}</div>
        <div style={{ fontSize: 34, marginTop: 24, maxWidth: 900, opacity: 0.9 }}>{`Ostéopathe à ${c.contact.locality} – prise de rendez-vous en ligne`}</div>
      </div>
    ),
    size,
  );
}
