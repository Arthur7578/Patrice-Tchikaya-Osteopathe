import { describe, expect, it } from "vitest";
import { ACCESS_ROW_IDS, DEFAULT_HERO_POINTS, HERO_POINT_IDS, INFO_ROW_IDS, resolveRowOrder, resolveRowSelection } from "./rows";

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

describe("resolveRowSelection", () => {
  it("sans valeur, ou sans identifiant reconnu : sélection par défaut", () => {
    expect(resolveRowSelection(null, HERO_POINT_IDS, DEFAULT_HERO_POINTS)).toEqual([...DEFAULT_HERO_POINTS]);
    expect(resolveRowSelection("[À COMPLÉTER]", HERO_POINT_IDS, DEFAULT_HERO_POINTS)).toEqual([...DEFAULT_HERO_POINTS]);
    expect(resolveRowSelection("oups", HERO_POINT_IDS, DEFAULT_HERO_POINTS)).toEqual([...DEFAULT_HERO_POINTS]);
  });

  it("n'affiche que les points listés, dans l'ordre saisi", () => {
    expect(resolveRowSelection("Durée, tarif; ordonnance\nconfirmation", HERO_POINT_IDS, DEFAULT_HERO_POINTS)).toEqual([
      "duree", "tarif", "ordonnance", "confirmation",
    ]);
  });

  it("signale les identifiants inconnus et ignore les doublons", () => {
    const unknown: string[] = [];
    const points = resolveRowSelection("tarif, prix, TARIF", HERO_POINT_IDS, DEFAULT_HERO_POINTS, (u) => unknown.push(u));
    expect(unknown).toEqual(["prix"]);
    expect(points).toEqual(["tarif"]);
  });
});
