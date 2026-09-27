/**
 * Hôtes d'images autorisés. Source unique partagée par next.config.ts (remotePatterns)
 * et par la validation des URLs Notion (une URL hors liste => placeholder, jamais de crash).
 */
export const IMAGE_REMOTE_PATTERNS = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }, // TODO: restreindre à /<cloud_name>/**
  { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
] as const;

export function isAllowedImageUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return IMAGE_REMOTE_PATTERNS.some(({ hostname }) =>
    hostname.startsWith("*.")
      ? url.hostname.endsWith(hostname.slice(1))
      : url.hostname === hostname,
  );
}
