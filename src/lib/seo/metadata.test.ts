import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { Motif } from "@/lib/content/types";
import { homeMeta, motifMeta } from "./metadata";

const motif = (description: string): Motif => ({ ...C.motifs[0]!, description });

describe("homeMeta", () => {
  it("utilise les valeurs Notion quand elles existent", () => {
    const meta = homeMeta({ ...C, seo: { ...C.seo, metaTitle: "Titre Notion", metaDescription: "Description Notion" } });
    expect(meta).toEqual({ title: "Titre Notion", description: "Description Notion" });
  });

  it("sinon construit titre et description avec la ville, sans « médecin » ni « Dr »", () => {
    const meta = homeMeta({ ...C, seo: { ...C.seo, metaTitle: null, metaDescription: null } });
    expect(meta.title).toContain(C.contact.locality);
    expect(meta.description).toContain(C.consultation.durationLabel);
    expect(`${meta.title} ${meta.description}`).not.toMatch(/médecin|\bDr\b/i);
  });
});

describe("motifMeta", () => {
  it("chemin = /slug ; titre « {Motif} à {ville} | {praticien} »", () => {
    const m = C.motifs[0]!;
    const meta = motifMeta(C, m);
    expect(meta.path).toBe(`/${m.slug}`);
    expect(meta.title).toBe(`${m.title} à ${C.contact.locality} | ${C.practitioner.name}`);
  });

  it("ajoute le rappel local quand la description reste ≤ 160 caractères", () => {
    const meta = motifMeta(C, motif("Courte description."));
    expect(meta.description).toBe(`Courte description. Ostéopathe à ${C.contact.locality}, sans ordonnance.`);
  });

  it("description rognée avant d'ajouter le rappel local", () => {
    expect(motifMeta(C, motif("  Courte description.  ")).description).toBe(
      `Courte description. Ostéopathe à ${C.contact.locality}, sans ordonnance.`,
    );
  });

  it("rappel local gardé à 160 caractères pile, retiré au-delà", () => {
    const suffix = ` Ostéopathe à ${C.contact.locality}, sans ordonnance.`;
    const exact = "x".repeat(160 - suffix.length);
    expect(motifMeta(C, motif(exact)).description).toBe(`${exact}${suffix}`);
    expect(motifMeta(C, motif(`${exact}y`)).description).toBe(`${exact}y`);
  });

  it("garde la description seule si le rappel local dépasserait 160 caractères", () => {
    const long = "x".repeat(150);
    expect(motifMeta(C, motif(long)).description).toBe(long);
  });
});
