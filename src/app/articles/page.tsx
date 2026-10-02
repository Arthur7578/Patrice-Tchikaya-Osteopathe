import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCards } from "@/components/content/page-cards";
import { BackToHome } from "@/components/layout/back-to-home";
import { JsonLd } from "@/components/seo/json-ld";
import { COPY } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { publishedPages } from "@/lib/content/published";
import { buildArticlesGraph } from "@/lib/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const { contact } = await getSiteContent();
  return {
    title: COPY.articles.metaTitle,
    description: COPY.articles.metaDescription(contact.locality),
    alternates: { canonical: "/articles" },
  };
}

/** Liste de toutes les pages détaillées publiées (motifs et pages d'information), liée depuis le pied de page. */
export default async function ArticlesPage() {
  const content = await getSiteContent();
  const pages = publishedPages(content);
  // Aucune page publiée : rien à lister, l'adresse n'existe pas (comme une page motif non validée).
  if (pages.length === 0) notFound();
  const meta = { title: COPY.articles.title, description: COPY.articles.metaDescription(content.contact.locality) };

  return (
    <main id="contenu">
      <JsonLd data={buildArticlesGraph(pages, meta)} />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl">{COPY.articles.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-pretty text-slate-600">{COPY.articles.intro(content.contact.locality)}</p>
        <div className="mt-10">
          <PageCards entries={pages} />
        </div>
        <BackToHome className="mt-12" />
      </div>
    </main>
  );
}
