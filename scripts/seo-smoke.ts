/**
 * Vérifications SEO/accessibilité de base sur le HTML réellement servi.
 * Usage : npm run build && npm start   puis   npm run seo:smoke [-- http://localhost:3000]
 */
import { parse } from "node-html-parser";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent } from "@/lib/notion/fetch-content";

const base = (process.argv[2] ?? process.env.SMOKE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const failures: string[] = [];
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures.push(label);
};

/** Comme get-site-content.ts, sans "server-only" (interdit hors runtime Next) : ce script tourne via tsx. */
async function loadContent() {
  const token = process.env.NOTION_TOKEN;
  if (!token) return FALLBACK_CONTENT;
  const { content } = await fetchSiteContent(createNotionClient(token));
  return content;
}

async function main() {
  const content = await loadContent();

  const res = await fetch(`${base}/`);
  check(res.status === 200, `GET / → ${res.status}`);
  const html = await res.text();
  const root = parse(html);

  check(root.querySelector("html")?.getAttribute("lang") === "fr-LU", `<html lang="fr-LU">`);
  const h1s = root.querySelectorAll("h1");
  check(h1s.length === 1, `un seul <h1> (trouvé : ${h1s.length})`);
  check(new RegExp(content.contact.locality, "i").test(h1s[0]?.text ?? ""), `le <h1> contient « ${content.contact.locality} »`);

  const title = root.querySelector("title")?.text ?? "";
  check(title.length >= 30 && title.length <= 65, `<title> 30–65 car. (${title.length}) : ${title}`);
  const desc = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  check(desc.length >= 70 && desc.length <= 160, `meta description 70–160 car. (${desc.length})`);
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
  check(/^https:\/\//.test(canonical), `canonical absolue : ${canonical}`);
  check(Boolean(root.querySelector('meta[property="og:image"]')), "og:image présent");

  const imgs = root.querySelectorAll("img");
  check(imgs.every((i) => (i.getAttribute("alt") ?? "").trim().length > 0), `toutes les <img> ont un alt (${imgs.length})`);

  const graphs = root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => JSON.parse(s.textContent) as { "@graph"?: Array<Record<string, unknown>> });
  const types = graphs.flatMap((g) => g["@graph"] ?? []).flatMap((n) => [n["@type"]].flat() as string[]);
  for (const t of ["WebSite", "MedicalBusiness", "Person", "WebPage", "FAQPage"]) check(types.includes(t), `JSON-LD contient ${t}`);
  check(!types.includes("Physician") && !html.includes("AggregateRating"), "pas de Physician ni d'AggregateRating");
  const faq = graphs.flatMap((g) => g["@graph"] ?? []).find((n) => n["@type"] === "FAQPage") as
    | { mainEntity: Array<{ acceptedAnswer: { text: string } }> }
    | undefined;
  const visibleText = root.querySelector("main")?.text ?? "";
  check(Boolean(faq) && faq!.mainEntity.every((q) => visibleText.includes(q.acceptedAnswer.text.slice(0, 40))), "réponses FAQ visibles dans le HTML");

  // Générique et configurable : on vérifie que les CTA pointent vers l'URL de RDV réellement
  // configurée dans Notion (Url_Booking), quel que soit le prestataire (Cal.com, Doctena…).
  const bookingLinks = root.querySelectorAll("a").filter((a) => a.getAttribute("href") === content.booking.url);
  check(bookingLinks.length >= 2, `liens RDV vers ${content.booking.url} présents dans le HTML (${bookingLinks.length})`);
  check(root.querySelectorAll(`a[href^="tel:${content.contact.phoneE164}"]`).length >= 1, `lien tel:${content.contact.phoneE164} présent`);
  const mobile = content.contact.mobilePhone;
  if (mobile) check(root.querySelectorAll(`a[href="tel:${mobile.e164}"]`).length >= 1, `lien tel:${mobile.e164} (mobile) présent`);

  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const r = await fetch(`${base}${path}`);
    check(r.status === 200, `GET ${path} → ${r.status}`);
  }
  const llms = await fetch(`${base}/llms.txt`);
  console.log(`ℹ GET /llms.txt → ${llms.status} (404 attendu hors production)`);
  const robotsMeta =root.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "(absente)";
  console.log(`ℹ meta robots : ${robotsMeta} (noindex attendu hors production)`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} échec(s).`);
    process.exit(1);
  }
  console.log("\nTout est vert.");
}

void main();
