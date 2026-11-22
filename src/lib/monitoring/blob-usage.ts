/**
 * Suivi des opérations Vercel Blob « avancées » (list, put…), quota Hobby de 2 000 par mois pour tout le compte.
 * Utilisé par `scripts/blob-usage-check.ts` (workflow `.github/workflows/blob-usage.yml`, docs/DECISIONS.md 21/11/2026).
 *
 * Sources (API REST Vercel, jeton `VERCEL_TOKEN`) :
 * - `GET /v1/billing/charges` : lignes FOCUS en JSONL, une par service, jour, région et projet ;
 *   les jours suivent le fuseau de Vercel (début à 08:00 UTC en hiver), pas le jour UTC.
 * - `GET /v6/deployments` : déploiements du projet (previews comprises : chaque build lit le store).
 */

export const BLOB_ADVANCED_SERVICE = "Blob Advanced Operations";
export const BLOB_SIMPLE_SERVICE = "Blob Simple Operations";
/** Prix déduit de la routine du 03/11 (5 à 5,3 $ le million), **non confirmé** : contre-vérification seulement. */
export const ADVANCED_UNIT_PRICE = 0.0000053;
export const API = "https://api.vercel.com";

/** Seuils par jour (demande d'Arthur) : au-delà, alerte. Un jour avec déploiement a droit aux lectures du build. */
export const DAILY_LIMIT = { withoutDeployment: 30, withDeployment: 80 } as const;

export type ChargeRow = {
  ServiceName?: string;
  ConsumedQuantity?: number | string | null;
  EffectiveCost?: number | string | null;
  ChargePeriodStart?: string;
  ChargePeriodEnd?: string;
  Tags?: Record<string, string> | null;
};

export type BlobDay = {
  start: string;
  end: string;
  /** Total du compte (le quota est commun à tous les projets). */
  total: number;
  /** Par nom de projet ; « (sans projet) » si la ligne n'en porte pas. */
  byProject: Record<string, number>;
  /** Opérations simples (lectures), tout le compte : indicatif. */
  simple: number;
  /** Coût effectif des opérations avancées ($) : sert à l'estimation de contre-vérification. */
  cost: number;
};

export type DayVerdict = BlobDay & { deployments: number; limit: number; over: boolean };

type Fetch = typeof fetch;

export function parseJsonl(text: string): ChargeRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChargeRow);
}

/** Jours terminés (fin ≤ maintenant), du plus ancien au plus récent. Un jour sans ligne Blob n'apparaît pas. */
export function blobDays(rows: ChargeRow[], now: Date): BlobDay[] {
  const days = new Map<string, BlobDay>();
  for (const row of rows) {
    const advanced = row.ServiceName === BLOB_ADVANCED_SERVICE;
    if (!advanced && row.ServiceName !== BLOB_SIMPLE_SERVICE) continue;
    if (!row.ChargePeriodStart || !row.ChargePeriodEnd || Date.parse(row.ChargePeriodEnd) > now.getTime()) continue;
    const quantity = Number(row.ConsumedQuantity ?? 0) || 0;
    const day = days.get(row.ChargePeriodStart) ?? {
      start: row.ChargePeriodStart,
      end: row.ChargePeriodEnd,
      total: 0,
      byProject: {},
      simple: 0,
      cost: 0,
    };
    days.set(row.ChargePeriodStart, day);
    if (!advanced) {
      day.simple += quantity;
      continue;
    }
    day.cost += Number(row.EffectiveCost ?? 0) || 0;
    const project = row.Tags?.ProjectName ?? "(sans projet)";
    day.total += quantity;
    day.byProject[project] = (day.byProject[project] ?? 0) + quantity;
  }
  return [...days.values()].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

/** Déploiements créés dans [début, fin). */
export function countDeployments(createdAt: number[], start: string, end: string): number {
  const from = Date.parse(start);
  const to = Date.parse(end);
  return createdAt.filter((t) => t >= from && t < to).length;
}

export function judgeDay(day: BlobDay, deployments: number): DayVerdict {
  const limit = deployments > 0 ? DAILY_LIMIT.withDeployment : DAILY_LIMIT.withoutDeployment;
  return { ...day, deployments, limit, over: day.total > limit };
}

/** Somme depuis le 1er du mois (UTC) du dernier jour : indicatif, le cycle de facturation Hobby peut différer. */
export function monthToDate(days: BlobDay[]): number {
  const last = days.at(-1);
  if (!last) return 0;
  const month = last.end.slice(0, 7);
  return days.filter((d) => d.end.slice(0, 7) === month).reduce((sum, d) => sum + d.total, 0);
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);
/** « JJ/MM » du jour Vercel (date UTC de sa fin moins un jour = date du jour en heure du Pacifique). */
const dayLabel = (v: BlobDay) => {
  const d = new Date(Date.parse(v.end) - 86_400_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Ligne de verdict (format du brief, plus la date et le seuil) : « Blob OK : ~N ops le JJ/MM, X builds (seuil S) »
 * ou « Blob : ~N ops avancées le JJ/MM, X builds, seuil dépassé (S) ». */
export function verdictLine(v: DayVerdict): string {
  return v.over
    ? `Blob : ~${fmt(v.total)} ops avancées le ${dayLabel(v)}, ${v.deployments} builds, seuil dépassé (${v.limit})`
    : `Blob OK : ~${fmt(v.total)} ops le ${dayLabel(v)}, ${v.deployments} builds (seuil ${v.limit})`;
}

export const DIAGNOSTIC_HINTS = [
  "Pistes : lectures `list()` de `src/lib/i18n/memory.ts` et `src/lib/i18n/slugs.ts` ;",
  "cache de données non persistant entre déploiements ; route `/api/revalidate` (docs/DECISIONS.md, 02/11/2026).",
].join(" ");

export function renderReport(verdicts: DayVerdict[], monthTotal: number): string {
  const latest = verdicts.at(-1);
  const lines = [
    "| Jour | Opérations avancées | Estimation par le coût | Opérations simples | Builds | Seuil | Détail par projet |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...verdicts.map((v) => {
      const detail = Object.entries(v.byProject)
        .sort(([, a], [, b]) => b - a)
        .map(([name, n]) => `${name} : ${fmt(n)}`)
        .join(", ");
      const estimate = fmt(v.cost / ADVANCED_UNIT_PRICE);
      return `| ${dayLabel(v)} | ${fmt(v.total)}${v.over ? " ⚠" : ""} | ~${estimate} | ${fmt(v.simple)} | ${v.deployments} | ${v.limit} | ${detail || "—"} |`;
    }),
    "",
    `Total depuis le 1er du mois (indicatif) : ${fmt(monthTotal)} / 2000.`,
    "Jours Vercel de 08:00 à 08:00 UTC (07:00 en été). Estimation par le coût : prix unitaire non confirmé, contre-vérification seulement.",
  ];
  if (!latest) return "Aucune ligne Blob sur la période : rien à juger.";
  const head = latest.over ? `**${verdictLine(latest)}**\n\n${DIAGNOSTIC_HINTS}` : verdictLine(latest);
  return [head, "", ...lines].join("\n");
}

const SECRET_HELP =
  "Créer le jeton : Vercel → Account Settings → Tokens (portée : l'équipe du site), puis GitHub → Settings → " +
  "Secrets and variables → Actions → onglet Secrets → New repository secret, nom exact VERCEL_TOKEN.";

/** Variables d'environnement manquantes, avec la marche à suivre ; null si tout est là. */
export function missingEnvMessage(env: Record<string, string | undefined>): string | null {
  const missing = ["VERCEL_TOKEN", "VERCEL_TEAM_ID", "VERCEL_PROJECT_ID"].filter((name) => !env[name]);
  if (missing.length === 0) return null;
  const help = missing.includes("VERCEL_TOKEN")
    ? ` Secret GitHub VERCEL_TOKEN absent ou vide (secret non créé, nom différent, ou créé ailleurs que dans les « Repository secrets » d'Actions). ${SECRET_HELP}`
    : " Identifiants écrits dans .github/workflows/blob-usage.yml (env).";
  return `variable(s) manquante(s) : ${missing.join(", ")}.${help}`;
}

/** Explication d'un code HTTP de l'API Vercel, pour les logs et l'issue. */
export function httpHint(status: number): string {
  if (status === 401) return `Jeton refusé (invalide, expiré ou supprimé). ${SECRET_HELP}`;
  if (status === 403)
    return "Jeton valide mais sans accès à cette équipe ou à cette donnée (portée du jeton, ou rôle sans accès à la facturation).";
  if (status === 404) return "Ressource introuvable (identifiant d'équipe ou de projet faux, ou données pas encore prêtes).";
  if (status === 429) return "Trop de requêtes : relancer plus tard.";
  if (status >= 500) return "Panne côté Vercel : relancer plus tard.";
  return "Réponse inattendue de l'API Vercel.";
}

async function getOk(fetchFn: Fetch, url: string, token: string): Promise<Response> {
  const res = await fetchFn(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`${new URL(url).pathname} : HTTP ${res.status} ${body} → ${httpHint(res.status)}`);
  }
  return res;
}

export async function fetchCharges(fetchFn: Fetch, token: string, teamId: string, from: Date, to: Date) {
  const q = new URLSearchParams({ teamId, from: from.toISOString(), to: to.toISOString() });
  const res = await getOk(fetchFn, `${API}/v1/billing/charges?${q}`, token);
  return parseJsonl(await res.text());
}

/** Dates de création des déploiements du projet depuis `since` (pagination par `pagination.next`). */
export async function fetchDeploymentTimes(
  fetchFn: Fetch,
  token: string,
  teamId: string,
  projectId: string,
  since: Date,
): Promise<number[]> {
  const times: number[] = [];
  let until: number | null = null;
  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ teamId, projectId, since: String(since.getTime()), limit: "100" });
    if (until !== null) q.set("until", String(until));
    const res = await getOk(fetchFn, `${API}/v6/deployments?${q}`, token);
    const data = (await res.json()) as {
      deployments: { created?: number; createdAt?: number }[];
      pagination?: { next?: number | null };
    };
    for (const d of data.deployments) {
      const t = d.createdAt ?? d.created;
      if (typeof t === "number") times.push(t);
    }
    until = data.pagination?.next ?? null;
    if (until === null || data.deployments.length === 0) return times;
  }
  throw new Error("/v6/deployments : plus de 20 pages, pagination interrompue");
}
