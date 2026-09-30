import { describe, expect, it } from "vitest";
import { ACCESS_ROW_IDS, INFO_ROW_IDS, resolveRowOrder } from "./rows";

describe("resolveRowOrder", () => {
  it("sans valeur : ordre par défaut", () => {
    expect(resolveRowOrder(null, INFO_ROW_IDS)).toEqual([...INFO_ROW_IDS]);
    expect(resolveRowOrder("[À COMPLÉTER]", INFO_ROW_IDS)).toEqual([...INFO_ROW_IDS]);
  });

  it("respecte l'ordre saisi et ajoute les lignes oubliées à la fin", () => {
    expect(resolveRowOrder("tarif, horaires", INFO_ROW_IDS)).toEqual([
      "tarif", "horaires", "acces", "telephone", "duree", "reglement", "remboursement", "langues",
    ]);
  });

  it("insensible à la casse, aux accents et au séparateur ; ignore les doublons", () => {
    expect(resolveRowOrder("Durée;\nTARIF, duree", INFO_ROW_IDS).slice(0, 2)).toEqual(["duree", "tarif"]);
  });

  it("signale les identifiants inconnus sans les inclure", () => {
    const unknown: string[] = [];
    const order = resolveRowOrder("parking, metro, adresse", ACCESS_ROW_IDS, (u) => unknown.push(u));
    expect(unknown).toEqual(["metro"]);
    expect(order).toEqual(["parking", "adresse", "train", "bus", "pmr"]);
  });

  it("« reglement » est un bloc réordonnable, placé juste après le tarif par défaut", () => {
    expect(INFO_ROW_IDS.indexOf("reglement")).toBe(INFO_ROW_IDS.indexOf("tarif") + 1);
    expect(resolveRowOrder("reglement, tarif", INFO_ROW_IDS).slice(0, 2)).toEqual(["reglement", "tarif"]);
  });
});

describe("resolveRowOrder : cas limites", () => {
  it("doublons : un identifiant n'apparaît qu'une fois (longueur inchangée)", () => {
    const order = resolveRowOrder("Durée;\nTARIF, duree, tarif", INFO_ROW_IDS);
    expect(order).toHaveLength(INFO_ROW_IDS.length);
    expect(new Set(order).size).toBe(INFO_ROW_IDS.length);
  });

  it("ponctuation autour d'un identifiant tolérée (« tarif. », « durée! »)", () => {
    const unknown: string[] = [];
    expect(resolveRowOrder("tarif., durée!", INFO_ROW_IDS, (u) => unknown.push(u)).slice(0, 2)).toEqual(["tarif", "duree"]);
    expect(unknown).toEqual([]);
  });

  it("valeur absente ou texte d'attente entre crochets : rien n'est signalé", () => {
    const unknown: string[] = [];
    resolveRowOrder(null, INFO_ROW_IDS, (u) => unknown.push(u));
    resolveRowOrder(undefined, INFO_ROW_IDS, (u) => unknown.push(u));
    resolveRowOrder("[À COMPLÉTER : ordre des blocs]", INFO_ROW_IDS, (u) => unknown.push(u));
    expect(unknown).toEqual([]);
  });

  it("crochets au milieu d'une valeur : ce n'est pas un texte d'attente, l'erreur est signalée", () => {
    const unknown: string[] = [];
    resolveRowOrder("tarif [x], [x] duree", INFO_ROW_IDS, (u) => unknown.push(u));
    expect(unknown).toEqual(["tarif [x]", "[x] duree"]);
  });

  it("identifiant inconnu sans fonction de signalement : ignoré sans erreur", () => {
    expect(() => resolveRowOrder("inconnu, tarif", INFO_ROW_IDS)).not.toThrow();
    expect(resolveRowOrder("inconnu, tarif", INFO_ROW_IDS)[0]).toBe("tarif");
  });
});
