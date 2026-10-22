import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCards } from "@/components/content/page-cards";
import { BackToHome } from "@/components/layout/back-to-home";
import { JsonLd } from "@/components/seo/json-ld";
import { localeAlternates } from "@/config/i18n";
import { getCopy } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { routeLocale } from "@/lib/i18n/route-locale";
import { publishedPages } from "@/lib/content/published";
import { buildArticlesGraph } from "@/lib/seo/json-ld";

export async function generateMetadata({ params }: PageProps<"/[locale]/articles">): Promise<Metadata> {
  const { contact, locale } = await getSiteContent(await routeLocale(params));
  const copy = getCopy(locale);
  return {
    title: copy.articles.metaTitle,
    description: copy.articles.metaDescription(contact.locality),
    alternates: localeAlternates(locale, "/articles"),
  };
}

/** Liste de toutes les pages détaillées publiées (motifs et pages d'information), liée depuis le pied de page. */
export default async function ArticlesPage({ params }: PageProps<"/[locale]/articles">) {
  const content = await getSiteContent(await routeLocale(params));
  const copy = getCopy(content.locale);
  const pages = publishedPages(content);
  // Aucune page publiée : rien à lister, l'adresse n'existe pas (comme une page motif non validée).
  if (pages.length === 0) notFound();
  const meta = { title: copy.articles.title, description: copy.articles.metaDescription(content.contact.locality) };

  return (
    <main id="contenu">
      <JsonLd data={buildArticlesGraph(content.locale, pages, meta)} />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl">{copy.articles.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-pretty text-slate-600">{copy.articles.intro(content.contact.locality)}</p>
        <div className="mt-10">
          <PageCards locale={content.locale} entries={pages} />
        </div>
        <BackToHome locale={content.locale} className="mt-12" />
      </div>
    </main>
  );
}
