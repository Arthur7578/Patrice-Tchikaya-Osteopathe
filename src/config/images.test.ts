import { describe, expect, it } from "vitest";
import { IMAGE_REMOTE_PATTERNS, isAllowedImageUrl } from "./images";

describe("isAllowedImageUrl (règle 3 : images Notion par URL, hôtes autorisés seulement)", () => {
  it.each([
    "https://images.unsplash.com/photo-1.jpg",
    "https://res.cloudinary.com/demo/image/upload/x.jpg",
    "https://abc123.public.blob.vercel-storage.com/portrait.jpg",
  ])("accepte %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    ["fichier Notion (URL signée qui expire)", "https://prod-files-secure.s3.us-west-2.amazonaws.com/x.jpg"],
    ["http (non chiffré)", "http://images.unsplash.com/x.jpg"],
    ["hôte qui imite un hôte autorisé", "https://images.unsplash.com.evil.test/x.jpg"],
    ["sous-domaine d'un hôte exact", "https://cdn.images.unsplash.com/x.jpg"],
    ["joker sans le point (suffixe collé)", "https://evilpublic.blob.vercel-storage.com/x.jpg"],
    ["domaine nu du joker", "https://public.blob.vercel-storage.com/x.jpg"],
    ["texte qui n'est pas une URL", "portrait.jpg"],
    ["chaîne vide", ""],
    ["schéma data:", "data:image/png;base64,AAAA"],
  ])("refuse : %s", (_label, url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });

  it("même liste que next.config.ts : https uniquement, tous les chemins", () => {
    for (const pattern of IMAGE_REMOTE_PATTERNS) {
      expect(pattern.protocol).toBe("https");
      expect(pattern.pathname).toBe("/**");
    }
  });
});
