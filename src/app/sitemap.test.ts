import { describe, expect, it, vi } from "vitest";
import { SITE_URL } from "@/config/site";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { MotifPage } from "@/lib/content/types";

const getSiteContent = vi.fn();
vi.mock("@/lib/content/get-site-content", () => ({ getSiteContent }));

const { default: sitemap } = await import("./sitemap");

describe("sitemap.xml", () => {
  it("liste l'accueil, les pages légales et uniquement les motifs dont la page est publiée", async () => {
    const [published, ...others] = C.motifs;
    const page = { lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage;
    getSiteContent.mockResolvedValue({
      ...C,
      motifs: [{ ...published!, page }, ...others.map((m) => ({ ...m, page: null }))],
    });
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls[0]).toMatch(/\/$/);
    expect(urls.filter((u) => u.endsWith(`/${published!.slug}`))).toHaveLength(1);
    for (const m of others) expect(urls.some((u) => u.endsWith(`/${m.slug}`))).toBe(false);
    expect(urls.some((u) => u.endsWith("/mentions-legales"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/confidentialite"))).toBe(true);
    expect(entries.find((e) => e.url.endsWith(`/${published!.slug}`))!.lastModified).toEqual(new Date(page.lastEdited));
    expect(urls).toEqual([
      `${SITE_URL}/`, `${SITE_URL}/${published!.slug}`, `${SITE_URL}/articles`, `${SITE_URL}/paiement`, `${SITE_URL}/mentions-legales`, `${SITE_URL}/confidentialite`,
    ]);
  });

  it("liste aussi les pages d'information publiées (avec la date d'édition Notion), jamais les autres", async () => {
    const sample = C.motifs[0]!;
    const page = { lastEdited: "2026-10-01T07:26:00.000Z" } as MotifPage;
    const guide = (slug: string, published: boolean) => ({ ...sample, slug, page: published ? page : null });
    getSiteContent.mockResolvedValue({
      ...C,
      motifs: C.motifs.map((m) => ({ ...m, page: null })),
      guides: [guide("osteopathe-sans-ordonnance-dudelange", true), guide("brouillon", false)],
    });
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/osteopathe-sans-ordonnance-dudelange`);
    expect(urls).not.toContain(`${SITE_URL}/brouillon`);
    expect(entries.find((e) => e.url.endsWith("/osteopathe-sans-ordonnance-dudelange"))!.lastModified).toEqual(new Date(page.lastEdited));
  });

  it("/articles : daté de la page la plus récemment modifiée ; absent s'il n'y a aucune page publiée", async () => {
    const [a, b] = C.motifs;
    const old = { lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage;
    const recent = { lastEdited: "2026-10-01T07:26:00.000Z" } as MotifPage;
    getSiteContent.mockResolvedValue({ ...C, motifs: [{ ...a!, page: recent }, { ...b!, page: old }], guides: [] });
    const entries = await sitemap();
    expect(entries.find((e) => e.url === `${SITE_URL}/articles`)!.lastModified).toEqual(new Date(recent.lastEdited));
    getSiteContent.mockResolvedValue({ ...C, motifs: C.motifs.map((m) => ({ ...m, page: null })), guides: [] });
    expect((await sitemap()).map((e) => e.url)).not.toContain(`${SITE_URL}/articles`);
  });

  it("plusieurs langues publiées : chaque page dans chaque langue (juridiques comprises), avec ses équivalents", async () => {
    vi.resetModules();
    vi.doMock("@/config/i18n", async (orig) => ({ ...(await orig<typeof import("@/config/i18n")>()), ENABLED_LOCALES: ["fr", "en"] }));
    const { default: multilingual } = await import("./sitemap");
    getSiteContent.mockResolvedValue({ ...C, motifs: C.motifs.map((m) => ({ ...m, page: null })), guides: [] });
    const entries = await multilingual();
    expect(entries.map((e) => e.url)).toEqual([
      `${SITE_URL}/`, `${SITE_URL}/en`, `${SITE_URL}/paiement`, `${SITE_URL}/en/paiement`,
      `${SITE_URL}/mentions-legales`, `${SITE_URL}/en/mentions-legales`, `${SITE_URL}/confidentialite`, `${SITE_URL}/en/confidentialite`,
    ]);
    expect(entries[1]!.alternates).toEqual({ languages: { fr: `${SITE_URL}/`, en: `${SITE_URL}/en`, "x-default": `${SITE_URL}/` } });
    expect(entries.at(-1)!.alternates).toEqual({
      languages: { fr: `${SITE_URL}/confidentialite`, en: `${SITE_URL}/en/confidentialite`, "x-default": `${SITE_URL}/confidentialite` },
    });
    vi.doUnmock("@/config/i18n");
  });

  it("slugs traduits : chaque langue a l'adresse de sa langue, et les équivalents suivent", async () => {
    vi.resetModules();
    vi.doMock("@/config/i18n", async (orig) => ({ ...(await orig<typeof import("@/config/i18n")>()), ENABLED_LOCALES: ["fr", "en"] }));
    const { default: multilingual } = await import("./sitemap");
    const [page, ...others] = C.motifs;
    const slugs = { fr: page!.slug, de: page!.slug, en: "en-slug", lb: page!.slug, pt: page!.slug };
    getSiteContent.mockResolvedValue({
      ...C,
      motifs: [{ ...page!, page: { lastEdited: "2026-10-01T00:00:00.000Z" } as MotifPage, slugs }, ...others.map((m) => ({ ...m, page: null }))],
      guides: [],
    });
    const entries = await multilingual();
    const en = entries.find((e) => e.url === `${SITE_URL}/en/en-slug`)!;
    expect(en.alternates).toEqual({ languages: { fr: `${SITE_URL}/${page!.slug}`, en: `${SITE_URL}/en/en-slug`, "x-default": `${SITE_URL}/${page!.slug}` } });
    expect(entries.some((e) => e.url === `${SITE_URL}/en/${page!.slug}`)).toBe(false);
    vi.doUnmock("@/config/i18n");
  });
});
