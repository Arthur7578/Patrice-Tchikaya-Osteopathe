import { CalendarDays, ChevronRight, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BackToHome } from "@/components/layout/back-to-home";
import { BookingLink } from "@/components/booking/booking-link";
import { ContentBlocks } from "@/components/content/content-blocks";
import { PageCards } from "@/components/content/page-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_LOCALE, isLocale, localeAlternates, localePath, LOCALE_META, pagePaths, type Locale } from "@/config/i18n";
import { RESERVED_SLUGS } from "@/config/site";
import { getCopy } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { publishedPages } from "@/lib/content/published";
import { routeLocale } from "@/lib/i18n/route-locale";
import { MOTIF_ICONS, type MotifIconName } from "@/lib/icons";
import { buildGuideGraph, buildMotifGraph } from "@/lib/seo/json-ld";
import { guideMeta, motifMeta } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

/**
 * Adresse inconnue au build : rendue à la demande, puis 404 (notFound ci-dessous) avec la page « Page introuvable »
 * de sa langue. Avec `false`, Next répondait par la 404 globale (layout racine sous [locale] : voir
 * global-not-found.tsx), sans en-tête ni prise de rendez-vous. Le contenu est lu dans le cache (au plus une lecture
 * Notion par minute, traductions en cache) : une URL aléatoire de robot ne coûte pas d'appel à l'API. Voir DECISIONS.
 */
export const dynamicParams = true;

/**
 * Tous les motifs et guides, pas seulement ceux déjà publiés (générés au build) ; un motif ajouté ensuite dans
 * Notion est rendu à sa première visite. Tant qu'une page n'est pas publiée, son adresse renvoie une 404
 * (notFound ci-dessous). Voir docs/DECISIONS.md.
 */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const { motifs, guides } = await getSiteContent(isLocale(params.locale) ? params.locale : DEFAULT_LOCALE);
  return [...motifs, ...guides].filter((m) => !RESERVED_SLUGS.has(m.slug)).map((m) => ({ slug: m.slug }));
}

/**
 * Motif ou guide dont la page est publiée (case Page_Validée cochée + seuil de mots), sinon null.
 * Les deux ont la même forme ; `kind` ne change que le titre, le JSON-LD et les liens « à lire aussi ».
 */
async function findMotifPage(locale: Locale, slug: string) {
  const content = await getSiteContent(locale);
  const motif = content.motifs.find((m) => m.slug === slug);
  const guide = motif ? undefined : content.guides.find((g) => g.slug === slug);
  const entry = motif ?? guide;
  return entry?.page ? { content, motif: entry, page: entry.page, kind: motif ? ("motif" as const) : ("guide" as const) } : null;
}

/**
 * Ancienne adresse d'une page publiée (slug français sous une autre langue, ancien slug traduit ou ancien slug
 * français : voir src/lib/i18n/slugs.ts) : chemin actuel de la page, sinon null.
 */
async function currentPathOf(locale: Locale, slug: string): Promise<string | null> {
  const content = await getSiteContent(locale);
  const entry = [...content.motifs, ...content.guides].find((m) => m.page && m.aliases?.includes(slug));
  return entry ? localePath(locale, `/${entry.slug}`) : null;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const found = await findMotifPage(await routeLocale(params), (await params).slug);
  if (!found) return {};
  const { content, motif, kind } = found;
  const { path, title, description } = (kind === "motif" ? motifMeta : guideMeta)(content, motif);
  const copy = getCopy(content.locale);
  const siteName = `${content.practitioner.name} – ${content.practitioner.title}`;
  // openGraph / twitter d'une page remplacent ceux du layout en entier : l'image de partage du site
  // (app/[locale]/opengraph-image.tsx) doit donc être redonnée ici, sinon les pages motifs n'en ont pas.
  const image = {
    url: localePath(content.locale, "/opengraph-image"),
    width: 1200,
    height: 630,
    alt: copy.meta.imageAlt(content.practitioner.name, content.practitioner.title, content.contact.locality),
  };
  const ogLocale = LOCALE_META[content.locale].ogLocale;
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(content.locale, pagePaths(motif)),
    openGraph: { type: "article", locale: ogLocale, siteName, url: path, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function MotifPage({ params }: PageProps<"/[locale]/[slug]">) {
  const locale = await routeLocale(params);
  const { slug } = await params;
  const found = await findMotifPage(locale, slug);
  if (!found) {
    const moved = await currentPathOf(locale, slug);
    if (moved) permanentRedirect(moved); // 308 : l'adresse a changé, les liens et le classement suivent
    notFound();
  }
  const { content, motif, page, kind } = found;
  const copy = getCopy(content.locale);
  const { contact, booking, consultation } = content;
  const meta = (kind === "motif" ? motifMeta : guideMeta)(content, motif);
  // Maillage interne : une seule liste, toutes les autres pages publiées (motifs puis pages d'information).
  const related = publishedPages(content).filter((entry) => entry.slug !== motif.slug);
  const Icon = MOTIF_ICONS[motif.icon as MotifIconName];

  return (
    <main id="contenu">
      <JsonLd data={(kind === "motif" ? buildMotifGraph : buildGuideGraph)(content, motif, page, meta)} />

      <article className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 md:pb-24 lg:px-8">
        <nav aria-label={copy.motifPage.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <li>
              <Link href={localePath(content.locale, "/")} className="underline-offset-4 hover:text-sage-700 hover:underline">
                {copy.motifPage.home}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="font-medium text-slate-700">
              {motif.title}
            </li>
          </ol>
        </nav>

        <header className="mt-8">
          <span className="grid size-12 place-items-center rounded-xl bg-sage-100 text-sage-700">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl">
            {kind === "motif" ? copy.motifPage.h1(motif.title, contact.locality) : motif.title}
          </h1>
          <p className="mt-5 text-lg text-pretty text-slate-600">{motif.description}</p>
          {/* id="hero-cta" : repère de la barre d'action mobile (visible quand ces boutons sortent de l'écran). */}
          <div id="hero-cta" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookingLink
              booking={booking}
              className={cn(buttonVariants({ size: "lg" }), "max-sm:whitespace-normal max-sm:text-center")}
            >
              <CalendarDays aria-hidden="true" />
              {copy.cta.book}
            </BookingLink>
            <a href={`tel:${contact.phoneE164}`} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Phone aria-hidden="true" />
              {copy.cta.call(contact.phoneDisplay)}
            </a>
          </div>
        </header>

        <div className="mt-12 border-t border-slate-200 pt-2">
          <ContentBlocks locale={content.locale} blocks={page.blocks} />
        </div>

        <section aria-labelledby="motif-cta-title" className="mt-16 rounded-3xl bg-sage-700 p-6 text-white sm:p-8 md:p-10">
          <h2 id="motif-cta-title" className="text-2xl font-bold tracking-tight text-balance">
            {copy.motifPage.ctaTitle(contact.locality)}
          </h2>
          <p className="mt-3 text-pretty text-sage-50">{copy.motifPage.ctaText(consultation.durationLabel)}</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <BookingLink
              booking={booking}
              className={cn(buttonVariants({ size: "lg" }), "bg-white text-sage-800 hover:bg-sage-50 focus-visible:outline-white")}
            >
              <CalendarDays aria-hidden="true" />
              {/* Libellé court sur mobile : la carte est trop étroite pour « … en ligne » sur une ligne. */}
              <span className="sm:hidden">{copy.cta.bookMobile}</span>
              <span className="hidden sm:inline">{copy.cta.book}</span>
            </BookingLink>
            <a
              href={`tel:${contact.phoneE164}`}
              className="inline-flex items-center gap-2 font-semibold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Phone aria-hidden="true" className="size-4" />
              {copy.cta.call(contact.phoneDisplay)}
            </a>
          </div>
        </section>

        <BackToHome locale={content.locale} className="mt-10" />
      </article>

      {related.length > 0 && (
        <section aria-labelledby="a-lire-aussi-title" className="border-t border-slate-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 id="a-lire-aussi-title" className="text-2xl font-bold tracking-tight text-ink">
              {copy.motifPage.related}
            </h2>
            <div className="mt-8">
              <PageCards locale={content.locale} entries={related} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
