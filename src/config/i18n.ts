/**
 * Langues du site. Le français est la langue source (Notion, ui-copy.ts) et sert à la racine (« / ») ;
 * les autres langues ont un préfixe (« /en », « /lb », « /pt ») et sont traduites automatiquement
 * (contenu Notion : src/lib/i18n/translate.ts ; textes d'interface : src/content/ui-copy.*.ts).
 * Ajouter une langue : l'ajouter ici + un fichier ui-copy.<code>.ts (le typage signale ce qui manque).
 */
export const LOCALES = ["fr", "en", "lb", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

type LocaleMeta = {
  /** Attribut `lang` de <html> et `inLanguage` du JSON-LD. */
  htmlLang: string;
  /** `hreflang` des liens alternatifs (langue seule : le site vise tous les lecteurs de la langue). */
  hreflang: string;
  /** `og:locale`. */
  ogLocale: string;
  /** Formats de nombres et de dates (Intl). */
  intl: string;
  /** Nom de la langue dans la langue elle-même (sélecteur de langue). */
  label: string;
  /** Nom anglais de la langue, pour les consignes du traducteur. */
  englishName: string;
  /**
   * Langue de la page de réservation chez le prestataire (segment de l'URL Doctena « /fr/… », « /en/… »).
   * Doctena n'a pas de version luxembourgeoise : la version française est la plus proche (demande d'Arthur).
   */
  bookingLang: string;
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  fr: { htmlLang: "fr-LU", hreflang: "fr", ogLocale: "fr_LU", intl: "fr-LU", label: "Français", englishName: "French", bookingLang: "fr" },
  en: { htmlLang: "en", hreflang: "en", ogLocale: "en_GB", intl: "en-GB", label: "English", englishName: "British English", bookingLang: "en" },
  lb: { htmlLang: "lb", hreflang: "lb", ogLocale: "lb_LU", intl: "lb", label: "Lëtzebuergesch", englishName: "Luxembourgish", bookingLang: "fr" },
  // Portugais d'Europe : la communauté portugaise du Luxembourg vient surtout du Portugal.
  pt: { htmlLang: "pt-PT", hreflang: "pt", ogLocale: "pt_PT", intl: "pt-PT", label: "Português", englishName: "European Portuguese", bookingLang: "pt" },
};

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/**
 * Traduction disponible : clé API Claude présente, ou mode « identity » (CI et tests : textes français
 * sous les adresses traduites, pour vérifier les routes sans appeler l'API ; jamais en production).
 * Sans traduction, seules les pages françaises existent : ni /en, ni hreflang, ni sélecteur de langue.
 */
export function translationMode(env: NodeJS.ProcessEnv = process.env): "claude" | "identity" | null {
  if (env.ANTHROPIC_API_KEY) return "claude";
  if (env.TRANSLATION_MODE === "identity" && env.VERCEL_ENV !== "production") return "identity";
  return null;
}

/** Langues publiées : le français toujours, les autres seulement si la traduction est disponible. */
export const ENABLED_LOCALES: readonly Locale[] = translationMode() ? LOCALES : [DEFAULT_LOCALE];

/**
 * Chemin public d'une page dans une langue : `localePath("en", "/paiement")` → « /en/paiement »,
 * `localePath("fr", "/")` → « / », `localePath("en", "/#infos")` → « /en#infos ».
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  const [pathname, hash] = path.split("#", 2);
  const prefixed = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return hash === undefined ? prefixed : `${prefixed}#${hash}`;
}

/** Inverse de localePath pour un chemin public : « /en/paiement » → { locale: "en", path: "/paiement" }. */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first) && first !== DEFAULT_LOCALE) return { locale: first, path: `/${rest.join("/")}` };
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/**
 * `alternates` d'une page présente dans toutes les langues publiées : canonical + hreflang (dont x-default,
 * le français, servi aux langues non prévues). Une seule langue publiée : canonical seul.
 */
export function localeAlternates(locale: Locale, path: string) {
  const canonical = localePath(locale, path);
  if (ENABLED_LOCALES.length < 2) return { canonical };
  const languages: Record<string, string> = {};
  for (const l of ENABLED_LOCALES) languages[LOCALE_META[l].hreflang] = localePath(l, path);
  languages["x-default"] = localePath(DEFAULT_LOCALE, path);
  return { canonical, languages };
}
