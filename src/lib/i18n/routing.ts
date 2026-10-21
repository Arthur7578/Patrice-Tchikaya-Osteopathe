import { DEFAULT_LOCALE, isLocale, localePath, splitLocalePath, type Locale } from "@/config/i18n";

/** Cookie du choix de langue : posé quand le visiteur change de langue avec le sélecteur, respecté ensuite. */
export const LOCALE_COOKIE = "locale";

/** Robots et outils d'aperçu : toujours la page demandée, jamais de redirection selon la langue. */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|embedly|preview|lighthouse|headless|axe-core/i;

/**
 * Langue préférée parmi `available`, d'après l'en-tête Accept-Language (« pt-PT,pt;q=0.9,fr;q=0.8 »).
 * La première langue disponible dans l'ordre des préférences l'emporte ; aucune : null.
 */
export function preferredLocale(acceptLanguage: string | null, available: readonly Locale[]): Locale | null {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0]!, q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((l) => l.base && l.base !== "*" && l.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { base } of ranked) if (isLocale(base) && available.includes(base)) return base;
  return null;
}

export type ProxyRequest = {
  method: string;
  pathname: string;
  search: string;
  host: string;
  headers: { get(name: string): string | null };
  cookie: string | undefined;
};

export type ProxyDecision =
  | { type: "next"; setCookie?: Locale }
  | { type: "rewrite"; pathname: string; setCookie?: Locale }
  | { type: "redirect"; location: string; status: 307 | 308 };

/**
 * Routage par langue (src/proxy.ts) :
 * - le français est servi sans préfixe : « /paiement » est réécrit en interne vers « /fr/paiement » ;
 *   « /fr/… » redirige (308) vers l'adresse sans préfixe (une seule URL par page) ;
 * - une langue non publiée (traduction non configurée) redirige (307) vers la page française ;
 * - à l'ENTRÉE sur le site (lien externe, favori, adresse tapée) sur une page française, un visiteur dont le
 *   navigateur préfère une autre langue publiée (ou qui l'a déjà choisie : cookie) est redirigé (307) vers sa
 *   langue. Jamais pour un robot (Googlebot n'envoie pas d'Accept-Language : il indexe chaque langue via hreflang),
 *   jamais en navigation interne (le visiteur qui clique sur « Français » reste en français) ;
 * - changer de langue avec le sélecteur (navigation interne vers une autre langue) mémorise le choix (cookie).
 */
export function decideLocaleRoute(req: ProxyRequest, enabled: readonly Locale[]): ProxyDecision {
  const { pathname, search } = req;
  const [, first = ""] = pathname.split("/");

  if (first === DEFAULT_LOCALE) {
    // L'image de partage est référencée par Next sous /fr/opengraph-image : servie telle quelle.
    if (pathname.startsWith(`/${DEFAULT_LOCALE}/opengraph-image`)) return { type: "next" };
    const rest = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return { type: "redirect", location: `${rest}${search}`, status: 308 };
  }

  const { locale, path } = splitLocalePath(pathname);
  const switched = languageSwitch(req, locale);

  if (locale !== DEFAULT_LOCALE) {
    if (!enabled.includes(locale)) return { type: "redirect", location: `${path}${search}`, status: 307 };
    return { type: "next", setCookie: switched };
  }

  const isPage = req.method === "GET" || req.method === "HEAD";
  const entering = !isSameOrigin(req);
  const ua = req.headers.get("user-agent") ?? "";
  if (isPage && entering && !BOT.test(ua)) {
    const remembered = req.cookie && isLocale(req.cookie) && enabled.includes(req.cookie) ? req.cookie : null;
    const target = remembered ?? preferredLocale(req.headers.get("accept-language"), enabled);
    if (target && target !== DEFAULT_LOCALE) return { type: "redirect", location: `${localePath(target, path)}${search}`, status: 307 };
  }
  return { type: "rewrite", pathname: `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`, setCookie: switched };
}

/** Requête venue d'une page du site (navigation interne) : Sec-Fetch-Site, sinon Referer. */
function isSameOrigin(req: ProxyRequest): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const referer = refererPath(req);
  return referer !== null;
}

function refererPath(req: ProxyRequest): string | null {
  const referer = req.headers.get("referer");
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.host === req.host ? url.pathname : null;
  } catch {
    return null;
  }
}

/** Langue choisie avec le sélecteur : navigation interne d'une page dans une langue vers une page dans une autre. */
function languageSwitch(req: ProxyRequest, target: Locale): Locale | undefined {
  if (req.headers.get("sec-fetch-mode") !== "navigate") return undefined;
  const from = refererPath(req);
  if (from === null) return undefined;
  return splitLocalePath(from).locale === target ? undefined : target;
}
