/**
 * Vérifie l'accès Notion + la qualité du contenu, sans lancer Next.
 * Usage : npm run notion:check   (lit NOTION_TOKEN depuis .env.local)
 */
import { contentDrift } from "@/lib/content/drift";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
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
    // Pages motifs (phase 9) : publiées si Page_Validée est cochée et le texte assez long (sinon voir ⚠).
    for (const m of content.motifs) {
      console.log(`  page /${m.slug}: ${m.page ? `publiée (${m.page.wordCount} mots)` : "non publiée"}`);
    }
    if (warnings.length === 0) console.log("✓ Aucun avertissement");
    for (const w of warnings) console.warn(`⚠ ${w}`);
    // Le contenu de secours (fallback.ts) sert au dev et à la CI : s'il est en retard sur Notion, ils testent un
    // contenu périmé. Avertissement seulement, jamais un échec : le site en ligne lit Notion, pas ce fichier.
    const drift = contentDrift(FALLBACK_CONTENT, content);
    if (drift.length === 0) console.log("✓ Contenu de secours (fallback.ts) à jour avec Notion");
    else {
      const summary = `Contenu de secours en retard sur Notion (${drift.length} écart${drift.length > 1 ? "s" : ""}) : rattrapé chaque mois par la PR « Synchronisation du contenu de secours » (ou npm run fallback:sync)`;
      console.warn(`⚠ ${summary}`);
      for (const line of drift.slice(0, 25)) console.warn(`  - ${line}`);
      if (drift.length > 25) console.warn(`  … et ${drift.length - 25} autre(s)`);
      if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Contenu de secours en retard::${summary}`);
    }
  } catch (error) {
    console.error("✗ Échec de lecture Notion :", error instanceof Error ? error.message : error);
    console.error("  → L'intégration est-elle connectée à la page « Site web Ostéopathie Dudelange » ?");
    process.exit(1);
  }
}

void main();
