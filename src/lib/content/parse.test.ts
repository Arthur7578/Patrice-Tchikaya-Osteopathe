import { describe, expect, it } from "vitest";
import { isAllowedImageUrl } from "@/config/images";
import {
  cleanOptional, formatReviewAuthor, isPlaceholder, normalizeSlug, parseBookingUrl, parseGeo, parseOpeningHours,
  parsePostalLine, parseRating, parseWeroRecipient, toE164,
} from "./parse";

describe("parse", () => {
  it("détecte les placeholders Notion", () => {
    expect(isPlaceholder("[Mettre le tarif ex: 90 €]")).toBe(true);
    expect(isPlaceholder("")).toBe(true);
    expect(isPlaceholder("90 €")).toBe(false);
  });
  it("parse l'URL de réservation Cal.com UE", () => {
    expect(parseBookingUrl("https://cal.eu/patrice-tchikaya-pro/consultation")).toEqual({
      url: "https://cal.eu/patrice-tchikaya-pro/consultation",
      provider: "cal",
      calLink: "patrice-tchikaya-pro/consultation",
      calOrigin: "https://app.cal.eu",
    });
    expect(parseBookingUrl("pas une url")).toBeNull();
  });
  it("reste générique et configurable pour un autre prestataire de RDV (ex. Doctena)", () => {
    // Changer de prestataire ne doit demander aucun changement de code : seule l'URL Notion change.
    expect(parseBookingUrl("https://www.doctena.lu/fr/pro/patrice-tchikaya")).toEqual({
      url: "https://www.doctena.lu/fr/pro/patrice-tchikaya",
      provider: "generic",
      calLink: null,
      calOrigin: null,
    });
  });
  it("parse code postal / ville", () => {
    expect(parsePostalLine("3440 Dudelange, Luxembourg")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
    expect(parsePostalLine("L-3440 Dudelange")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
  });
  it("normalise téléphone, note, auteur, slug", () => {
    expect(toE164("+352 51 92 92")).toBe("+352519292");
    expect(parseRating("5 / 5")).toBe(5);
    expect(parseRating("4,5")).toBe(4.5);
    expect(parseRating("12")).toBeNull();
    expect(formatReviewAuthor("Yves Schweicher")).toBe("Yves S.");
    expect(normalizeSlug("Ostéopathie du Sport")).toBe("osteopathie-du-sport");
  });
  it("parse les horaires schema.org", () => {
    expect(parseOpeningHours("Mo-Fr 08:00-19:00; Sa 08:00-12:00")).toEqual([
      { days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:00", closes: "19:00" },
      { days: ["Sa"], opens: "08:00", closes: "12:00" },
    ]);
    expect(parseOpeningHours("lundi 8h")).toBeNull();
  });
  it("parse les coordonnées GPS", () => {
    expect(parseGeo("49.481194, 6.084361")).toEqual({ latitude: 49.481194, longitude: 6.084361 });
    expect(parseGeo("49.481194,6.084361")).toEqual({ latitude: 49.481194, longitude: 6.084361 });
    expect(parseGeo("")).toBeNull();
    expect(parseGeo("Dudelange")).toBeNull();
    expect(parseGeo("200, 6.08")).toBeNull();
  });
  it("parse les coordonnées Wero (mobile ou e-mail)", () => {
    expect(parseWeroRecipient("+352 691 123 456")).toEqual({ value: "+352 691 123 456", kind: "phone" });
    expect(parseWeroRecipient(" 06 12 34 56 78 ")).toEqual({ value: "06 12 34 56 78", kind: "phone" });
    expect(parseWeroRecipient("cabinet@example.lu")).toEqual({ value: "cabinet@example.lu", kind: "email" });
    expect(parseWeroRecipient("[À COMPLÉTER : numéro Wero]")).toBeNull();
    expect(parseWeroRecipient("")).toBeNull();
    expect(parseWeroRecipient("51 92")).toBeNull();
    expect(parseWeroRecipient("cabinet@")).toBeNull();
    expect(parseWeroRecipient("Patrice")).toBeNull();
  });
  it("traite les lignes Notion « à compléter » de /paiement comme absentes (rien d'affiché)", () => {
    // Valeurs exactes créées dans Informations_generales le 29/09/2026.
    const placeholders = [
      "[À COMPLÉTER : numéro de mobile ou adresse e-mail Wero du cabinet]",
      "[À COMPLÉTER : nom tel qu'affiché par Wero avant la validation du paiement]",
      "[À COMPLÉTER — facultatif : autres moyens de paiement acceptés, en texte libre. Laisser tel quel pour ne rien afficher]",
      "[Facultatif — encart « Bon à savoir » sous les étapes de paiement. Laisser tel quel pour ne rien afficher]",
    ];
    for (const value of placeholders) {
      expect(cleanOptional(value)).toBeNull();
      expect(parseWeroRecipient(value)).toBeNull();
    }
    expect(cleanOptional("En message, précisez le nom du patient et la date de la séance.")).toBe(
      "En message, précisez le nom du patient et la date de la séance.",
    );
  });
  it("valide les hôtes d'images", () => {
    expect(isAllowedImageUrl("https://abc123.public.blob.vercel-storage.com/portrait.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://prod-files-secure.s3.us-west-2.amazonaws.com/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("http://images.unsplash.com/x.jpg")).toBe(false);
  });
});
