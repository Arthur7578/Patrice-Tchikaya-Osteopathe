/**
 * Vérifie l'accès Notion + la qualité du contenu, sans lancer Next.
 * Usage : npm run notion:check   (lit NOTION_TOKEN depuis .env.local)
 */
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent } from "@/lib/notion/fetch-content";

async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error("✗ NOTION_TOKEN absent (.env.local).");
    process.exit(1);
  }
  try {
    const { content, warnings } = await fetchSiteContent(createNotionClient(token));
    console.log(`✓ Notion OK — ${content.motifs.length} motifs, ${content.reviews.length} avis, ${content.faq.length} questions FAQ`);
    for (const [slot, img] of Object.entries(content.images)) {
      console.log(`  image ${slot}: ${img.src ? "OK" : "placeholder"} — alt « ${img.alt} »`);
    }
    if (warnings.length === 0) console.log("✓ Aucun avertissement");
    for (const w of warnings) console.warn(`⚠ ${w}`);
  } catch (error) {
    console.error("✗ Échec de lecture Notion :", error instanceof Error ? error.message : error);
    console.error("  → L'intégration est-elle connectée à la page « Site web Ostéopathie Dudelange » ?");
    process.exit(1);
  }
}

void main();
