/**
 * Réécrit src/lib/content/fallback.ts d'après Notion, si Notion est « au calme » : aucune ligne modifiée depuis
 * moins de FALLBACK_SYNC_BUFFER_DAYS jours (3 par défaut), pour ne pas figer une erreur qu'on corrige encore.
 * Usage : npm run fallback:sync   (lit NOTION_TOKEN depuis l'environnement ou .env.local)
 * Sortie : « status » dans $GITHUB_OUTPUT (wait | none | changed) et, si changed, le résumé dans $FALLBACK_SYNC_SUMMARY
 * (défaut fallback-sync-summary.md). N'échoue que si Notion est illisible.
 */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { NOTION_DATABASES, type NotionDatabaseKey } from "@/config/site";
import { contentDrift } from "@/lib/content/drift";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import { recentEdits, serializeFallback, toSnapshot, type RowEdit } from "@/lib/content/fallback-sync";
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent, queryDatabase } from "@/lib/notion/fetch-content";

const FILE = "src/lib/content/fallback.ts";

function finish(status: "wait" | "none" | "changed"): never {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `status=${status}\n`);
  process.exit(0);
}

async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error("✗ NOTION_TOKEN absent.");
    process.exit(1);
  }
  const bufferDays = Number(process.env.FALLBACK_SYNC_BUFFER_DAYS ?? 3);
  if (!Number.isFinite(bufferDays) || bufferDays < 0) {
    console.error(`✗ FALLBACK_SYNC_BUFFER_DAYS invalide : « ${process.env.FALLBACK_SYNC_BUFFER_DAYS} ».`);
    process.exit(1);
  }
  const notion = createNotionClient(token);

  const edits: RowEdit[] = [];
  for (const database of Object.keys(NOTION_DATABASES) as NotionDatabaseKey[]) {
    for (const row of await queryDatabase(notion, NOTION_DATABASES[database])) {
      edits.push({ database, id: row.id, lastEdited: row.last_edited_time });
    }
  }
  const recent = recentEdits(edits, new Date(), bufferDays);
  if (recent.length > 0) {
    console.log(`⏳ ${recent.length} ligne(s) Notion modifiée(s) depuis moins de ${bufferDays} jours : synchronisation reportée.`);
    for (const row of recent.slice(0, 10)) console.log(`  - ${row.database} ${row.id} (${row.lastEdited})`);
    console.log(`::notice title=Synchronisation reportée::Notion modifié depuis moins de ${bufferDays} jours, nouvel essai à la prochaine échéance.`);
    finish("wait");
  }

  const { content } = await fetchSiteContent(notion);
  const next = serializeFallback(content);
  if (next === readFileSync(FILE, "utf8")) {
    console.log("✓ Contenu de secours déjà à jour avec Notion.");
    finish("none");
  }
  const drift = contentDrift(FALLBACK_CONTENT, toSnapshot(content));
  writeFileSync(FILE, next);
  const lines = drift.length > 0 ? drift.map((line) => `- ${line}`) : ["- (reformatage du fichier uniquement)"];
  writeFileSync(
    process.env.FALLBACK_SYNC_SUMMARY ?? "fallback-sync-summary.md",
    [
      `Le contenu de secours (\`fallback.ts\`) retarde sur Notion de ${drift.length} écart(s). Le fichier est régénéré tel que Notion le donne ;`,
      `aucune ligne Notion n'avait été modifiée depuis plus de ${bufferDays} jours à la lecture.`,
      "",
      "**Écarts (secours → Notion)**",
      "",
      ...lines.slice(0, 60),
      ...(lines.length > 60 ? [`- … et ${lines.length - 60} autre(s)`] : []),
      "",
      "**À relire** : c'est du contenu éditorial qui entre dans le dépôt (règle 2). Lint, typecheck, tests et build ont été lancés par le workflow sur ce contenu avant l'ouverture de cette PR.",
      "",
    ].join("\n"),
  );
  console.log(`✓ fallback.ts réécrit (${drift.length} écart(s)).`);
  finish("changed");
}

main().catch((error) => {
  console.error("✗ Échec de la synchronisation :", error instanceof Error ? error.message : error);
  process.exit(1);
});
