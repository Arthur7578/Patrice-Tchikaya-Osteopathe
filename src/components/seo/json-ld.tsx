import type { Graph, Thing, WithContext } from "schema-dts";

/** Balise JSON-LD rendue côté serveur. Échappe "<" (anti-XSS, recommandation Next.js). */
export function JsonLd({ data }: { data: Graph | WithContext<Thing> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
