import { MapPin } from "lucide-react";
import Link from "next/link";
import { BookingLink } from "@/components/booking/booking-link";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ENABLED_LOCALES, LOCALE_META, localePath } from "@/config/i18n";
import { getCopy, homeLink, navLinks } from "@/content/ui-copy";
import { publishedPages } from "@/lib/content/published";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = { content: SiteContent };

const NAV_LINK = "text-sm font-medium text-slate-600 hover:text-sage-700";

export function SiteHeader({ content }: Props) {
  const copy = getCopy(content.locale);
  const { practitioner, contact, booking, locale } = content;
  const home = homeLink(locale);
  const nav = navLinks(locale);
  const languages = ENABLED_LOCALES.map((l) => ({ locale: l, label: LOCALE_META[l].label, htmlLang: LOCALE_META[l].htmlLang, hreflang: LOCALE_META[l].hreflang }));
  // Slugs traduits des pages détaillées : le sélecteur mène à la même page dans l'autre langue.
  const pages = publishedPages(content).flatMap((m) => (m.slugs ? [m.slugs] : []));
  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href={home.href} className="flex flex-col leading-tight">
          <span className="font-bold text-ink">{practitioner.name}</span>
          <span className="text-sm text-slate-500">• {practitioner.title}</span>
        </Link>
        <nav aria-label={copy.navLabel} className="hidden lg:block">
          <ul className="flex items-center gap-8">
            <li>
              <Link href={home.href} className={NAV_LINK}>
                {home.label}
              </Link>
            </li>
            {/* Ancres en <a> natif, pas <Link> : avec l'ancre déjà dans l'URL, <Link> ramène en haut de page au lieu de la section. */}
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={NAV_LINK}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          {/* Ancre en <a> natif : <Link> ramène en haut de page si elle est déjà dans l'URL. */}
          <a
            href={localePath(locale, "/#infos")}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-sm font-medium text-sage-800"
          >
            <MapPin aria-hidden="true" className="size-4" />
            {contact.locality}
          </a>
          <BookingLink booking={booking} className={cn(buttonVariants({ size: "sm" }))}>
            {copy.cta.bookShort}
          </BookingLink>
          {languages.length > 1 && <LanguageSwitcher current={locale} options={languages} label={copy.languages.label} pages={pages} />}
          <MobileMenu home={home} links={nav} labels={copy.menu}>
            {languages.length > 1 && (
              <LanguageSwitcher current={locale} options={languages} label={copy.languages.label} pages={pages} variant="inline" />
            )}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
