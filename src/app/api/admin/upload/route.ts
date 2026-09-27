import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Outil temporaire (voir /admin/photos) : upload une photo vers Vercel Blob et redirige
 * vers la page d'admin avec l'URL publique obtenue, à coller dans la colonne URL de Notion.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const key = form.get("key");
  if (!process.env.ADMIN_UPLOAD_SECRET || key !== process.env.ADMIN_UPLOAD_SECRET) {
    return NextResponse.json({ error: "Secret invalide" }, { status: 401 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Type de fichier non autorisé : ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 8 Mo)" }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  const redirectUrl = new URL("/admin/photos", request.url);
  redirectUrl.searchParams.set("key", String(key));
  redirectUrl.searchParams.set("uploaded", blob.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
