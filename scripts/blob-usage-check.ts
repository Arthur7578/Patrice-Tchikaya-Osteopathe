/**
 * Contrôle quotidien des opérations Vercel Blob « avancées » (workflow `.github/workflows/blob-usage.yml`).
 * Usage : VERCEL_TOKEN=… VERCEL_TEAM_ID=team_… VERCEL_PROJECT_ID=prj_… npm run blob:check
 * Écrit le rapport (Markdown) sur la sortie et dans BLOB_REPORT_FILE s'il est défini.
 * Code de sortie : 0 sous le seuil, 1 dépassement le dernier jour terminé, 2 erreur (API, variable manquante).
 */
import { writeFileSync } from "node:fs";
import {
  blobDays,
  countDeployments,
  fetchCharges,
  fetchDeploymentTimes,
  judgeDay,
  monthToDate,
  renderReport,
} from "@/lib/monitoring/blob-usage";

const DAYS = 9; // une semaine affichée + marge pour le décalage de fuseau et le délai des données

async function main() {
  const { VERCEL_TOKEN: token, VERCEL_TEAM_ID: teamId, VERCEL_PROJECT_ID: projectId } = process.env;
  if (!token || !teamId || !projectId) throw new Error("VERCEL_TOKEN, VERCEL_TEAM_ID et VERCEL_PROJECT_ID sont requis");

  const now = new Date();
  const to = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - DAYS));

  const [rows, deployTimes] = await Promise.all([
    fetchCharges(fetch, token, teamId, from, to),
    fetchDeploymentTimes(fetch, token, teamId, projectId, new Date(from.getTime() - 86_400_000)),
  ]);
  const days = blobDays(rows, now);
  const verdicts = days.map((d) => judgeDay(d, countDeployments(deployTimes, d.start, d.end)));
  const report = renderReport(verdicts, monthToDate(days));

  console.log(report);
  if (process.env.BLOB_REPORT_FILE) writeFileSync(process.env.BLOB_REPORT_FILE, report);
  if (verdicts.at(-1)?.over) process.exit(1);
}

main().catch((error: unknown) => {
  const message = `Contrôle impossible : ${error instanceof Error ? error.message : String(error)}`;
  console.error(message);
  if (process.env.BLOB_REPORT_FILE) writeFileSync(process.env.BLOB_REPORT_FILE, message);
  process.exit(2);
});
