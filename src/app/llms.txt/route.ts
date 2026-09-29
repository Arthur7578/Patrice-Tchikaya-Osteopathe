import { ALLOW_INDEXING } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";
import { buildLlmsTxt } from "@/lib/seo/llms-txt";

export const revalidate = 3600;

/** /llms.txt : résumé Markdown du site pour les assistants IA, généré depuis Notion. */
export async function GET() {
  // Previews : même politique que robots.txt (rien n'est publié hors production).
  if (!ALLOW_INDEXING) return new Response("Not found", { status: 404 });
  const body = buildLlmsTxt(await getSiteContent());
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
