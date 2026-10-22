import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/i18n";

/** Langue d'une route `[locale]`, validée (le proxy n'y envoie que des langues publiées) ; sinon 404. */
export async function routeLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

