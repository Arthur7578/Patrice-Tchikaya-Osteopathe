import { describe, expect, it } from "vitest";
import { fillVariables, TEXT_VARIABLES } from "./variables";

const VALUES = { tarif: "90 €", duree: "45 minutes" };

/** Appel avec collecte des messages d'erreur. */
function fill(text: string, values: Record<keyof typeof TEXT_VARIABLES, string | null> = VALUES) {
  const errors: string[] = [];
  return { result: fillVariables(text, values, (m) => errors.push(m)), errors };
}

describe("fillVariables", () => {
  it("remplace chaque variable, même répétée", () => {
    expect(fill("La séance de {duree} coûte {tarif}. Tarif : {tarif}.")).toEqual({
      result: "La séance de 45 minutes coûte 90 €. Tarif : 90 €.",
      errors: [],
    });
  });

  it("nom insensible à la casse, aux accents et aux espaces", () => {
    expect(fill("{ Durée } · {TARIF}").result).toBe("45 minutes · 90 €");
  });

  it("texte sans variable ou accolade isolée : inchangé", () => {
    expect(fill("Une facture vous est remise.")).toEqual({ result: "Une facture vous est remise.", errors: [] });
    expect(fill("Accolade { seule").result).toBe("Accolade { seule");
  });

  it("valeur insérée telle quelle (pas de motif de remplacement « $& »)", () => {
    expect(fill("Prix : {tarif}", { ...VALUES, tarif: "90 $&" }).result).toBe("Prix : 90 $&");
  });

  it("variable inconnue : null et message qui liste les variables disponibles", () => {
    expect(fill("Coûte {tarf}.")).toEqual({
      result: null,
      errors: ["variable inconnue « {tarf} » (disponibles : {tarif}, {duree})"],
    });
    expect(fill("{constructor} {}").result).toBeNull(); // ni propriété héritée, ni nom vide
  });

  it("variable sans valeur : null et message qui nomme la clé Notion à remplir", () => {
    expect(fill("Coûte {tarif}.", { ...VALUES, tarif: null })).toEqual({
      result: null,
      errors: ["« {tarif} » sans valeur (Tarif_Consultation non renseigné)"],
    });
  });
});
