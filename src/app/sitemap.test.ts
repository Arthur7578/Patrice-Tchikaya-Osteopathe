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
      `${SITE_URL}/`, `${SITE_URL}/${published!.slug}`, `${SITE_URL}/paiement`, `${SITE_URL}/mentions-legales`, `${SITE_URL}/confidentialite`,
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
});
