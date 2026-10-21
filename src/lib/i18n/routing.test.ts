import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "@/config/i18n";
import { decideLocaleRoute, preferredLocale, type ProxyRequest } from "./routing";

describe("preferredLocale (Accept-Language)", () => {
  it.each([
    ["pt-PT,pt;q=0.9,fr;q=0.8", "pt"],
    ["fr-FR,fr;q=0.9,en;q=0.8", "fr"],
    ["de-DE,de;q=0.9,en;q=0.7", "de"],
    ["it-IT,it;q=0.9,en;q=0.7", "en"], // italien non proposé : la langue suivante disponible
    ["en;q=0.5,lb;q=0.9", "lb"], // ordre de qualité, pas d'écriture
    ["en,pt", "en"], // même qualité : ordre de l'en-tête
    ["it,es", null],
    ["*", null],
    ["pt;q=0", null], // q=0 : refusée
    ["", null],
  ] as const)("« %s » → %s", (header, expected) => {
    expect(preferredLocale(header, LOCALES)).toBe(expected);
  });

  it("ignore une langue non publiée", () => {
    expect(preferredLocale("pt-PT,en;q=0.5", ["fr", "en"])).toBe("en");
    expect(preferredLocale(null, LOCALES)).toBeNull();
  });
});

const req = (pathname: string, headers: Record<string, string> = {}, extra: Partial<ProxyRequest> = {}): ProxyRequest => ({
  method: "GET",
  pathname,
  search: "",
  host: "site.test",
  headers: { get: (name) => headers[name.toLowerCase()] ?? null },
  cookie: undefined,
  ...extra,
});
const ALL: readonly Locale[] = LOCALES;
const CHROME = { "user-agent": "Mozilla/5.0 Chrome/141.0" };

describe("decideLocaleRoute", () => {
  it("français sans préfixe : réécrit vers /fr (adresse publique inchangée)", () => {
    expect(decideLocaleRoute(req("/"), ALL)).toEqual({ type: "rewrite", pathname: "/fr", setCookie: undefined });
    expect(decideLocaleRoute(req("/paiement"), ALL)).toEqual({ type: "rewrite", pathname: "/fr/paiement", setCookie: undefined });
  });

  it("/fr/… : redirection permanente vers l'adresse sans préfixe, requête conservée", () => {
    expect(decideLocaleRoute(req("/fr"), ALL)).toEqual({ type: "redirect", location: "/", status: 308 });
    expect(decideLocaleRoute(req("/fr/paiement", {}, { search: "?a=1" }), ALL)).toEqual({ type: "redirect", location: "/paiement?a=1", status: 308 });
  });

  it("/fr/opengraph-image : servie telle quelle (adresse générée par Next pour l'image de partage)", () => {
    expect(decideLocaleRoute(req("/fr/opengraph-image"), ALL)).toEqual({ type: "next" });
  });

  it("langue publiée : servie telle quelle ; langue non publiée : redirection temporaire vers le français", () => {
    expect(decideLocaleRoute(req("/en/paiement"), ALL)).toEqual({ type: "next", setCookie: undefined });
    expect(decideLocaleRoute(req("/en/paiement", {}, { search: "?x" }), ["fr"])).toEqual({ type: "redirect", location: "/paiement?x", status: 307 });
  });

  it("entrée sur une page française avec un navigateur en portugais : redirigé vers /pt (même page)", () => {
    const d = decideLocaleRoute(req("/paiement", { ...CHROME, "accept-language": "pt-PT,pt;q=0.9" }, { search: "?utm=1" }), ALL);
    expect(d).toEqual({ type: "redirect", location: "/pt/paiement?utm=1", status: 307 });
    expect(decideLocaleRoute(req("/", { ...CHROME, "accept-language": "en-GB" }), ALL)).toEqual({ type: "redirect", location: "/en", status: 307 });
  });

  it.each([
    ["navigateur en français", { ...CHROME, "accept-language": "fr-LU,en;q=0.5" }, {}],
    ["robot (Googlebot)", { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)", "accept-language": "pt" }, {}],
    ["navigation interne (Sec-Fetch-Site)", { ...CHROME, "accept-language": "pt", "sec-fetch-site": "same-origin" }, {}],
    ["navigation interne (Referer, sans Sec-Fetch)", { ...CHROME, "accept-language": "pt", referer: "https://site.test/en" }, {}],
    ["choix du français retenu (cookie)", { ...CHROME, "accept-language": "pt" }, { cookie: "fr" }],
    ["requête POST", { ...CHROME, "accept-language": "pt" }, { method: "POST" }],
    ["langue préférée non publiée", { ...CHROME, "accept-language": "pt" }, {}, ["fr", "en"] as Locale[]],
  ])("pas de redirection : %s", (_label, headers, extra, enabled: readonly Locale[] = ALL) => {
    expect(decideLocaleRoute(req("/paiement", headers, extra), enabled).type).toBe("rewrite");
  });

  it("page juridique (français seulement) : jamais redirigée", () => {
    expect(decideLocaleRoute(req("/mentions-legales", { ...CHROME, "accept-language": "en" }), ALL).type).toBe("rewrite");
  });

  it("une langue choisie auparavant (cookie) l'emporte sur le navigateur, si elle est publiée", () => {
    expect(decideLocaleRoute(req("/", { ...CHROME, "accept-language": "fr" }, { cookie: "lb" }), ALL)).toEqual({ type: "redirect", location: "/lb", status: 307 });
    expect(decideLocaleRoute(req("/", { ...CHROME, "accept-language": "fr" }, { cookie: "lb" }), ["fr", "en"]).type).toBe("rewrite");
    expect(decideLocaleRoute(req("/", { ...CHROME, "accept-language": "fr" }, { cookie: "xx" }), ALL).type).toBe("rewrite");
  });

  it("changer de langue avec le sélecteur (navigation interne d'une langue à l'autre) mémorise le choix", () => {
    const nav = (pathname: string, referer: string) =>
      decideLocaleRoute(req(pathname, { "sec-fetch-site": "same-origin", "sec-fetch-mode": "navigate", referer: `https://site.test${referer}` }), ALL);
    expect(nav("/en/paiement", "/paiement")).toEqual({ type: "next", setCookie: "en" });
    expect(nav("/paiement", "/en/paiement")).toEqual({ type: "rewrite", pathname: "/fr/paiement", setCookie: "fr" });
    expect(nav("/en/articles", "/en/paiement")).toEqual({ type: "next", setCookie: undefined }); // même langue
    // Referer d'un autre site : pas un choix fait sur ce site.
    expect(decideLocaleRoute(req("/en", { "sec-fetch-mode": "navigate", referer: "https://autre.test/" }), ALL)).toEqual({ type: "next", setCookie: undefined });
    // Pas une navigation (préchargement, image…) : rien n'est mémorisé.
    expect(decideLocaleRoute(req("/en", { referer: "https://site.test/" }), ALL)).toEqual({ type: "next", setCookie: undefined });
  });

  it("Referer illisible : traité comme une entrée", () => {
    const d = decideLocaleRoute(req("/", { ...CHROME, "accept-language": "pt", referer: "pas une url" }), ALL);
    expect(d).toEqual({ type: "redirect", location: "/pt", status: 307 });
  });
});
