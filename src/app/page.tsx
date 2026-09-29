import type { Metadata } from "next";
import { Access } from "@/components/sections/access";
import { About } from "@/components/sections/about";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Motifs } from "@/components/sections/motifs";
import { PracticalInfo } from "@/components/sections/practical-info";
import { Reviews } from "@/components/sections/reviews";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteContent } from "@/lib/content/get-site-content";
import { getGoogleRating } from "@/lib/google/get-google-rating";
import { buildHomeGraph } from "@/lib/seo/json-ld";
import { homeMeta } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  const { title, description } = homeMeta(c);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { url: "/", title, description },
    twitter: { title, description },
  };
}

export default async function Home() {
  // Note Google en direct (si configurée) prioritaire sur Note_Google (Notion). Appelée ici seulement :
  // l'accueil est la seule page qui affiche la note, et chaque appel à l'API Google est facturable.
  const [notionContent, googleRating] = await Promise.all([getSiteContent(), getGoogleRating()]);
  const content = googleRating ? { ...notionContent, rating: googleRating } : notionContent;
  const meta = homeMeta(content);

  return (
    <main id="contenu">
      <JsonLd data={buildHomeGraph(content, meta)} />
      <Hero content={content} />
      <About content={content} />
      <Motifs content={content} />
      <Reviews content={content} />
      <Faq content={content} />
      <PracticalInfo content={content} />
      <Access content={content} />
    </main>
  );
}
