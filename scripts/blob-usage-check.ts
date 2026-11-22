/**
 * Contrôle quotidien des opérations Vercel Blob « avancées » (workflow `.github/workflows/blob-usage.yml`).
 * Usage : VERCEL_TOKEN=… VERCEL_TEAM_ID=team_… VERCEL_PROJECT_ID=prj_… npm run blob:check
 * Écrit le rapport (Markdown) sur la sortie et dans BLOB_REPORT_FILE s'il est défini.
 * Code de sortie : 0 sous le seuil, 1 dépassement le dernier jour terminé, 2 erreur (API, variable manquante).
 * BLOB_DEBUG=1 : affiche aussi 3 lignes brutes de l'API par service Blob (sans le jeton), pour caler le script.
 * BLOB_FORCE_ALERT=1 : sortie 1 même sous le seuil, pour tester l'alerte (rapport marqué « TEST »).
 */
import { writeFileSync } from "node:fs";
import {
  blobDays,
  countDeployments,
  diagnoseToken,
  fetchCharges,
  fetchDeploymentTimes,
  judgeDay,
  missingEnvMessage,
  monthToDate,
  renderReport,
} from "@/lib/monitoring/blob-usage";

const DAYS = 9; // une semaine affichée + marge pour le décalage de fuseau et le délai des données

async function main() {
  const missing = missingEnvMessage(process.env);
  if (missing) throw new Error(missing);
  const { VERCEL_TOKEN: token = "", VERCEL_TEAM_ID: teamId = "", VERCEL_PROJECT_ID: projectId = "" } = process.env;
  console.log(`Équipe ${teamId}, projet ${projectId}, jeton présent (${token.length} caractères, valeur masquée).`);

  const now = new Date();
  const to = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - DAYS));

  console.log(`Période demandée : ${from.toISOString()} → ${to.toISOString()}.`);
  const [charges, deployments] = await Promise.allSettled([
    fetchCharges(fetch, token, teamId, from, to),
    fetchDeploymentTimes(fetch, token, teamId, projectId, new Date(from.getTime() - 86_400_000)),
  ]);
  // Chaque appel est journalisé à part : un échec de la facturation n'efface plus le résultat des déploiements.
  console.log(
    deployments.status === "fulfilled"
      ? `Déploiements : OK (${deployments.value.length}).`
      : `Déploiements : échec, ${String(deployments.reason)}`,
  );
  if (charges.status === "rejected") {
    console.log(`Facturation : échec. Diagnostic du jeton : ${await diagnoseToken(fetch, token, teamId)}`);
    throw charges.reason;
  }
  if (deployments.status === "rejected") throw deployments.reason;
  const rows = charges.value;
  const deployTimes = deployments.value;
  const blobRows = rows.filter((r) => r.ServiceName?.startsWith("Blob ")).length;
  console.log(`Facturation : OK (${rows.length} lignes, dont ${blobRows} Blob).`);
  if (process.env.BLOB_DEBUG === "1") {
    for (const service of ["Blob Advanced Operations", "Blob Simple Operations"]) {
      const sample = rows.filter((r) => r.ServiceName === service).slice(-3);
      console.log(`Lignes brutes « ${service} » (${sample.length} dernières) :\n${JSON.stringify(sample, null, 1)}`);
    }
  }
  const days = blobDays(rows, now);
  if (days.length === 0) console.log("::warning::Aucun jour terminé avec des lignes Blob : rien à juger.");
  const verdicts = days.map((d) => judgeDay(d, countDeployments(deployTimes, d.start, d.end)));
  const forced = process.env.BLOB_FORCE_ALERT === "1";
  const report = `${forced ? "**TEST d'alerte** (lancé à la main, pas un vrai dépassement).\n\n" : ""}${renderReport(verdicts, monthToDate(days))}`;

  console.log(report);
  if (process.env.BLOB_REPORT_FILE) writeFileSync(process.env.BLOB_REPORT_FILE, report);
  if (forced || verdicts.at(-1)?.over) process.exit(1);
}

main().catch((error: unknown) => {
  const message = `Contrôle impossible : ${error instanceof Error ? error.message : String(error)}`;
  // « ::error:: » : GitHub affiche le message en tête de l'exécution (annotation), pas seulement dans le journal.
  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
  if (process.env.BLOB_REPORT_FILE) writeFileSync(process.env.BLOB_REPORT_FILE, message);
  process.exit(2);
});
