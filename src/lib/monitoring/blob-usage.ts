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
export const API = "https://api.vercel.com";

/** Seuils par jour (demande d'Arthur) : au-delà, alerte. Un jour avec déploiement a droit aux lectures du build. */
export const DAILY_LIMIT = { withoutDeployment: 30, withDeployment: 80 } as const;

export type ChargeRow = {
  ServiceName?: string;
  ConsumedQuantity?: number | string | null;
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
    if (row.ServiceName !== BLOB_ADVANCED_SERVICE || !row.ChargePeriodStart || !row.ChargePeriodEnd) continue;
    if (Date.parse(row.ChargePeriodEnd) > now.getTime()) continue;
    const quantity = Number(row.ConsumedQuantity ?? 0) || 0;
    const day = days.get(row.ChargePeriodStart) ?? {
      start: row.ChargePeriodStart,
      end: row.ChargePeriodEnd,
      total: 0,
      byProject: {},
    };
    const project = row.Tags?.ProjectName ?? "(sans projet)";
    day.total += quantity;
    day.byProject[project] = (day.byProject[project] ?? 0) + quantity;
    days.set(row.ChargePeriodStart, day);
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

export function renderReport(verdicts: DayVerdict[], monthTotal: number): string {
  const latest = verdicts.at(-1);
  const lines = [
    "| Jour (début UTC) | Opérations avancées | Déploiements | Seuil | Détail par projet |",
    "| --- | ---: | ---: | ---: | --- |",
    ...verdicts.map((v) => {
      const detail = Object.entries(v.byProject)
        .sort(([, a], [, b]) => b - a)
        .map(([name, n]) => `${name} : ${fmt(n)}`)
        .join(", ");
      return `| ${v.start.slice(0, 16).replace("T", " ")} | ${fmt(v.total)}${v.over ? " ⚠" : ""} | ${v.deployments} | ${v.limit} | ${detail || "—"} |`;
    }),
    "",
    `Total depuis le 1er du mois (indicatif) : ${fmt(monthTotal)} / 2000.`,
  ];
  const head = !latest
    ? "Aucune ligne « Blob Advanced Operations » sur la période : rien à juger."
    : latest.over
      ? `**Dépassement** le jour commençant le ${latest.start} : ${fmt(latest.total)} opérations avancées (seuil ${latest.limit}, ${latest.deployments} déploiement(s) du projet ce jour-là).`
      : `Dernier jour (${latest.start}) : ${fmt(latest.total)} opérations avancées, sous le seuil de ${latest.limit}.`;
  return [head, "", ...lines].join("\n");
}

async function getOk(fetchFn: Fetch, url: string, token: string): Promise<Response> {
  const res = await fetchFn(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`${new URL(url).pathname} : HTTP ${res.status} ${body}`);
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
