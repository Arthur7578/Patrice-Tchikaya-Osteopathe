"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
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
 * Sélecteur de langue (<details> natif : s'ouvre sans JS ; avec JS, se ferme au clic extérieur et avec Échap).
 * Déclencheur : globe + code de la langue + chevron, le repère le plus répandu (pas l'icône « 文A », peu comprise ; pas
 * de drapeaux : une langue n'est pas un pays, et le français, l'allemand et le luxembourgeois sont tous parlés au
 * Luxembourg). Chaque langue est écrite dans sa propre langue, la langue courante est cochée (DECISIONS 21/10). Sans JS, ou avant l'hydratation, chaque langue mène à son
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
  const headingId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const onClick = (e: MouseEvent) => {
      if (details.open && !details.contains(e.target as Node)) details.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !details.open) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const link = (option: Option, className: string) => (
    <a
      href={localePath(option.locale, pathIn(option.locale))}
      hrefLang={option.hreflang}
      lang={option.htmlLang}
      aria-current={option.locale === current ? "true" : undefined}
      className={className}
    >
      {option.label}
      {option.locale === current && <Check aria-hidden="true" className="size-4 shrink-0" />}
    </a>
  );

  if (variant === "inline") {
    return (
      <div className="px-3 py-4">
        <p id={headingId} className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Globe aria-hidden="true" className="size-4" />
          {label}
        </p>
        <ul aria-labelledby={headingId} className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <li key={option.locale}>
              {link(
                option,
                "inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200 px-4 text-sm text-slate-700 hover:border-sage-300 hover:text-sage-700 aria-[current=true]:border-sage-700 aria-[current=true]:bg-sage-50 aria-[current=true]:font-semibold aria-[current=true]:text-sage-800",
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <details ref={detailsRef} className="group relative hidden sm:block">
      {/* Nom accessible « Langue du site, FR » : il contient le texte visible (WCAG 2.5.3). */}
      <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-slate-600 hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 [&::-webkit-details-marker]:hidden">
        <Globe aria-hidden="true" className="size-4" />
        <span className="sr-only">{label}, </span>
        <span lang={active?.htmlLang} className="uppercase">
          {current}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 min-w-52 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg">
        <p id={headingId} className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500">
          {label}
        </p>
        <ul aria-labelledby={headingId}>
          {options.map((option) => (
            <li key={option.locale}>
              {link(
                option,
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-sage-50 hover:text-sage-700 aria-[current=true]:font-semibold aria-[current=true]:text-sage-800",
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
