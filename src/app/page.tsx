import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Motifs } from "@/components/sections/motifs";
import { PracticalInfo } from "@/components/sections/practical-info";
import { Reviews } from "@/components/sections/reviews";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteContent } from "@/lib/content/get-site-content";
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
  const content = await getSiteContent();
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
    </main>
  );
}
