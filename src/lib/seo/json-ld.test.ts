import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import type { Motif, MotifPage, SiteContent } from "@/lib/content/types";
import { buildHomeGraph, buildMotifGraph, buildSiteGraph } from "./json-ld";

const META = { title: "Titre de test", description: "Description de test" };

type Node = Record<string, unknown>;
const nodesOf = (g: { "@graph"?: unknown }) => (g["@graph"] ?? []) as Node[];
const typesOf = (g: { "@graph"?: unknown }) => nodesOf(g).flatMap((n) => [n["@type"]].flat() as string[]);

function allGraphs(c: SiteContent = FALLBACK_CONTENT) {
  const motif = c.motifs[0] as Motif;
  const page: MotifPage = { lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage;
  return [
    buildSiteGraph(c),
    buildHomeGraph(c, META),
    buildMotifGraph(c, motif, page, { path: `/${motif.slug}`, ...META }),
  ];
}

describe("JSON-LD : règles non négociables (CLAUDE.md règle 7 et 10)", () => {
  it("n'émet jamais Physician, AggregateRating ni Review", () => {
    const json = JSON.stringify(allGraphs());
    const types = allGraphs().flatMap(typesOf);
    expect(types).not.toContain("Physician");
    expect(json).not.toMatch(/AggregateRating|"Review"|"Physician"/);
  });

  it("n'écrit jamais « médecin » ni « Dr » dans le JSON-LD", () => {
    const json = JSON.stringify(allGraphs());
    expect(json).not.toMatch(/médecin/i);
    expect(json).not.toMatch(/\bDr\b\.?/);
  });

  it("le cabinet est un MedicalBusiness et le praticien une Person", () => {
    const types = typesOf(buildSiteGraph(FALLBACK_CONTENT));
    expect(types).toEqual(expect.arrayContaining(["WebSite", "MedicalBusiness", "Person"]));
  });
});

describe("buildSiteGraph", () => {
  it("omet openingHoursSpecification et sameAs quand ils sont vides", () => {
    const c = { ...FALLBACK_CONTENT, openingHours: undefined, sameAs: [] } as unknown as SiteContent;
    const org = nodesOf(buildSiteGraph(c)).find((n) => (n["@type"] as string[]).includes("MedicalBusiness"))!;
    expect(org.openingHoursSpecification).toBeUndefined();
    expect(org.sameAs).toBeUndefined();
  });

  it("référence l'URL de RDV configurée dans le ReserveAction", () => {
    const org = nodesOf(buildSiteGraph(FALLBACK_CONTENT)).find((n) => (n["@type"] as string[]).includes("MedicalBusiness"))!;
    expect((org.potentialAction as Node).target).toBe(FALLBACK_CONTENT.booking.url);
  });
});

describe("buildHomeGraph", () => {
  it("contient WebPage + FAQPage avec une question par entrée de FAQ", () => {
    const graph = buildHomeGraph(FALLBACK_CONTENT, META);
    const faq = nodesOf(graph).find((n) => n["@type"] === "FAQPage")!;
    expect(typesOf(graph)).toContain("WebPage");
    expect((faq.mainEntity as unknown[]).length).toBe(FALLBACK_CONTENT.faq.length);
  });

  it("n'émet pas de FAQPage si la FAQ est vide", () => {
    const graph = buildHomeGraph({ ...FALLBACK_CONTENT, faq: [] }, META);
    expect(typesOf(graph)).not.toContain("FAQPage");
  });
});

describe("buildMotifGraph", () => {
  it("produit MedicalWebPage + BreadcrumbList relus par le praticien", () => {
    const motif = FALLBACK_CONTENT.motifs[0]!;
    const graph = buildMotifGraph(FALLBACK_CONTENT, motif, { lastEdited: "2026-09-01T10:00:00.000Z" } as MotifPage, {
      path: `/${motif.slug}`,
      ...META,
    });
    const page = nodesOf(graph).find((n) => n["@type"] === "MedicalWebPage")!;
    expect(typesOf(graph)).toEqual(["MedicalWebPage", "BreadcrumbList"]);
    expect(page.lastReviewed).toBe("2026-09-01");
    expect(page.reviewedBy).toEqual({ "@id": expect.stringContaining("#person") });
  });
});
