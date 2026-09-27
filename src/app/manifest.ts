import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content/get-site-content";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const c = await getSiteContent();
  return {
    name: `${c.practitioner.name} – ${c.practitioner.title}`,
    short_name: c.practitioner.name,
    start_url: "/",
    display: "browser",
    background_color: "#fdfdfc",
    theme_color: "#2d5a4c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
