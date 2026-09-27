import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

/** Publication immédiate après une modif Notion : GET /api/revalidate?secret=… */
async function handle(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ revalidated: false, message: "Secret invalide" }, { status: 401 });
  }
  revalidatePath("/", "layout"); // toutes les pages (layout racine)
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}

export const GET = handle;
export const POST = handle;
