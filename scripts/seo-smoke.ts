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
  // Le lien répond-il chez le prestataire (évènement Cal.com renommé ou supprimé, faute dans Url_Booking) ?
  // Seulement avec SMOKE_CHECK_BOOKING (contrôle quotidien de la production) : la CI ne dépend d'aucun service tiers.
  // 404 ou 410 : échec. Autre réponse inattendue (blocage anti-robots, panne, réseau) : simple avertissement,
  // car elle ne prouve pas que le lien est cassé.
  if (process.env.SMOKE_CHECK_BOOKING) {
    const status = await fetch(content.booking.url, { signal: AbortSignal.timeout(20_000) }).then(
      async (r) => {
        await r.body?.cancel();
        return r.status;
      },
      () => 0,
    );
    const label = `lien RDV ${content.booking.url} chez le prestataire → ${status || "aucune réponse"}`;
    if (status === 404 || status === 410) check(false, label);
    else if (status >= 200 && status < 300) check(true, label);
    else {
      console.log(`⚠ ${label} : à vérifier à la main`);
      if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Lien de rendez-vous::${label} : à vérifier à la main`);
    }
  }
  check(root.querySelectorAll(`a[href^="tel:${content.contact.phoneE164}"]`).length >= 1, `lien tel:${content.contact.phoneE164} présent`);
  const mobile = content.contact.mobilePhone;
  if (mobile) check(root.querySelectorAll(`a[href="tel:${mobile.e164}"]`).length >= 1, `lien tel:${mobile.e164} (mobile) présent`);

  // Page /paiement (guide Wero) : liée depuis l'accueil, un seul <h1>, canonical propre.
  check(root.querySelectorAll('a[href="/paiement"]').length >= 1, "lien vers /paiement présent sur l'accueil");
  const payRes = await fetch(`${base}/paiement`);
  check(payRes.status === 200, `GET /paiement → ${payRes.status}`);
  const payRoot = parse(await payRes.text());
  check(payRoot.querySelectorAll("h1").length === 1, "un seul <h1> sur /paiement");
  const payCanonical = payRoot.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
  check(payCanonical.endsWith("/paiement"), `canonical de /paiement : ${payCanonical}`);

  // Pages motifs (phase 9) : une page par motif publié (Page_Validée + seuil de mots), liée depuis
  // l'accueil et le sitemap, avec ses propres métadonnées et son JSON-LD (MedicalWebPage + fil d'Ariane).
  // Les guides (Pages_Guides : kiné, ordonnance, région frontalière…) suivent les mêmes contrôles, avec
  // une WebPage au lieu d'une MedicalWebPage et sans « à {ville} » imposé dans le <h1>.
  const published = [
    ...content.motifs.filter((m) => m.page).map((entry) => ({ entry, kind: "motif" as const })),
    ...content.guides.filter((g) => g.page).map((entry) => ({ entry, kind: "guide" as const })),
  ];
  console.log(`ℹ pages motifs et guides publiées : ${published.length}`);
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  for (const { entry: m, kind } of published) {
    const path = `/${m.slug}`;
    check(root.querySelectorAll(`a[href="${path}"]`).length >= 1, `accueil : lien vers ${path}`);
    check(sitemap.includes(`${path}</loc>`), `sitemap : ${path}`);
    const r = await fetch(`${base}${path}`);
    check(r.status === 200, `GET ${path} → ${r.status}`);
    const page = parse(await r.text());
    const pageH1 = page.querySelectorAll("h1");
    check(
      pageH1.length === 1 && (kind === "guide" || pageH1[0].text.includes(content.contact.locality)),
      `${path} : un seul <h1>${kind === "motif" ? `, avec « ${content.contact.locality} »` : ""}`,
    );
    const pageTitle = page.querySelector("title")?.text ?? "";
    check(pageTitle.length >= 30 && pageTitle.length <= 65, `${path} : <title> 30–65 car. (${pageTitle.length}) : ${pageTitle}`);
    const pageDesc = page.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    check(pageDesc.length >= 70 && pageDesc.length <= 160, `${path} : meta description 70–160 car. (${pageDesc.length})`);
    const pageCanonical = page.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
    check(/^https:\/\//.test(pageCanonical) && pageCanonical.endsWith(path), `${path} : canonical ${pageCanonical}`);
    check(Boolean(page.querySelector('meta[property="og:image"]')), `${path} : og:image présent`);
    const pageTypes = page
      .querySelectorAll('script[type="application/ld+json"]')
      .flatMap((s) => (JSON.parse(s.textContent) as { "@graph"?: Array<Record<string, unknown>> })["@graph"] ?? [])
      .flatMap((n) => [n["@type"]].flat() as string[]);
    const pageType = kind === "motif" ? "MedicalWebPage" : "WebPage";
    check(pageTypes.includes(pageType) && pageTypes.includes("BreadcrumbList"), `${path} : JSON-LD ${pageType} + BreadcrumbList`);
    check(!pageTypes.includes("Physician"), `${path} : pas de Physician`);
    const pageBooking = page.querySelectorAll("a").filter((a) => a.getAttribute("href") === content.booking.url);
    check(pageBooking.length >= 2, `${path} : liens RDV (${pageBooking.length})`);
  }
  // Textes d'attente encore visibles (« [À COMPLÉTER …] ») sur chaque page du sitemap : critère de mise en ligne
  // du plan (§J). Signalés sans faire échouer : seules des données du cabinet peuvent les remplacer.
  const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of sitemapPaths) {
    const text = parse(await (await fetch(`${base}${path}`)).text()).querySelector("main")?.text ?? "";
    for (const placeholder of text.match(/\[[^\]]*(?:à compléter|à valider|mettre le)[^\]]*\]/gi) ?? []) {
      console.log(`⚠ ${path} : texte d'attente visible « ${placeholder} »`);
      if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Texte d'attente visible (${path})::${placeholder}`);
    }
  }

  const unknown = await fetch(`${base}/page-qui-n-existe-pas`);
  check(unknown.status === 404, `slug inconnu → ${unknown.status} (404 attendu)`);

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
