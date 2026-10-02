import { CalendarDays, ChevronRight, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackToHome } from "@/components/layout/back-to-home";
import { BookingLink } from "@/components/booking/booking-link";
import { ContentBlocks } from "@/components/content/content-blocks";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { RESERVED_SLUGS } from "@/config/site";
import { COPY } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";
import { MOTIF_ICONS, type MotifIconName } from "@/lib/icons";
import { buildGuideGraph, buildMotifGraph } from "@/lib/seo/json-ld";
import { guideMeta, motifMeta } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

/** Seules les adresses connues au build existent : toute autre URL de premier niveau renvoie une 404. */
export const dynamicParams = false;

/**
 * Tous les motifs et guides, pas seulement ceux déjà publiés : une page validée plus tard dans Notion
 * devient une page par simple revalidation, sans redéploiement ; tant qu'elle ne l'est pas, son adresse
 * renvoie une 404 (notFound ci-dessous). Voir docs/DECISIONS.md.
 */
export async function generateStaticParams() {
  const { motifs, guides } = await getSiteContent();
  return [...motifs, ...guides].filter((m) => !RESERVED_SLUGS.has(m.slug)).map((m) => ({ slug: m.slug }));
}

/**
 * Motif ou guide dont la page est publiée (case Page_Validée cochée + seuil de mots), sinon null.
 * Les deux ont la même forme ; `kind` ne change que le titre, le JSON-LD et les liens « à lire aussi ».
 */
async function findMotifPage(slug: string) {
  const content = await getSiteContent();
  const motif = content.motifs.find((m) => m.slug === slug);
  const guide = motif ? undefined : content.guides.find((g) => g.slug === slug);
  const entry = motif ?? guide;
  return entry?.page ? { content, motif: entry, page: entry.page, kind: motif ? ("motif" as const) : ("guide" as const) } : null;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const found = await findMotifPage((await params).slug);
  if (!found) return {};
  const { content, motif, kind } = found;
  const { path, title, description } = (kind === "motif" ? motifMeta : guideMeta)(content, motif);
  const siteName = `${content.practitioner.name} – ${content.practitioner.title}`;
  // openGraph / twitter d'une page remplacent ceux du layout en entier : l'image de partage du site
  // (app/opengraph-image.tsx) doit donc être redonnée ici, sinon les pages motifs n'en ont pas.
  const image = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${content.practitioner.name}, ${content.practitioner.title} à ${content.contact.locality}`,
  };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", locale: "fr_LU", siteName, url: path, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function MotifPage({ params }: PageProps<"/[slug]">) {
  const found = await findMotifPage((await params).slug);
  if (!found) notFound();
  const { content, motif, page, kind } = found;
  const { contact, booking, consultation } = content;
  const meta = (kind === "motif" ? motifMeta : guideMeta)(content, motif);
  // Maillage interne : une seule liste, toutes les autres pages publiées (motifs puis pages d'information).
  const related = [...content.motifs, ...content.guides].filter((entry) => entry.page && entry.slug !== motif.slug);
  const Icon = MOTIF_ICONS[motif.icon as MotifIconName];

  return (
    <main id="contenu">
      <JsonLd data={(kind === "motif" ? buildMotifGraph : buildGuideGraph)(content, motif, page, meta)} />

      <article className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 md:pb-24 lg:px-8">
        <nav aria-label={COPY.motifPage.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <li>
              <Link href="/" className="underline-offset-4 hover:text-sage-700 hover:underline">
                {COPY.motifPage.home}
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
            {kind === "motif" ? COPY.motifPage.h1(motif.title, contact.locality) : motif.title}
          </h1>
          <p className="mt-5 text-lg text-pretty text-slate-600">{motif.description}</p>
          {/* id="hero-cta" : repère de la barre d'action mobile (visible quand ces boutons sortent de l'écran). */}
          <div id="hero-cta" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookingLink
              booking={booking}
              className={cn(buttonVariants({ size: "lg" }), "max-sm:whitespace-normal max-sm:text-center")}
            >
              <CalendarDays aria-hidden="true" />
              {COPY.cta.book}
            </BookingLink>
            <a href={`tel:${contact.phoneE164}`} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Phone aria-hidden="true" />
              {COPY.cta.call(contact.phoneDisplay)}
            </a>
          </div>
        </header>

        <div className="mt-12 border-t border-slate-200 pt-2">
          <ContentBlocks blocks={page.blocks} />
        </div>

        <section aria-labelledby="motif-cta-title" className="mt-16 rounded-3xl bg-sage-700 p-6 text-white sm:p-8 md:p-10">
          <h2 id="motif-cta-title" className="text-2xl font-bold tracking-tight text-balance">
            {COPY.motifPage.ctaTitle(contact.locality)}
          </h2>
          <p className="mt-3 text-pretty text-sage-50">{COPY.motifPage.ctaText(consultation.durationLabel)}</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <BookingLink
              booking={booking}
              className={cn(buttonVariants({ size: "lg" }), "bg-white text-sage-800 hover:bg-sage-50 focus-visible:outline-white")}
            >
              <CalendarDays aria-hidden="true" />
              {/* Libellé court sur mobile : la carte est trop étroite pour « … en ligne » sur une ligne. */}
              <span className="sm:hidden">{COPY.cta.bookMobile}</span>
              <span className="hidden sm:inline">{COPY.cta.book}</span>
            </BookingLink>
            <a
              href={`tel:${contact.phoneE164}`}
              className="inline-flex items-center gap-2 font-semibold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Phone aria-hidden="true" className="size-4" />
              {COPY.cta.call(contact.phoneDisplay)}
            </a>
          </div>
        </section>

        <BackToHome className="mt-10" />
      </article>

      {related.length > 0 && (
        <section aria-labelledby="a-lire-aussi-title" className="border-t border-slate-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 id="a-lire-aussi-title" className="text-2xl font-bold tracking-tight text-ink">
              {COPY.motifPage.related}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => {
                const OtherIcon = MOTIF_ICONS[other.icon as MotifIconName];
                return (
                  <li key={other.slug}>
                    <Link
                      href={`/${other.slug}`}
                      className="group flex h-full items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-sage-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700">
                        <OtherIcon aria-hidden="true" className="size-5" />
                      </span>
                      <span>
                        <span className="font-semibold text-ink group-hover:text-sage-700">{other.title}</span>
                        <span className="mt-1 block text-sm text-slate-600">{other.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
