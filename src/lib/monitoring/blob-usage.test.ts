import { describe, expect, it, vi } from "vitest";
import {
  BLOB_ADVANCED_SERVICE,
  blobDays,
  countDeployments,
  fetchCharges,
  fetchDeploymentTimes,
  judgeDay,
  monthToDate,
  parseJsonl,
  renderReport,
  type ChargeRow,
} from "./blob-usage";

const D1 = { ChargePeriodStart: "2026-11-18T08:00:00.000Z", ChargePeriodEnd: "2026-11-19T08:00:00.000Z" };
const D2 = { ChargePeriodStart: "2026-11-19T08:00:00.000Z", ChargePeriodEnd: "2026-11-20T08:00:00.000Z" };
const D3 = { ChargePeriodStart: "2026-11-20T08:00:00.000Z", ChargePeriodEnd: "2026-11-21T08:00:00.000Z" };
const site = { ProjectId: "prj_1", ProjectName: "site" };
const row = (period: typeof D1, quantity: number | string, tags: ChargeRow["Tags"] = site): ChargeRow => ({
  ServiceName: BLOB_ADVANCED_SERVICE,
  ConsumedQuantity: quantity,
  Tags: tags,
  ...period,
});
const NOW = new Date("2026-11-20T14:00:00.000Z");

describe("parseJsonl", () => {
  it("lit une ligne JSON par ligne et ignore les lignes vides", () => {
    expect(parseJsonl('{"a":1}\n\n {"b":2} \n')).toEqual([{ a: 1 }, { b: 2 }]);
  });
});

describe("blobDays", () => {
  it("additionne par jour et par projet, seulement le service Blob avancé et les jours terminés", () => {
    const days = blobDays(
      [
        row(D2, 10),
        row(D1, "4"),
        row(D1, 3, { ProjectName: "autre" }),
        row(D1, 2, null),
        row(D1, null as unknown as number),
        { ...row(D1, 99), ServiceName: "Blob Simple Operations" },
        { ServiceName: BLOB_ADVANCED_SERVICE, ConsumedQuantity: 5 },
        row(D3, 50), // jour pas encore terminé
      ],
      NOW,
    );
    expect(days).toEqual([
      { start: D1.ChargePeriodStart, end: D1.ChargePeriodEnd, total: 9, byProject: { site: 4, autre: 3, "(sans projet)": 2 } },
      { start: D2.ChargePeriodStart, end: D2.ChargePeriodEnd, total: 10, byProject: { site: 10 } },
    ]);
  });

  it("compte 0 pour une quantité illisible", () => {
    expect(blobDays([row(D1, "x")], NOW)[0].total).toBe(0);
  });
});

describe("countDeployments", () => {
  it("compte les déploiements dans [début, fin)", () => {
    const start = Date.parse(D1.ChargePeriodStart);
    const end = Date.parse(D1.ChargePeriodEnd);
    expect(countDeployments([start - 1, start, end - 1, end], D1.ChargePeriodStart, D1.ChargePeriodEnd)).toBe(2);
  });
});

describe("judgeDay", () => {
  const day = (total: number) => ({ start: "s", end: "e", total, byProject: {} });
  it("seuil 30 sans déploiement, strictement au-dessus", () => {
    expect(judgeDay(day(30), 0)).toMatchObject({ limit: 30, over: false });
    expect(judgeDay(day(31), 0)).toMatchObject({ limit: 30, over: true, deployments: 0 });
  });
  it("seuil 80 avec au moins un déploiement", () => {
    expect(judgeDay(day(80), 1)).toMatchObject({ limit: 80, over: false });
    expect(judgeDay(day(81), 2)).toMatchObject({ limit: 80, over: true, deployments: 2 });
  });
});

describe("monthToDate", () => {
  it("additionne les jours qui finissent dans le mois du dernier jour", () => {
    const d = (end: string, total: number) => ({ start: "", end, total, byProject: {} });
    expect(monthToDate([d("2026-10-31T08:00:00Z", 100), d("2026-11-01T08:00:00Z", 5), d("2026-11-02T08:00:00Z", 7)])).toBe(12);
    expect(monthToDate([])).toBe(0);
  });
});

describe("renderReport", () => {
  const v = (total: number, deployments: number, byProject: Record<string, number> = {}) =>
    judgeDay({ start: D1.ChargePeriodStart, end: D1.ChargePeriodEnd, total, byProject }, deployments);

  it("signale le dépassement du dernier jour, avec le détail trié par projet", () => {
    const text = renderReport([v(5, 0), v(31.456, 0, { a: 1, site: 30.456 })], 36);
    expect(text).toMatch(/^\*\*Dépassement\*\* .*31\.46 opérations avancées \(seuil 30, 0 déploiement/);
    expect(text).toContain("| 2026-11-18 08:00 | 31.46 ⚠ | 0 | 30 | site : 30.46, a : 1 |");
    expect(text).toContain("| 5 | 0 | 30 | — |");
    expect(text).toContain("Total depuis le 1er du mois (indicatif) : 36 / 2000.");
  });

  it("dit quand le dernier jour est sous le seuil, ou quand il n'y a aucune donnée", () => {
    expect(renderReport([v(50, 0), v(12, 1)], 62)).toMatch(/^Dernier jour .* 12 opérations avancées, sous le seuil de 80\./);
    expect(renderReport([], 0)).toMatch(/^Aucune ligne/);
  });
});

const ok = (body: string) => new Response(body, { status: 200 });

describe("fetchCharges", () => {
  it("appelle l'API de facturation avec le jeton et la période, et lit le JSONL", async () => {
    const fetchFn = vi.fn(async () => ok(`${JSON.stringify(row(D1, 3))}\n`));
    const rows = await fetchCharges(fetchFn, "tok", "team_1", new Date(D1.ChargePeriodStart), NOW);
    expect(rows).toHaveLength(1);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://api.vercel.com/v1/billing/charges");
    expect(Object.fromEntries(u.searchParams)).toEqual({ teamId: "team_1", from: D1.ChargePeriodStart, to: NOW.toISOString() });
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("lève une erreur lisible sur une réponse en échec", async () => {
    const fetchFn = vi.fn(async () => new Response("forbidden", { status: 403 }));
    await expect(fetchCharges(fetchFn, "t", "team", NOW, NOW)).rejects.toThrow("/v1/billing/charges : HTTP 403 forbidden");
  });
});

describe("fetchDeploymentTimes", () => {
  it("suit la pagination et lit createdAt (ou created)", async () => {
    const pages = [
      { deployments: [{ createdAt: 3 }, { created: 2 }, {}], pagination: { next: 2 } },
      { deployments: [{ createdAt: 1 }], pagination: { next: null } },
    ];
    const fetchFn = vi.fn(async () => ok(JSON.stringify(pages.shift())));
    expect(await fetchDeploymentTimes(fetchFn, "t", "team_1", "prj_1", new Date(0))).toEqual([3, 2, 1]);
    const urls = (fetchFn.mock.calls as unknown as [string][]).map(([u]) => new URL(u));
    expect(urls[0].pathname).toBe("/v6/deployments");
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ teamId: "team_1", projectId: "prj_1", since: "0", limit: "100" });
    expect(urls[1].searchParams.get("until")).toBe("2");
  });

  it("s'arrête sur une page vide ou sans pagination", async () => {
    const fetchFn = vi.fn(async () => ok(JSON.stringify({ deployments: [], pagination: { next: 5 } })));
    expect(await fetchDeploymentTimes(fetchFn, "t", "x", "p", new Date(0))).toEqual([]);
    const noPagination = vi.fn(async () => ok(JSON.stringify({ deployments: [{ createdAt: 1 }] })));
    expect(await fetchDeploymentTimes(noPagination, "t", "x", "p", new Date(0))).toEqual([1]);
  });

  it("refuse une pagination sans fin", async () => {
    const fetchFn = vi.fn(async () => ok(JSON.stringify({ deployments: [{ createdAt: 1 }], pagination: { next: 1 } })));
    await expect(fetchDeploymentTimes(fetchFn, "t", "x", "p", new Date(0))).rejects.toThrow("plus de 20 pages");
  });
});
