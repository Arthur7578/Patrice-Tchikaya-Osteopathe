import { describe, expect, it } from "vitest";
import { isAllowedImageUrl } from "@/config/images";
import {
  cleanOptional, formatReviewAuthor, isPlaceholder, normalizeSlug, parseBookingUrl, parseGeo, parseOpeningHours, splitOpeningLines,
  isE164, parseInteger, parseList, parsePhone, parsePostalLine, parseRating, parseWeroRecipient, toE164,
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
  it("parse les horaires saisis en français libre", () => {
    expect(parseOpeningHours("Lundi au Vendredi, de 08:30-19:00 ; Samedi de 8h30 à 12h30")).toEqual([
      { days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:30", closes: "19:00" },
      { days: ["Sa"], opens: "08:30", closes: "12:30" },
    ]);
    expect(parseOpeningHours("Lun, mer et ven : 9h-12h / 14h-18h")).toEqual([
      { days: ["Mo", "We", "Fr"], opens: "09:00", closes: "12:00" },
      { days: ["Mo", "We", "Fr"], opens: "14:00", closes: "18:00" },
    ]);
    expect(parseOpeningHours("Sur rendez-vous")).toBeNull();
    expect(splitOpeningLines("Sur rendez-vous ; le samedi matin")).toEqual(["Sur rendez-vous", "le samedi matin"]);
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

describe("parse : cas limites", () => {
  it("placeholders : null/undefined, espaces, crochets, « mettre le », « à compléter », « todo »", () => {
    expect(isPlaceholder(null)).toBe(true);
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder("   ")).toBe(true);
    expect(isPlaceholder("[x]")).toBe(true);
    expect(isPlaceholder("Mettre le tarif")).toBe(true);
    expect(isPlaceholder("a completer")).toBe(true);
    expect(isPlaceholder("TODO")).toBe(true);
    expect(isPlaceholder("Tarif [indicatif] 90 €")).toBe(false); // crochets au milieu : vrai texte
    expect(cleanOptional(null)).toBeNull();
    expect(cleanOptional("  90 €  ")).toBe("90 €");
  });

  it("code postal : pays par défaut Luxembourg, espaces rognés, format inconnu => null", () => {
    expect(parsePostalLine("  3440   Dudelange  ")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
    expect(parsePostalLine("l-3440 Dudelange, Luxembourg")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
    expect(parsePostalLine("57100 Thionville, France")).toBeNull(); // 5 chiffres : pas un code luxembourgeois
    expect(parsePostalLine("Dudelange")).toBeNull();
  });

  it("toE164 : ne garde que « + » et les chiffres, « 00 » devient « + », « (0) » disparaît, « + » ajouté s'il manque", () => {
    expect(toE164("+352 (0) 51-92-92")).toBe("+352519292");
    expect(toE164("00352 51 92 92")).toBe("+352519292");
    expect(toE164(" 0033 (0)1 23 45 67 89")).toBe("+33123456789");
    expect(toE164("352 51 92 92")).toBe("+352519292");
    expect(toE164("+352 5100 92")).toBe("+352510092"); // « 00 » au milieu : inchangé
  });

  it("isE164 : « + », indicatif sans 0 initial, 7 à 15 chiffres", () => {
    expect(isE164("+352519292")).toBe(true);
    expect(isE164("+3525192")).toBe(true); // 7 chiffres
    expect(isE164("+352519292123456")).toBe(true); // 15 chiffres
    expect(isE164("+352519")).toBe(false); // 6 chiffres
    expect(isE164("+3525192921234567")).toBe(false); // 16 chiffres
    expect(isE164("+0352519292")).toBe(false);
    expect(isE164("352519292")).toBe(false);
    expect(isE164("+352519292 ")).toBe(false);
    expect(isE164("+")).toBe(false);
  });

  it("URL de réservation : https uniquement ; hôte Cal.com sans chemin = lien simple ; www. ignoré", () => {
    expect(parseBookingUrl("http://cal.eu/cabinet/consultation")).toBeNull();
    expect(parseBookingUrl("javascript:alert(1)")).toBeNull();
    expect(parseBookingUrl("https://cal.eu/")).toEqual({ url: "https://cal.eu/", provider: "generic", calLink: null, calOrigin: null });
    expect(parseBookingUrl("  https://www.cal.com/cabinet/  ")).toEqual({
      url: "https://www.cal.com/cabinet/",
      provider: "cal",
      calLink: "cabinet",
      calOrigin: "https://app.cal.com",
    });
    expect(parseBookingUrl("https://app.cal.eu/cabinet/rdv")?.calOrigin).toBe("https://app.cal.eu");
    expect(parseBookingUrl("https://app.cal.com/cabinet/rdv")?.calOrigin).toBe("https://app.cal.com");
    expect(parseBookingUrl("https://cal.eu.evil.test/x")?.provider).toBe("generic");
  });

  it("GPS : bornes incluses, signes, hors bornes => null", () => {
    expect(parseGeo("-90, -180")).toEqual({ latitude: -90, longitude: -180 });
    expect(parseGeo("90,180")).toEqual({ latitude: 90, longitude: 180 });
    expect(parseGeo("-91, 0")).toBeNull();
    expect(parseGeo("0, 181")).toBeNull();
    expect(parseGeo("0, -181")).toBeNull();
    expect(parseGeo("[À COMPLÉTER]")).toBeNull();
  });

  it("note : bornes 0 et 5, virgule décimale, texte sans chiffre => null", () => {
    expect(parseRating("0")).toBe(0);
    expect(parseRating("5,0")).toBe(5);
    expect(parseRating("5.5")).toBeNull();
    expect(parseRating("excellent")).toBeNull();
    expect(parseRating(null)).toBeNull();
    expect(parseInteger("aucun")).toBeNull();
    expect(parseInteger("environ 12 avis")).toBe(12);
  });

  it("Wero : 8 à 15 chiffres, caractères de numéro seulement", () => {
    expect(parseWeroRecipient("12345678")).toEqual({ value: "12345678", kind: "phone" });
    expect(parseWeroRecipient("1234567")).toBeNull();
    expect(parseWeroRecipient("+123 456 789 012 345")).toEqual({ value: "+123 456 789 012 345", kind: "phone" });
    expect(parseWeroRecipient("1234567890123456")).toBeNull();
    expect(parseWeroRecipient("+352 691 123 456 (cabinet)")).toBeNull();
    expect(parseWeroRecipient("a b@exemple.lu")).toBeNull();
  });

  it("auteur d'avis : vide => « Patient », espaces multiples, initiale en majuscule", () => {
    expect(formatReviewAuthor("")).toBe("Patient");
    expect(formatReviewAuthor("   ")).toBe("Patient");
    expect(formatReviewAuthor("  Jean   de la fontaine ")).toBe("Jean F.");
  });

  it("slug : accents, ponctuation, tirets en bord retirés ; rien d'utilisable => null", () => {
    expect(normalizeSlug("  Épaule & Coude — Sport !  ")).toBe("epaule-coude-sport");
    expect(normalizeSlug("---")).toBeNull();
    expect(normalizeSlug("")).toBeNull();
  });

  it("liste : puces retirées, séparateurs « ; » et retours à la ligne, éléments vides ignorés", () => {
    expect(parseList("- Un\n• Deux ; * Trois\n\n ; ")).toEqual(["Un", "Deux", "Trois"]);
    expect(parseList(null)).toEqual([]);
  });

  it("liste : une cellule qui contient encore le texte d'attente est entièrement masquée (même avec un « ; » dedans)", () => {
    // Texte réel de Formations_Continues dans Notion (30/09/2026). Découpé au « ; », sa seconde moitié
    // ne ressemble plus à un texte d'attente : un filtrage ligne par ligne la publierait sur le site.
    const notionPlaceholder =
      "[OPTIONNEL — à compléter : remplacer tout ce texte par la liste des formations continues, une par ligne " +
      "(Maj+Entrée dans la cellule) ou séparées par « ; », ex. « Ostéopathie du sport — organisme, année ». " +
      "Laisser ce texte ou vider la cellule masque le bloc.]";
    expect(parseList(notionPlaceholder)).toEqual([]);
    // Consigne Notion : « remplacer tout ce texte ». Tant qu'il reste, rien n'est publié.
    expect(parseList(`Ostéopathie du sport\n${notionPlaceholder}`)).toEqual([]);
  });

  it("horaires : incohérents ou incomplets => null (texte brut affiché, pas de JSON-LD faux)", () => {
    expect(parseOpeningHours("Lundi 9h-12h-14h")).toBeNull(); // nombre impair d'heures
    expect(parseOpeningHours("9h-12h")).toBeNull(); // aucun jour
    expect(parseOpeningHours("Lundi 25h-26h")).toBeNull(); // heure impossible
    expect(parseOpeningHours("Lundi 9h60-12h")).toBeNull(); // minutes impossibles
    expect(parseOpeningHours("Lundi 12h-9h")).toBeNull(); // fermeture avant ouverture
    expect(parseOpeningHours("Lundi 9h-9h")).toBeNull(); // plage vide
    expect(parseOpeningHours("")).toBeNull();
    expect(parseOpeningHours("Lundi 9h-12h ; Sur rendez-vous")).toBeNull(); // une ligne illisible suffit
  });

  it("horaires : plages de jours (« au », « - », « jusqu'au », « to »), jours répétés dédoublonnés, 24h acceptée", () => {
    expect(parseOpeningHours("Mardi jusqu'au jeudi 9h-18h")?.[0]?.days).toEqual(["Tu", "We", "Th"]);
    expect(parseOpeningHours("Mo to We 9h-18h")?.[0]?.days).toEqual(["Mo", "Tu", "We"]);
    expect(parseOpeningHours("Samedi - Dimanche 10h-12h")?.[0]?.days).toEqual(["Sa", "Su"]);
    expect(parseOpeningHours("Lundi, lundi 8h-9h")?.[0]?.days).toEqual(["Mo"]);
    expect(parseOpeningHours("Vendredi 20h-24h")).toEqual([{ days: ["Fr"], opens: "20:00", closes: "24:00" }]);
    expect(parseOpeningHours("Jeudi 9h - 12h30")).toEqual([{ days: ["Th"], opens: "09:00", closes: "12:30" }]);
  });

  it("lignes d'horaires : séparées par « ; » ou retour à la ligne, vides ignorées", () => {
    expect(splitOpeningLines("Lundi 9h-12h;\n\nMardi 9h-12h ;")).toEqual(["Lundi 9h-12h", "Mardi 9h-12h"]);
    expect(splitOpeningLines(null)).toEqual([]);
  });
});

describe("parse : formats de saisie Notion (tolérance et limites)", () => {
  it("code postal : virgule sans espace, espace avant la virgule, préfixe étranger refusé", () => {
    expect(parsePostalLine("3440 Dudelange,Luxembourg")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
    expect(parsePostalLine("3440 Dudelange , Luxembourg")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
    expect(parsePostalLine("B-3440 Dudelange")).toBeNull();
    expect(parsePostalLine("Rue 12, 3440 Dudelange")).toBeNull();
  });

  it("téléphone : valeur absente => null (jamais d'exception)", () => {
    expect(parsePhone(null)).toBeNull();
    expect(parsePhone(undefined)).toBeNull();
  });

  it("URL Cal.com : barres obliques multiples retirées du chemin ; seul un « www. » initial est ignoré", () => {
    expect(parseBookingUrl("https://cal.eu//cabinet/consultation//")?.calLink).toBe("cabinet/consultation");
    expect(parseBookingUrl("https://cawww.l.eu/cabinet")?.provider).toBe("generic");
  });

  it("GPS : entiers, espaces autour de la virgule, longitude à deux chiffres, texte autour refusé, latitude > 90 refusée", () => {
    expect(parseGeo(" 49.481194 , 16.084361 ")).toEqual({ latitude: 49.481194, longitude: 16.084361 });
    expect(parseGeo("49, 6")).toEqual({ latitude: 49, longitude: 6 });
    expect(parseGeo("GPS 49.48, 6.08")).toBeNull();
    expect(parseGeo("49.48, 6.08 (cabinet)")).toBeNull();
    expect(parseGeo("91, 6.08")).toBeNull();
    expect(parseGeo(null)).toBeNull();
  });

  it("Wero : valeur absente => null ; texte avant le numéro ou après l'e-mail refusé", () => {
    expect(parseWeroRecipient(null)).toBeNull();
    expect(parseWeroRecipient("tel +352 691 123 456")).toBeNull();
    expect(parseWeroRecipient("cabinet@exemple.lu (pro)")).toBeNull();
  });

  it("note : décimales conservées, au-delà de 5 refusée", () => {
    expect(parseRating("4.75")).toBe(4.75);
    expect(parseRating("7")).toBeNull();
  });

  it("liste : un tiret au milieu d'un élément est gardé ; une puce collée au texte est retirée", () => {
    expect(parseList("Ostéopathie - sport")).toEqual(["Ostéopathie - sport"]);
    expect(parseList("-Dry needling")).toEqual(["Dry needling"]);
  });

  it("jours : abréviations françaises et anglaises reconnues", () => {
    const days = (text: string) => parseOpeningHours(`${text} 9h-10h`)?.[0]?.days;
    expect(days("Tu")).toEqual(["Tu"]);
    expect(days("Th")).toEqual(["Th"]);
    expect(days("Su")).toEqual(["Su"]);
    expect(days("jeu")).toEqual(["Th"]);
    expect(days("dim")).toEqual(["Su"]);
    expect(days("mer")).toEqual(["We"]);
    expect(days("Mercredi au vendredi")).toEqual(["We", "Th", "Fr"]);
  });

  it("horaires : accents et apostrophes typographiques de Notion, jour cité après les heures ignoré", () => {
    expect(parseOpeningHours("Lundi à Vendredi 9h-18h")?.[0]?.days).toEqual(["Mo", "Tu", "We", "Th", "Fr"]);
    expect(parseOpeningHours("Mardi jusqu’au jeudi 9h-18h")?.[0]?.days).toEqual(["Tu", "We", "Th"]);
    expect(parseOpeningHours("Samedi 9h-12h, fermé le dimanche")).toEqual([{ days: ["Sa"], opens: "09:00", closes: "12:00" }]);
  });

  it("horaires : 59 minutes acceptées ; heure de fermeture impossible refusée", () => {
    expect(parseOpeningHours("Lundi 9h59-12h")).toEqual([{ days: ["Mo"], opens: "09:59", closes: "12:00" }]);
    expect(parseOpeningHours("Lundi 9h-25h")).toBeNull();
  });

  it("lignes d'horaires : texte d'attente => aucune ligne", () => {
    expect(splitOpeningLines("[À COMPLÉTER : horaires]")).toEqual([]);
  });
});
