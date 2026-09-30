import AxeBuilder from "@axe-core/playwright";
import type { APIRequestContext, Page, Request } from "@playwright/test";

/** Critères WCAG vérifiés par axe (niveaux A et AA, jusqu'à WCAG 2.2). */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function axeViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const isExternal = (url: string, baseURL: string) =>
  /^https?:/.test(url) && new URL(url).origin !== new URL(baseURL).origin;

/** Enregistre toutes les requêtes du navigateur vers un autre hôte que le site (règle 5). */
export function recordExternalRequests(page: Page, baseURL: string): string[] {
  const external: string[] = [];
  page.on("request", (request: Request) => {
    if (isExternal(request.url(), baseURL)) external.push(request.url());
  });
  return external;
}

/**
 * Coupe tout accès réseau hors du site (Cal.com, Google…) : les tests ne dépendent d'aucun service externe
 * et simulent un bloqueur de contenu. Les requêtes restent visibles (événement « request ») avant d'être annulées.
 */
export async function blockExternal(page: Page, baseURL: string) {
  await page.route(
    (url) => isExternal(url.toString(), baseURL),
    (route) => route.abort("blockedbyclient"),
  );
}

/** Chemins de toutes les URL du sitemap (le sitemap contient des URL absolues de production). */
export async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
}

/** CTA de prise de rendez-vous : tout lien dont le texte parle de rendez-vous (hors ancres internes). */
export const bookingCtas = (page: Page) =>
  page.locator('a:not([href^="#"]):not([href^="/"])').filter({ hasText: /rendez-vous|RDV|agenda/i });
