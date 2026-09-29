import { describe, expect, it } from "vitest";
import { isAllowedImageUrl } from "@/config/images";
import {
  formatReviewAuthor, isPlaceholder, normalizeSlug, parseBookingUrl, parseGeo, parseOpeningHours,
  parseInteger, parseList, parsePhone, parsePostalLine, parseRating, toE164,
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
    expect(parseRating("[À COMPLÉTER : note Google, ex. « 5,0 »]")).toBeNull();
    expect(parseInteger("[À COMPLÉTER : nombre d'avis, ex. « 12 »]")).toBeNull();
    expect(parseInteger("45 minutes")).toBe(45);
  });
  it("découpe une liste saisie dans une cellule Notion", () => {
    expect(parseList("Ostéopathie du sport (Institut A)\n- Ostéopathie périnatale ; • Dry needling\n\n")).toEqual([
      "Ostéopathie du sport (Institut A)",
      "Ostéopathie périnatale",
      "Dry needling",
    ]);
    expect(parseList("[À COMPLÉTER (optionnel) : une formation par ligne]")).toEqual([]);
    expect(parseList("")).toEqual([]);
    expect(formatReviewAuthor("Yves Schweicher")).toBe("Yves S.");
    expect(normalizeSlug("Ostéopathie du Sport")).toBe("osteopathie-du-sport");
  });
  it("parse le numéro secondaire (mobile), indicatif international obligatoire", () => {
    expect(parsePhone("+352 691 044 147")).toEqual({ display: "+352 691 044 147", e164: "+352691044147" });
    expect(parsePhone("  +352 691 044 147 ")).toEqual({ display: "+352 691 044 147", e164: "+352691044147" });
    expect(parsePhone("")).toBeNull();
    expect(parsePhone("[À COMPLÉTER]")).toBeNull();
    expect(parsePhone("691 044 147")).toBeNull(); // sans indicatif : ne pas produire "tel:+691…"
    expect(parsePhone("+352 691 044 147 / +352 51 92 92")).toBeNull(); // deux numéros dans une valeur
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
  it("valide les hôtes d'images", () => {
    expect(isAllowedImageUrl("https://abc123.public.blob.vercel-storage.com/portrait.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://prod-files-secure.s3.us-west-2.amazonaws.com/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("http://images.unsplash.com/x.jpg")).toBe(false);
  });
});
