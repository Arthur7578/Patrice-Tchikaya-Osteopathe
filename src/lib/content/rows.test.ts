import { describe, expect, it } from "vitest";
import { ACCESS_ROW_IDS, INFO_ROW_IDS, resolveRowOrder } from "./rows";

describe("resolveRowOrder", () => {
  it("sans valeur : ordre par défaut", () => {
    expect(resolveRowOrder(null, INFO_ROW_IDS)).toEqual([...INFO_ROW_IDS]);
    expect(resolveRowOrder("[À COMPLÉTER]", INFO_ROW_IDS)).toEqual([...INFO_ROW_IDS]);
  });

  it("respecte l'ordre saisi et ajoute les lignes oubliées à la fin", () => {
    expect(resolveRowOrder("tarif, horaires", INFO_ROW_IDS)).toEqual([
      "tarif", "horaires", "acces", "telephone", "duree", "remboursement", "langues",
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
});
