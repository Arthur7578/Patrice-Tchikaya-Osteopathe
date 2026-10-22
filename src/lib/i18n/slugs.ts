import { DEFAULT_LOCALE, type Locale } from "@/config/i18n";
import { normalizeSlug } from "@/lib/content/parse";
import type { SlugRecord, SlugStore } from "./slug-store";
import type { TextBatch } from "./translate";

/** Slugs d'une page : adresse actuelle dans chaque langue, et anciennes adresses (redirigées vers l'actuelle). */
export type PageSlugs = { slugs: Record<Locale, string>; aliases: Record<Locale, string[]> };

/** Slugs de chaque page publiée, par slug français actuel. */
export type SlugMap = Map<string, PageSlugs>;

export type SlugPage = { pageKey: string; frSlug: string };

type Options = {
  pages: SlugPage[];
  locales: readonly Locale[]; // toutes les langues publiées (le français compris)
  store: SlugStore;
  translate: (batch: TextBatch, locale: Locale) => Promise<TextBatch>;
  reserved: ReadonlySet<string>;
};

/** Enregistrement retenu pour (page, slug français, langue) : le plus ancien (deux créations simultanées : la première gagne). */
function current(records: SlugRecord[], page: SlugPage, locale: Locale): SlugRecord | undefined {
  return records
    .filter((r) => r.pageKey === page.pageKey && r.frSlug === page.frSlug && r.locale === locale)
    .sort((a, b) => a.createdAt - b.createdAt || a.slug.localeCompare(b.slug))[0];
}

/**
 * Slugs traduits, figés : chaque slug est traduit UNE fois (à la première publication de la page dans la langue, ou
 * quand son slug français change), enregistré dans le stockage permanent, puis relu tel quel ; une nouvelle traduction
 * du contenu ne change jamais une adresse. Un slug traduit est unique dans sa langue (suffixe « -2 » sinon), ne reprend
 * ni une route du site ni le slug français d'une autre page. Anciennes adresses d'une page : ses slugs traduits
 * précédents, ses anciens slugs français, et son slug français sous les autres langues (« /de/osteopathie-du-sport »).
 */
export async function resolveSlugs({ pages, locales, store, translate, reserved }: Options): Promise<SlugMap> {
  const translated = locales.filter((l) => l !== DEFAULT_LOCALE);
  let records = await store.list();
  const missing = (rs: SlugRecord[]) => translated.flatMap((locale) => pages.filter((p) => !current(rs, p, locale)).map((page) => ({ page, locale })));

  if (missing(records).length > 0) {
    // Avant de créer : relecture sans cache (un autre processus a peut-être déjà enregistré ces slugs).
    records = await store.list({ fresh: true });
    const todo = missing(records);
    for (const locale of translated) {
      const forLocale = todo.filter((t) => t.locale === locale).map((t) => t.page);
      if (forLocale.length === 0) continue;
      const batch = Object.fromEntries(forLocale.map((p) => [`slug.${p.frSlug}`, p.frSlug.replace(/-/g, " ")]));
      const out = await translate(batch, locale);
      // Déjà pris dans cette langue : tout slug enregistré d'une autre page, et les slugs français des autres pages.
      const taken = new Set([...reserved, ...records.filter((r) => r.locale === locale).map((r) => r.slug)]);
      for (const page of forLocale) {
        const others = new Set(pages.filter((p) => p.pageKey !== page.pageKey).map((p) => p.frSlug));
        const translatedSlug = out[`slug.${page.frSlug}`];
        // Pas de traduction (refusée 3 fois) : rien n'est figé, la page garde son slug français et sera redemandée.
        if (translatedSlug === undefined) continue;
        const base = normalizeSlug(translatedSlug) ?? page.frSlug;
        let slug = base;
        for (let n = 2; (taken.has(slug) && !ownedBy(records, slug, locale, page)) || others.has(slug); n++) slug = `${base}-${n}`;
        taken.add(slug);
        await store.create({ pageKey: page.pageKey, frSlug: page.frSlug, locale, slug });
      }
    }
    // Relecture après création : tous les processus retiennent le même enregistrement (le plus ancien).
    records = await store.list({ fresh: true });
  }

  const map: SlugMap = new Map();
  for (const page of pages) {
    const slugs = Object.fromEntries(locales.map((l) => [l, l === DEFAULT_LOCALE ? page.frSlug : (current(records, page, l)?.slug ?? page.frSlug)])) as Record<Locale, string>;
    const own = records.filter((r) => r.pageKey === page.pageKey);
    const oldFrSlugs = own.map((r) => r.frSlug);
    const aliases = Object.fromEntries(
      locales.map((l) => {
        const candidates = [...oldFrSlugs, ...(l === DEFAULT_LOCALE ? [] : [page.frSlug, ...own.filter((r) => r.locale === l).map((r) => r.slug)])];
        return [l, [...new Set(candidates)].filter((s) => s !== slugs[l])];
      }),
    ) as Record<Locale, string[]>;
    map.set(page.frSlug, { slugs, aliases });
  }
  return map;
}

/** Le slug appartient déjà à cette page dans cette langue (relance après une création interrompue). */
const ownedBy = (records: SlugRecord[], slug: string, locale: Locale, page: SlugPage) =>
  records.some((r) => r.slug === slug && r.locale === locale && r.pageKey === page.pageKey);
