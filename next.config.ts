import type { NextConfig } from "next";
import { IMAGE_REMOTE_PATTERNS } from "./src/config/images";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Build : un seul processus de génération des pages. Par défaut, Next en lance « CPU − 1 » ; sur une machine Vercel à
  // 4 CPU, 3 processus lisaient Notion en même temps (« rate_limited », pages relancées, build en échec le 03/11).
  // Avec 1 processus (machine à 2 CPU, build du 24/10), les 76 pages se génèrent en ~7 s. Voir DECISIONS 03/11.
  experimental: { cpus: 1 },
  // Notion demande d'attendre ~1 min après un « rate_limited » : à 60 s (défaut), la page était tuée et relancée
  // pendant cette attente au lieu de finir.
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: IMAGE_REMOTE_PATTERNS.map((p) => ({ ...p })),
    formats: ["image/avif", "image/webp"],
    qualities: [75], // obligatoire depuis Next 16
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
