import { beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/content/ui-copy";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { expectSiteRules, jsonLdNodes, renderPage } from "@/test/render";

const getSiteContent = vi.fn<() => Promise<SiteContent>>();
vi.mock("@/lib/content/get-site-content", () => ({ getSiteContent }));

const { default: Articles, generateMetadata } = await import("./page");

const page = { blocks: [], wordCount: 300, lastEdited: "2026-10-01T00:00:00.000Z" };
const guide = (slug: string, published: boolean) => ({
  title: `Guide ${slug}`, slug, description: "Description.", icon: "Sparkles", notionPageId: null, page: published ? page : null,
});
const withGuides = (...guides: ReturnType<typeof guide>[]): SiteContent => ({ ...C, guides });

beforeEach(() => getSiteContent.mockReset().mockResolvedValue(withGuides(guide("publie", true), guide("brouillon", false))));

describe("/articles", () => {
  it("canonical /articles (règle 9), titre et description dérivés de la ville", async () => {
    const m = await generateMetadata();
    expect(m.alternates?.canonical).toBe("/articles");
    expect(m.title).toBe(COPY.articles.metaTitle);
    expect(m.description).toBe(COPY.articles.metaDescription(C.contact.locality));
  });

  it("un seul <h1>, JSON-LD CollectionPage + fil d'Ariane, règles du site", async () => {
    const root = await renderPage(Articles);
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(root.querySelector("h1")!.text).toBe(COPY.articles.title);
    expect(jsonLdNodes(root).map((n) => n["@type"])).toEqual(["CollectionPage", "BreadcrumbList"]);
    expectSiteRules(root);
  });

  it("liste toutes les pages publiées (motifs puis pages d'information), jamais les autres", async () => {
    const root = await renderPage(Articles);
    const hrefs = root.querySelectorAll("main li a").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([...C.motifs.filter((m) => m.page).map((m) => `/${m.slug}`), "/publie"]);
    expect(hrefs).not.toContain("/brouillon");
  });

  it("le JSON-LD liste les mêmes pages, dans le même ordre", async () => {
    const root = await renderPage(Articles);
    const collection = jsonLdNodes(root)[0] as { mainEntity: { itemListElement: { position: number; url: string }[] } };
    const urls = collection.mainEntity.itemListElement.map((i) => new URL(i.url).pathname);
    expect(urls).toEqual(root.querySelectorAll("main li a").map((a) => a.getAttribute("href")));
    expect(collection.mainEntity.itemListElement.map((i) => i.position)).toEqual(urls.map((_, i) => i + 1));
  });

  it("aucune page publiée : 404 (rien à lister)", async () => {
    getSiteContent.mockResolvedValue({ ...C, motifs: C.motifs.map((m) => ({ ...m, page: null })), guides: [] });
    await expect(Articles()).rejects.toEqual(expect.objectContaining({ digest: expect.stringMatching(/404/) }));
  });
});
