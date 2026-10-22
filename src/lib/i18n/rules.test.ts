import { describe, expect, it } from "vitest";
import { countDoctorMentions, hasTitleBeforeName } from "./rules";

describe("countDoctorMentions : un médecin cité comme profession, dans chaque langue", () => {
  it.each([
    ["Consultez un médecin en cas d'urgence", 1],
    ["Consultez un docteur, ou votre médecin traitant", 2],
    ["Consult a doctor or a physician", 2],
    ["Wenden Sie sich an einen Arzt oder Ihre Hausärztin", 2],
    ["Termin in einer Arztpraxis", 1],
    ["Gitt bei en Dokter", 1],
    ["Consulte um médico ou o seu médico de família", 2],
    ["a doutora Silva", 1],
    ["Dr. Martin", 1],
  ])("« %s » → %i", (text, expected) => {
    expect(countDoctorMentions(text)).toBe(expected);
  });

  it.each([
    "ohne ärztliche Verordnung", // adjectif allemand
    "acompanhamento médico", // adjectif portugais
    "Ostéopathe D.O.",
    "Votre ostéopathe vous reçoit",
    "Doctorate, Doktorarbeit, GPS",
  ])("« %s » : aucune mention", (text) => {
    expect(countDoctorMentions(text)).toBe(0);
  });
});

describe("hasTitleBeforeName : titre de docteur accolé au praticien", () => {
  const names = ["Patrice", "Tchikaya"];
  it.each(["Dr Tchikaya", "Dr. Tchikaya", "Doktor Patrice", "Dokter Tchikaya", "a Doutora Tchikaya", "le docteur Tchikaya"])("« %s » : refusé", (text) => {
    expect(hasTitleBeforeName(text, names)).toBe(true);
  });

  it.each(["Patrice Tchikaya, Osteopath", "See a doctor. Patrice will tell you", "Dr Martin", "Doctorate Tchikayas"])("« %s » : permis", (text) => {
    expect(hasTitleBeforeName(text, names)).toBe(false);
  });

  it("sans nom : rien à vérifier", () => {
    expect(hasTitleBeforeName("Dr Tchikaya", [])).toBe(false);
  });
});
