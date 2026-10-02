import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { SiteContent } from "@/lib/content/types";
import { buildLlmsTxt } from "@/lib/seo/llms-txt";
import { FORBIDDEN_TITLES, render, visibleText } from "@/test/render";

const getSiteContent = vi.fn<() => Promise<SiteContent>>();
vi.mock("@/lib/content/get-site-content", () => ({ getSiteContent }));

// ImageResponse (satori/resvg) est remplacé par un objet qui garde l'élément et les options : on teste le contenu.
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(
      readonly element: ReactElement,
      readonly options: { width: number; height: number },
    ) {}
  },
}));
type FakeImage = { element: ReactElement; options: { width: number; height: number } };

beforeEach(() => {
  getSiteContent.mockReset().mockResolvedValue(C);
  vi.stubEnv("VERCEL_ENV", "");
  vi.stubEnv("ALLOW_INDEXING", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("/llms.txt", () => {
  /** ALLOW_INDEXING est évalué à l'import de @/config/site. */
  async function loadRoute() {
    vi.resetModules();
    return import("./llms.txt/route");
  }

  it("hors production : 404, sans lire le contenu (même politique que robots.txt)", async () => {
    const res = await (await loadRoute()).GET();
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not found");
    expect(getSiteContent).not.toHaveBeenCalled();
  });

  it("en production : texte brut UTF-8 généré depuis le contenu", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const route = await loadRoute();
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe(buildLlmsTxt(C));
    expect(route.revalidate).toBe(3600);
  });
});

describe("manifest", () => {
  it("nom du praticien, démarrage à l'accueil, icône SVG servie par l'app", async () => {
    const { default: manifest } = await import("./manifest");
    expect(await manifest()).toEqual({
      name: `${C.practitioner.name} – ${C.practitioner.title}`,
      short_name: C.practitioner.name,
      start_url: "/",
      display: "browser",
      background_color: "#fdfdfc",
      theme_color: "#2d5a4c",
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    });
  });
});

describe("images générées", () => {
  it("image de partage (Open Graph) : 1200×630, nom, titre et ville, sans « médecin » ni « Dr »", async () => {
    const og = await import("./opengraph-image");
    expect(og.size).toEqual({ width: 1200, height: 630 });
    expect(og.contentType).toBe("image/png");
    expect(og.alt).not.toMatch(FORBIDDEN_TITLES);
    expect(og.alt).toBe(`${C.practitioner.name}, ostéopathe D.O. à ${C.contact.locality}`); // statique : suit le contenu de secours
    const image = (await og.default()) as unknown as FakeImage;
    expect(image.options).toEqual(og.size);
    const text = visibleText(render(image.element));
    expect(text).toContain(C.practitioner.name);
    expect(text).toContain(C.practitioner.title);
    expect(text).toContain(`Ostéopathe à ${C.contact.locality}`);
    expect(text).not.toMatch(FORBIDDEN_TITLES);
  });

  it("icône Apple : 180×180, initiales", async () => {
    const icon = await import("./apple-icon");
    expect(icon.size).toEqual({ width: 180, height: 180 });
    expect(icon.contentType).toBe("image/png");
    const image = icon.default() as unknown as FakeImage;
    expect(image.options).toEqual(icon.size);
    expect(visibleText(render(image.element))).toBe("PT");
  });
});

describe("/admin/photos (outil temporaire d'upload)", () => {
  const page = async (searchParams: Record<string, string | string[]>) => {
    const { default: AdminPhotosPage } = await import("./admin/photos/page");
    return AdminPhotosPage({ searchParams: Promise.resolve(searchParams) } as never);
  };
  const notFound = expect.objectContaining({ digest: expect.stringMatching(/404/) });

  it("jamais indexée", async () => {
    const { metadata } = await import("./admin/photos/page");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it.each([
    ["secret non configuré, clé vide", "", { key: "" }],
    ["secret non configuré, sans clé", "", {}],
    ["mauvaise clé", "cle", { key: "faux" }],
    ["clé répétée dans l'URL", "cle", { key: ["cle", "cle"] }],
  ])("404 (%s)", async (_label, secret, params) => {
    vi.stubEnv("ADMIN_UPLOAD_SECRET", secret);
    await expect(page(params)).rejects.toEqual(notFound);
  });

  it("bonne clé : formulaire d'upload vers l'API, clé transmise, types et taille annoncés", async () => {
    vi.stubEnv("ADMIN_UPLOAD_SECRET", "cle");
    const root = render(await page({ key: "cle" }));
    const form = root.querySelector("form")!;
    expect(form.getAttribute("action")).toBe("/api/admin/upload");
    expect(form.getAttribute("method")).toBe("post");
    expect(form.getAttribute("enctype")).toBe("multipart/form-data");
    expect(form.querySelector('input[name="key"]')?.getAttribute("value")).toBe("cle");
    expect(form.querySelector('input[type="file"]')?.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp");
    expect(form.querySelectorAll("option").map((o) => o.getAttribute("value"))).toEqual([
      "Url_Photo_Hero",
      "Url_Photo_Portrait",
      "Url_Photo_Cabinet",
    ]);
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    const text = visibleText(root);
    expect(text).toContain("à coller dans la colonne URL de la ligne correspondante"); // mot « URL » séparé, en gras
    expect(text).toContain("je colle cette URL sur la ligne <nom choisi> »");
    expect(root.querySelector("input[readonly]")).toBeNull();
  });

  it("après envoi : l'URL obtenue est affichée, prête à copier", async () => {
    vi.stubEnv("ADMIN_UPLOAD_SECRET", "cle");
    const root = render(await page({ key: "cle", uploaded: "https://blob.test/photo-abc.png" }));
    expect(root.querySelector("input[readonly]")?.getAttribute("value")).toBe("https://blob.test/photo-abc.png");
  });
});
