import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SITE_URL } from "@/config/site";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { homeMeta } from "@/lib/seo/metadata";
import { jsonLdNodes, render } from "@/test/render";

const getSiteContent = vi.fn<() => Promise<SiteContent>>();
vi.mock("@/lib/content/get-site-content", () => ({ getSiteContent }));
// next/font est résolu par le compilateur Next ; hors runtime, un objet de classes suffit.
vi.mock("next/font/google", () => ({ Plus_Jakarta_Sans: () => ({ variable: "font-jakarta", className: "" }) }));
// Scripts Vercel (même origine, vérifiés en e2e) : hors du périmètre de ce test.
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => null }));

/** ALLOW_INDEXING est évalué à l'import de @/config/site : on recharge le layout pour chaque environnement. */
async function loadLayout() {
  vi.resetModules();
  return import("./layout");
}

beforeEach(() => {
  getSiteContent.mockReset().mockResolvedValue(C);
  vi.stubEnv("VERCEL_ENV", "");
  vi.stubEnv("ALLOW_INDEXING", "");
  vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("layout racine : métadonnées", () => {
  it("valeurs communes à tout le site (titre, description, Open Graph, pas de détection auto des numéros)", async () => {
    const { generateMetadata, revalidate, viewport } = await loadLayout();
    const meta = await generateMetadata();
    const { title, description } = homeMeta(C);
    expect(meta.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(meta.title).toEqual({
      default: title,
      template: `%s | ${C.practitioner.name}, ostéopathe à ${C.contact.locality}`,
    });
    expect(meta.description).toBe(description);
    expect(meta.applicationName).toBe(`${C.practitioner.name} – ${C.practitioner.title}`);
    expect(meta.openGraph).toMatchObject({ type: "website", locale: "fr_LU", siteName: `${C.practitioner.name} – ${C.practitioner.title}` });
    expect(meta.twitter).toEqual({ card: "summary_large_image" });
    expect(meta.formatDetection).toEqual({ telephone: false });
    expect(meta.alternates, "règle 9 : jamais de canonical dans le layout").toBeUndefined();
    expect(revalidate).toBe(3600);
    expect(viewport).toMatchObject({ themeColor: "#2d5a4c", colorScheme: "light" });
  });

  it("hors production : noindex, nofollow", async () => {
    expect((await (await loadLayout()).generateMetadata()).robots).toEqual({ index: false, follow: false });
  });

  it("production Vercel : indexable", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect((await (await loadLayout()).generateMetadata()).robots).toEqual({ index: true, follow: true });
  });

  it("vérification Google Search Console seulement si la variable est définie", async () => {
    expect((await (await loadLayout()).generateMetadata()).verification).toBeUndefined();
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "jeton");
    expect((await (await loadLayout()).generateMetadata()).verification).toEqual({ google: "jeton" });
  });
});

describe("layout racine : rendu", () => {
  async function renderLayout() {
    const { default: RootLayout } = await loadLayout();
    const element = (await RootLayout({ children: <main id="contenu">Contenu</main> } as never)) as ReactElement;
    return render(element);
  }

  it("langue fr-LU, JSON-LD du site (WebSite, cabinet, praticien) dans le <head>", async () => {
    const root = await renderLayout();
    expect(root.querySelector("html")?.getAttribute("lang")).toBe("fr-LU");
    const types = jsonLdNodes(root.querySelector("head")!).flatMap((n) => [n["@type"]].flat());
    expect(types).toEqual(expect.arrayContaining(["WebSite", "MedicalBusiness", "Person"]));
  });

  it("sans JavaScript, les sections animées restent visibles (<noscript>)", async () => {
    const noscript = (await renderLayout()).querySelector("head noscript");
    expect(noscript?.innerHTML).toContain("[data-reveal]{opacity:1!important;transform:none!important}");
  });

  it("ordre du <body> : lien d'évitement d'abord, puis en-tête, contenu, pied de page, barre mobile", async () => {
    const body = (await renderLayout()).querySelector("body")!;
    const first = body.childNodes.find((n) => n.nodeType === 1) as unknown as { getAttribute(n: string): string };
    expect(first.getAttribute("href")).toBe("#contenu");
    const order = ["header", "main#contenu", "footer", 'a[aria-label^="Appeler le cabinet"]'].map((selector) =>
      body.innerHTML.indexOf(body.querySelector(selector)!.outerHTML),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(body.querySelectorAll("main")).toHaveLength(1);
  });
});
