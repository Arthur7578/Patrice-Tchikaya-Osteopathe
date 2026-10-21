"use client";

import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { localePath, splitLocalePath, type Locale } from "@/config/i18n";

type Option = { locale: Locale; label: string; htmlLang: string; hreflang: string };
/**
 * `dropdown` : bouton de l'en-tête (à partir de sm) ; `inline` : liste dans le menu mobile (l'en-tête est trop étroit).
 * `pages` : slugs de chaque page détaillée dans chaque langue (slugs traduits : « /de/sportosteopathie » ↔ « /osteopathie-du-sport »).
 */
type Props = { current: Locale; options: Option[]; label: string; pages?: Array<Partial<Record<Locale, string>>>; variant?: "dropdown" | "inline" };

const noSubscribe = () => () => {};
const browserPath = () => window.location.pathname;
const serverPath = () => null;

/**
 * Sélecteur de langue (<details> natif : s'ouvre sans JS). Sans JS, ou avant l'hydratation, chaque langue mène à son
 * accueil ; ensuite, à la même page dans l'autre langue. Le chemin est lu dans l'URL du navigateur et non dans le
 * rendu serveur : le proxy réécrit les pages françaises (« / » → « /fr »), le serveur ne connaît pas l'adresse
 * affichée (docs Next : usePathname et réécritures).
 */
export function LanguageSwitcher({ current, options, label, pages = [], variant = "dropdown" }: Props) {
  usePathname(); // nouveau rendu à chaque navigation interne
  const pathname = useSyncExternalStore(noSubscribe, browserPath, serverPath);
  const path = pathname === null ? "/" : splitLocalePath(pathname).path;
  const page = pages.find((p) => `/${p[current]}` === path);
  const pathIn = (locale: Locale) => (page?.[locale] ? `/${page[locale]}` : path);
  const active = options.find((o) => o.locale === current);
  const link = (option: Option, className: string) => (
    <a
      href={localePath(option.locale, pathIn(option.locale))}
      hrefLang={option.hreflang}
      lang={option.htmlLang}
      aria-current={option.locale === current ? "true" : undefined}
      className={className}
    >
      {option.label}
    </a>
  );

  if (variant === "inline") {
    return (
      <ul aria-label={label} className="flex flex-wrap gap-x-5 gap-y-2 px-3 py-3 text-sm">
        {options.map((option) => (
          <li key={option.locale}>
            {link(option, "text-slate-600 underline-offset-4 hover:text-sage-700 hover:underline aria-[current=true]:font-semibold aria-[current=true]:text-sage-800")}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <details className="group relative hidden sm:block">
      <summary
        aria-label={label}
        className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-slate-600 uppercase hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 [&::-webkit-details-marker]:hidden"
      >
        <Languages aria-hidden="true" className="size-4" />
        <span lang={active?.htmlLang}>{current}</span>
      </summary>
      <ul className="absolute right-0 z-50 mt-2 min-w-44 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg">
        {options.map((option) => (
          <li key={option.locale}>
            {link(option, "block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-sage-50 hover:text-sage-700 aria-[current=true]:font-semibold aria-[current=true]:text-sage-800")}
          </li>
        ))}
      </ul>
    </details>
  );
}
