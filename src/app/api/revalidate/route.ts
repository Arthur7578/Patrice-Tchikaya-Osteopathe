import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { SITE_CONTENT_TAG } from "@/config/site";

/** Publication immédiate après une modif Notion : GET /api/revalidate?secret=… */
async function handle(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ revalidated: false, message: "Secret invalide" }, { status: 401 });
  }
  // Ordre : d'abord le contenu Notion mis en cache (sinon les pages régénérées relisent l'ancienne version),
  // puis toutes les pages (layout racine). `expire: 0` : pas de contenu périmé servi, la prochaine requête relit Notion.
  revalidateTag(SITE_CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}

export const GET = handle;
export const POST = handle;
