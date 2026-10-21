import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/i18n", async (orig) => ({ ...(await orig<typeof import("@/config/i18n")>()), ENABLED_LOCALES: ["fr", "en", "lb", "pt"] }));
const { config, proxy } = await import("./proxy");

const call = (path: string, headers: Record<string, string> = {}) => proxy(new NextRequest(`https://site.test${path}`, { headers }));

describe("proxy (routage par langue)", () => {
  it("page française : réécrite vers /fr, adresse inchangée", () => {
    expect(call("/paiement?a=1").headers.get("x-middleware-rewrite")).toBe("https://site.test/fr/paiement?a=1");
  });

  it("redirections : /fr/… (308) et langue du navigateur à l'entrée (307)", () => {
    const fr = call("/fr/paiement");
    expect(fr.status).toBe(308);
    expect(fr.headers.get("location")).toBe("https://site.test/paiement");
    const pt = call("/", { "accept-language": "pt-PT", "user-agent": "Mozilla/5.0 Chrome/141.0" });
    expect(pt.status).toBe(307);
    expect(pt.headers.get("location")).toBe("https://site.test/pt");
  });

  it("changement de langue avec le sélecteur : cookie « locale » d'un an", () => {
    const res = call("/en", { "sec-fetch-site": "same-origin", "sec-fetch-mode": "navigate", referer: "https://site.test/" });
    expect(res.cookies.get("locale")).toMatchObject({ value: "en", path: "/", maxAge: 31536000, sameSite: "lax" });
  });

  it("fichiers et icône Apple : jamais réécrits ni redirigés", () => {
    for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/icon.svg", "/apple-icon"]) {
      const res = call(path, { "accept-language": "pt" });
      expect(res.headers.get("x-middleware-rewrite"), path).toBeNull();
      expect(res.headers.get("x-middleware-next"), path).toBe("1");
    }
  });

  it("ne s'applique ni aux ressources de Next, ni à l'API, ni à l'outil d'administration", () => {
    const pattern = new RegExp(`^${config.matcher[0]!}$`);
    for (const path of ["/", "/paiement", "/en/mal-de-dos", "/opengraph-image"]) expect(pattern.test(path), path).toBe(true);
    for (const path of ["/_next/static/x.js", "/api/revalidate", "/admin/photos", "/_vercel/insights"]) expect(pattern.test(path), path).toBe(false);
  });
});
