import { NextResponse, type NextRequest } from "next/server";
import { ENABLED_LOCALES } from "@/config/i18n";
import { decideLocaleRoute, LOCALE_COOKIE } from "@/lib/i18n/routing";

/** Routage par langue : voir decideLocaleRoute (src/lib/i18n/routing.ts). */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Fichiers (robots.txt, sitemap.xml, llms.txt, icon.svg, manifest…) et icône Apple : hors routage par langue.
  if (/\.[a-z0-9]+$/i.test(pathname) || pathname.startsWith("/apple-icon")) return NextResponse.next();

  const decision = decideLocaleRoute(
    {
      method: request.method,
      pathname,
      search,
      host: request.nextUrl.host,
      headers: request.headers,
      cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    },
    ENABLED_LOCALES,
  );

  if (decision.type === "redirect") return NextResponse.redirect(new URL(decision.location, request.url), decision.status);
  const response =
    decision.type === "rewrite"
      ? NextResponse.rewrite(new URL(`${decision.pathname}${search}`, request.url))
      : NextResponse.next();
  if (decision.setCookie) {
    response.cookies.set(LOCALE_COOKIE, decision.setCookie, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Ni les ressources de Next, ni l'API, ni l'outil d'administration.
  matcher: ["/((?!_next/|_vercel/|api/|admin/).*)"],
};
