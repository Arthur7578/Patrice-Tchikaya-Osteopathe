import { describe, expect, it, vi } from "vitest";
import {
  BLOB_ADVANCED_SERVICE,
  BLOB_SIMPLE_SERVICE,
  blobDays,
  countDeployments,
  diagnoseToken,
  fetchCharges,
  fetchDeploymentTimes,
  httpHint,
  judgeDay,
  missingEnvMessage,
  monthToDate,
  parseJsonl,
  renderReport,
  verdictLine,
  type ChargeRow,
} from "./blob-usage";

const D1 = { ChargePeriodStart: "2026-11-18T08:00:00.000Z", ChargePeriodEnd: "2026-11-19T08:00:00.000Z" };
const D2 = { ChargePeriodStart: "2026-11-19T08:00:00.000Z", ChargePeriodEnd: "2026-11-20T08:00:00.000Z" };
const D3 = { ChargePeriodStart: "2026-11-20T08:00:00.000Z", ChargePeriodEnd: "2026-11-21T08:00:00.000Z" };
const site = { ProjectId: "prj_1", ProjectName: "site" };
const row = (period: typeof D1, quantity: number | string, tags: ChargeRow["Tags"] = site): ChargeRow => ({
  ServiceName: BLOB_ADVANCED_SERVICE,
  ConsumedQuantity: quantity,
  EffectiveCost: 0,
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
        { ...row(D2, 10), EffectiveCost: "0.0000106" },
        { ...row(D2, 7), ServiceName: BLOB_SIMPLE_SERVICE },
        { ...row(D2, 1), ServiceName: BLOB_SIMPLE_SERVICE, ConsumedQuantity: undefined },
        row(D1, "4"),
        row(D1, 3, { ProjectName: "autre" }),
        row(D1, 2, null),
        row(D1, null as unknown as number),
        { ...row(D1, 99), ServiceName: "Blob Data Transfer" },
        { ...row(D1, 1), EffectiveCost: null },
        { ServiceName: BLOB_ADVANCED_SERVICE, ConsumedQuantity: 5 },
        row(D3, 50), // jour pas encore terminé
      ],
      NOW,
    );
    expect(days).toEqual([
      { start: D1.ChargePeriodStart, end: D1.ChargePeriodEnd, total: 10, byProject: { site: 5, autre: 3, "(sans projet)": 2 }, simple: 0, cost: 0 },
      { start: D2.ChargePeriodStart, end: D2.ChargePeriodEnd, total: 10, byProject: { site: 10 }, simple: 7, cost: 0.0000106 },
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
  const day = (total: number) => ({ start: "s", end: "e", total, byProject: {}, simple: 0, cost: 0 });
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
    const d = (end: string, total: number) => ({ start: "", end, total, byProject: {}, simple: 0, cost: 0 });
    expect(monthToDate([d("2026-10-31T08:00:00Z", 100), d("2026-11-01T08:00:00Z", 5), d("2026-11-02T08:00:00Z", 7)])).toBe(12);
    expect(monthToDate([])).toBe(0);
  });
});

describe("verdictLine et renderReport", () => {
  const v = (total: number, deployments: number, byProject: Record<string, number> = {}, cost = 0) =>
    judgeDay({ start: D1.ChargePeriodStart, end: D1.ChargePeriodEnd, total, byProject, simple: 12, cost }, deployments);

  it("lignes de verdict au format du brief", () => {
    expect(verdictLine(v(31, 0))).toBe("Blob : ~31 ops avancées le 18/11, 0 builds, seuil dépassé (30)");
    expect(verdictLine(v(12, 2))).toBe("Blob OK : ~12 ops le 18/11, 2 builds (seuil 80)");
  });

  it("signale le dépassement du dernier jour, avec les pistes et le détail trié par projet", () => {
    const text = renderReport([v(5, 0), v(31.456, 0, { a: 1, site: 30.456 }, 0.000159)], 36);
    expect(text).toMatch(/^\*\*Blob : ~31\.46 ops avancées le 18\/11, 0 builds, seuil dépassé \(30\)\*\*\n\nPistes : /);
    expect(text).toContain("src/lib/i18n/memory.ts");
    expect(text).toContain("| 18/11 | 31.46 ⚠ | ~30 | 12 | 0 | 30 | site : 30.46, a : 1 |");
    expect(text).toContain("| 18/11 | 5 | ~0 | 12 | 0 | 30 | — |");
    expect(text).toContain("Total depuis le 1er du mois (indicatif) : 36 / 2000.");
  });

  it("sous le seuil : ligne OK sans pistes ; aucune donnée : le dit", () => {
    const text = renderReport([v(50, 0), v(12, 1)], 62);
    expect(text).toMatch(/^Blob OK : ~12 ops le 18\/11, 1 builds \(seuil 80\)\n/);
    expect(text).not.toContain("Pistes");
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
    await expect(fetchCharges(fetchFn, "t", "team", NOW, NOW)).rejects.toThrow(
      "/v1/billing/charges : HTTP 403 forbidden → Jeton valide mais sans accès",
    );
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

describe("missingEnvMessage", () => {
  const full = { VERCEL_TOKEN: "t", VERCEL_TEAM_ID: "team", VERCEL_PROJECT_ID: "prj" };
  it("null quand tout est là", () => expect(missingEnvMessage(full)).toBeNull());
  it("ne nomme que le jeton quand seul le jeton manque, avec la marche à suivre", () => {
    const text = missingEnvMessage({ ...full, VERCEL_TOKEN: "" });
    expect(text).toMatch(/^variable\(s\) manquante\(s\) : VERCEL_TOKEN\. Secret GitHub VERCEL_TOKEN absent/);
    expect(text).toContain("Account Settings → Tokens");
    expect(text).toContain("New repository secret");
  });
  it("identifiants manquants : renvoie au workflow", () => {
    expect(missingEnvMessage({ VERCEL_TOKEN: "t" })).toBe(
      "variable(s) manquante(s) : VERCEL_TEAM_ID, VERCEL_PROJECT_ID. Identifiants écrits dans .github/workflows/blob-usage.yml (env).",
    );
  });
});

describe("httpHint", () => {
  it.each([
    [401, "Jeton refusé"],
    [403, "sans accès à cette équipe"],
    [404, "Plan not found"],
    [429, "Trop de requêtes"],
    [500, "Panne côté Vercel"],
    [503, "Panne côté Vercel"],
    [418, "Réponse inattendue"],
  ])("HTTP %i", (status, text) => expect(httpHint(status)).toContain(text));
});

describe("diagnoseToken", () => {
  it("équipe visible : nom et plan, sans rien d'autre", async () => {
    const fetchFn = vi.fn(async () => ok(JSON.stringify({ slug: "equipe", billing: { plan: "hobby" }, id: "secret?" })));
    expect(await diagnoseToken(fetchFn, "t", "team_1")).toBe("le jeton voit l'équipe « equipe » (plan : hobby).");
    expect((fetchFn.mock.calls[0] as unknown as [string])[0]).toBe("https://api.vercel.com/v2/teams/team_1");
  });
  it("plan ou nom absents", async () => {
    const fetchFn = vi.fn(async () => ok(JSON.stringify({ billing: null })));
    expect(await diagnoseToken(fetchFn, "t", "team_1")).toBe("le jeton voit l'équipe « ? » (plan : non renvoyé).");
  });
  it("équipe invisible : suggère un jeton à la portée de l'équipe", async () => {
    const fetchFn = vi.fn(async () => new Response("", { status: 403 }));
    expect(await diagnoseToken(fetchFn, "t", "team_1")).toMatch(/^le jeton ne voit pas l'équipe \(GET \/v2\/teams : HTTP 403\)/);
  });
});
