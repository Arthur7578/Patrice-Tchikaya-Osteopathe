import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT as F } from "@/lib/content/fallback";
import { formatOpeningHours } from "@/lib/content/format";
import { fakeNotion, kv, prop, row } from "@/test/notion-fixtures";
import { fetchSiteContent } from "./fetch-content";

/** Informations_generales telles que Patrice les remplit (valeurs réalistes, toutes renseignées). */
const GENERAL_VALUES: Record<string, string> = {
  Nom_Praticien: "Jeanne Test",
  Metier_Titre: "Ostéopathe D.O.",
  Titre_SEO_H1: "Ostéopathe à Dudelange",
  Sous_Titre_Hero: "Soulager la douleur.",
  Meta_Title: "Titre SEO",
  Meta_Description: "Description SEO",
  Adresse_Rue: "46 Avenue Grande-Duchesse Charlotte",
  Code_Postal_Ville: "L-3440 Dudelange",
  Telephone_Display: "+352 51 92 92",
  Telephone_Mobile: "+352 691 044 147",
  Email_Contact: "cabinet@exemple.lu",
  Duree_Consultation: "45 minutes",
  Tarif_Consultation: "90 €",
  Info_Remboursement: "Mutuelles.",
  Info_Paiement: "Après la séance.",
  Note_Google: "4,8 / 5",
  Nombre_Avis_Google: "23 avis",
  Horaires: "Mo-Fr 08:30-19:00; Sa 08:30-12:30",
  GPS_Coordonnees: "49.481194, 6.084361",
  Url_Google_My_Business: "https://g.page/r/ABC",
  Url_Profil_LinkedIn: "https://www.linkedin.com/in/jeanne",
  Url_Profil_Vide: "[À COMPLÉTER]",
  Langues_Parlees: "Français, Anglais ; Italien",
  Acces_Train: "Gare à 280 m",
  Acces_Bus: "[À VALIDER]",
  Acces_Parking: "Parking à 150 m",
  Acces_PMR: "Ascenseur",
  Wero_Numero_Ou_Email: "+352 691 044 147",
  Numero_Autorisation_Exercer: "M-123",
  Statut_TVA: "Non assujetti",
};

/**
 * Lignes de la base. Url_Booking est saisie comme un lien (texte « Réserver » + URL), comme dans Notion ;
 * `overrides` remplace une valeur (texte brut) ou retire la ligne (null).
 */
function general(overrides: Record<string, string | null> = {}) {
  const booking = "Url_Booking" in overrides ? [] : [kv("Url_Booking", "Réserver", "https://cal.eu/cabinet/consultation")];
  const values = Object.entries({ ...GENERAL_VALUES, ...overrides }).filter((entry): entry is [string, string] => entry[1] !== null);
  const blank = kv("", ""); // ligne vide, fréquente dans une base Notion : ignorée
  return [...booking, blank, ...values.map(([key, value]) => kv(key, value))];
}

/** Avertissements liés aux autres bases (vides dans ces tests). */
const OTHER_DATABASES = /A_Propos|Page_Paiement|Url_Photo_/;

describe("fetchSiteContent : Informations_generales", () => {
  it("toutes les valeurs renseignées : lues, normalisées, sans avertissement sur ces champs", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ general: general() }));
    expect(content.practitioner).toEqual({ name: "Jeanne Test", title: "Ostéopathe D.O." });
    expect(content.seo).toEqual({ h1: "Ostéopathe à Dudelange", heroSubtitle: "Soulager la douleur.", metaTitle: "Titre SEO", metaDescription: "Description SEO" });
    expect(content.contact).toEqual({
      street: "46 Avenue Grande-Duchesse Charlotte",
      postalCode: "3440",
      locality: "Dudelange",
      countryName: "Luxembourg",
      countryCode: "LU",
      phoneDisplay: "+352 51 92 92",
      phoneE164: "+352519292",
      mobilePhone: { display: "+352 691 044 147", e164: "+352691044147" },
      geo: { latitude: 49.481194, longitude: 6.084361 },
      email: "cabinet@exemple.lu",
    });
    expect(content.booking).toEqual({
      url: "https://cal.eu/cabinet/consultation",
      provider: "cal",
      calLink: "cabinet/consultation",
      calOrigin: "https://app.cal.eu",
    });
    expect(content.consultation).toEqual({ durationLabel: "45 minutes", durationMinutes: 45, price: "90 €", reimbursement: "Mutuelles." });
    expect(content.rating).toEqual({ value: 4.8, count: 23 });
    expect(content.openingHours).toEqual([
      { days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:30", closes: "19:00" },
      { days: ["Sa"], opens: "08:30", closes: "12:30" },
    ]);
    expect(content.openingHoursLines).toEqual(formatOpeningHours(content.openingHours!));
    expect(content.languages).toEqual(["Français", "Anglais", "Italien"]);
    expect(content.googleBusinessUrl).toBe("https://g.page/r/ABC");
    expect(content.sameAs).toEqual(["https://g.page/r/ABC", "https://www.linkedin.com/in/jeanne"]);
    expect(content.access).toEqual({ train: "Gare à 280 m", bus: null, parking: "Parking à 150 m", accessibility: "Ascenseur" });
    expect(content.legal).toEqual({ authorizationNumber: "M-123", vatStatus: "Non assujetti" });
    expect(content.payment.info).toBe("Après la séance.");
    expect(content.payment.wero.recipient).toEqual({ value: "+352 691 044 147", kind: "phone" });
    expect(warnings.filter((w) => !OTHER_DATABASES.test(w))).toEqual([]);
  });

  it("Telephone_RAW, s'il existe, donne le lien tel: (le texte affiché reste Telephone_Display)", async () => {
    const { content } = await fetchSiteContent(fakeNotion({ general: general({ Telephone_RAW: "+352 519 293" }) }));
    expect(content.contact.phoneDisplay).toBe("+352 51 92 92");
    expect(content.contact.phoneE164).toBe("+352519293");
  });

  it("lien tel: : Telephone_RAW au format « 00 » converti ; placeholder ignoré (numéro affiché utilisé)", async () => {
    const zero = await fetchSiteContent(fakeNotion({ general: general({ Telephone_RAW: "00352 519 293" }) }));
    expect(zero.content.contact.phoneE164).toBe("+352519293");
    const placeholder = await fetchSiteContent(
      fakeNotion({ general: general({ Telephone_Display: "+352 51 92 94", Telephone_RAW: "[À COMPLÉTER]" }) }),
    );
    expect(placeholder.content.contact.phoneE164).toBe("+352519294");
    for (const { warnings } of [zero, placeholder]) expect(warnings.filter((w) => !OTHER_DATABASES.test(w))).toEqual([]);
  });

  it("numéro d'appel illisible (sans indicatif, ou texte) : numéro de secours pour les liens tel: et avertissement", async () => {
    const noCode = await fetchSiteContent(fakeNotion({ general: general({ Telephone_RAW: "51 92 93" }) }));
    expect(noCode.content.contact.phoneE164).toBe(F.contact.phoneE164);
    expect(noCode.warnings).toContain(
      "Numéro d'appel illisible : « 51 92 93 » (Telephone_RAW, sinon Telephone_Display ; attendu : « +352 51 92 92 ») — numéro de secours utilisé",
    );
    const text = await fetchSiteContent(fakeNotion({ general: general({ Telephone_Display: "Sur rendez-vous" }) }));
    expect(text.content.contact.phoneDisplay).toBe("Sur rendez-vous");
    expect(text.content.contact.phoneE164).toBe(F.contact.phoneE164);
    expect(text.warnings.filter((w) => w.startsWith("Numéro d'appel illisible"))).toEqual([
      "Numéro d'appel illisible : « Sur rendez-vous » (Telephone_RAW, sinon Telephone_Display ; attendu : « +352 51 92 92 ») — numéro de secours utilisé",
    ]);
  });

  it("valeurs lues telles que saisies : rognées, ville et pays de Notion, ligne de bus renseignée", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: general({
          Nom_Praticien: "  Jeanne Test  ",
          Code_Postal_Ville: "4001 Esch-sur-Alzette, Grand-Duché de Luxembourg",
          Acces_Bus: "Ligne 5, arrêt Gare",
        }),
      }),
    );
    expect(content.practitioner.name).toBe("Jeanne Test");
    expect(content.contact).toMatchObject({ postalCode: "4001", locality: "Esch-sur-Alzette", countryName: "Grand-Duché de Luxembourg" });
    expect(content.access.bus).toBe("Ligne 5, arrêt Gare");
    expect(warnings.filter((w) => !OTHER_DATABASES.test(w))).toEqual([]);
  });

  it("GPS à compléter : valeur de secours, sans le signaler comme illisible", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ general: general({ GPS_Coordonnees: "[À COMPLÉTER]" }) }));
    expect(content.contact.geo).toEqual(F.contact.geo);
    expect(warnings.filter((w) => w.startsWith("GPS_Coordonnees"))).toEqual([
      "GPS_Coordonnees non renseigné dans Notion (valeur de secours utilisée)",
    ]);
  });

  it("note sans nombre d'avis : nombre inconnu (null), la note reste affichée", async () => {
    const { content } = await fetchSiteContent(fakeNotion({ general: general({ Nombre_Avis_Google: null }) }));
    expect(content.rating).toEqual({ value: 4.8, count: null });
  });

  it("base vide : valeurs de secours partout, et un avertissement par champ obligatoire", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({}));
    expect(content.practitioner).toEqual(F.practitioner);
    expect(content.contact.street).toBe(F.contact.street);
    expect(content.contact.postalCode).toBe(F.contact.postalCode);
    expect(content.contact.geo).toEqual(F.contact.geo);
    expect(content.booking).toEqual(F.booking);
    expect(content.consultation.price).toBeNull();
    expect(content.rating).toBeNull();
    expect(content.openingHours).toBeNull();
    expect(content.openingHoursLines).toEqual([]);
    expect(content.languages).toEqual([]);
    expect(content.sameAs).toEqual([]);
    expect(content.contact.mobilePhone).toBeNull();
    expect(content.contact.email).toBeNull();
    for (const field of ["Nom_Praticien", "Metier_Titre", "Titre_SEO_H1", "Sous_Titre_Hero", "Adresse_Rue", "Telephone_Display", "Duree_Consultation", "Info_Remboursement", "Info_Paiement"]) {
      expect(warnings).toContain(`Champ obligatoire vide dans Notion : ${field} (valeur de secours utilisée)`);
    }
    expect(warnings).toEqual(
      expect.arrayContaining([
        "Code_Postal_Ville illisible (attendu : « 3440 Dudelange, Luxembourg »)",
        "Url_Booking manquante ou invalide (valeur de secours utilisée)",
        "Tarif_Consultation non renseigné : la ligne « Tarif » sera masquée",
        "GPS_Coordonnees non renseigné dans Notion (valeur de secours utilisée)",
        "Wero_Numero_Ou_Email non renseigné : /paiement explique Wero sans afficher de numéro",
      ]),
    );
    // Champ vide ≠ champ illisible : pas d'avertissement « illisible » pour ce qui n'est pas saisi.
    expect(warnings.filter((w) => w.includes("illisible") && !w.startsWith("Code_Postal_Ville"))).toEqual([]);
    expect(warnings.filter((w) => w.startsWith("Horaires"))).toEqual([]);
  });

  it("horaires avec un jour fermé (texte Notion réel) : JSON-LD structuré, affichage tel que saisi, sans avertissement", async () => {
    const real =
      "Lundi : 08:30–19:00 ; Mardi : 07:00–16:45 ; Mercredi : 08:30–19:00 ; Jeudi : 08:30–19:00 ; Vendredi : 08:30–17:45 ; Samedi : 08:30–12:30 ; Dimanche : fermé";
    const { content, warnings } = await fetchSiteContent(fakeNotion({ general: general({ Horaires: real }) }));
    expect(content.openingHours?.map((r) => `${r.days.join(",")} ${r.opens}-${r.closes}`)).toEqual([
      "Mo 08:30-19:00", "Tu 07:00-16:45", "We 08:30-19:00", "Th 08:30-19:00", "Fr 08:30-17:45", "Sa 08:30-12:30",
    ]);
    expect(content.openingHoursLines).toEqual(real.split(" ; "));
    expect(warnings.filter((w) => w.startsWith("Horaires"))).toEqual([]);
  });

  it("valeurs illisibles : non publiées, avertissement précis (visible dans notion:check)", async () => {
    const rows = general({
      Horaires: "Sur rendez-vous uniquement",
      Telephone_Mobile: "691 044 147",
      GPS_Coordonnees: "au centre-ville",
      Wero_Numero_Ou_Email: "patrice",
      Url_Booking: "http://cal.eu/x",
    });
    const { content, warnings } = await fetchSiteContent(fakeNotion({ general: rows }));
    expect(content.openingHours).toBeNull();
    expect(content.openingHoursLines).toEqual(["Sur rendez-vous uniquement"]);
    expect(content.contact.mobilePhone).toBeNull();
    expect(content.contact.geo).toEqual(F.contact.geo);
    expect(content.payment.wero.recipient).toBeNull();
    expect(content.booking).toEqual(F.booking);
    expect(warnings).toEqual(
      expect.arrayContaining([
        "Horaires non structurés (affichés tels quels, absents du JSON-LD) : « Sur rendez-vous uniquement »",
        "Telephone_Mobile illisible : « 691 044 147 » (attendu : « +352 6XX XXX XXX ») — numéro masqué",
        "GPS_Coordonnees illisible : « au centre-ville »",
        "GPS_Coordonnees non renseigné dans Notion (valeur de secours utilisée)",
        "Wero_Numero_Ou_Email illisible : « patrice » (numéro de mobile ou e-mail attendu) — non publié",
        "Url_Booking manquante ou invalide (valeur de secours utilisée)",
      ]),
    );
  });

  it("URL de réservation d'un autre prestataire : lien simple (aucune intégration Cal.com)", async () => {
    const { content } = await fetchSiteContent(fakeNotion({ general: general({ Url_Booking: "https://www.doctena.lu/rdv" }) }));
    expect(content.booking).toEqual({ url: "https://www.doctena.lu/rdv", provider: "generic", calLink: null, calOrigin: null });
  });
});

/** Ligne de Medias_Images : colonne URL (publique) + Alt_description + éventuel fichier Notion (ignoré). */
const imageRow = (key: string, url: string | null, alt: string, files = 0) =>
  row({ Variable: prop.title(key), URL: prop.url(url), Alt_description: prop.text(alt), Image: prop.files(files) });

describe("fetchSiteContent : Medias_Images (règle 3)", () => {
  it("URL publique sur un hôte autorisé + alt Notion : image utilisée, aux dimensions de son emplacement", async () => {
    const { content } = await fetchSiteContent(
      fakeNotion({ images: [imageRow("Url_Photo_Hero", "https://abc.public.blob.vercel-storage.com/hero.jpg", "Le cabinet")] }),
    );
    expect(content.images.hero).toEqual({ src: "https://abc.public.blob.vercel-storage.com/hero.jpg", alt: "Le cabinet", width: 960, height: 1200 });
  });

  it("hôte non autorisé : placeholder + avertissement", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ images: [imageRow("Url_Photo_Portrait", "https://evil.test/p.jpg", "Portrait")] }));
    expect(content.images.portrait.src).toBeNull();
    expect(content.images.portrait).toMatchObject({ alt: "Portrait", width: 800, height: 1000 });
    expect(warnings).toContain("Url_Photo_Portrait : hôte d'image non autorisé (https://evil.test/p.jpg) — voir src/config/images.ts");
  });

  it("fichier téléversé dans Notion sans URL : ignoré (URL temporaire), avertissement explicite", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ images: [imageRow("Url_Photo_Cabinet", null, "Cabinet", 1)] }));
    expect(content.images.cabinet).toEqual({ src: null, alt: "Cabinet", width: 1200, height: 800 });
    expect(warnings).toContain(
      "Url_Photo_Cabinet : fichier téléversé dans Notion ignoré (URL temporaire). Coller une URL publique dans la colonne URL.",
    );
  });

  it("alt vide ou ligne absente : alt de secours (jamais d'image sans alt) + avertissement", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ images: [imageRow("Url_Photo_Hero", "https://images.unsplash.com/x.jpg", "")] }),
    );
    expect(content.images.hero.alt).toBe(F.images.hero.alt);
    expect(content.images.portrait).toEqual({ ...F.images.portrait, src: null });
    expect(warnings).toEqual(
      expect.arrayContaining([
        "Url_Photo_Hero : Alt_description vide (alt de secours utilisé)",
        "Url_Photo_Portrait : Alt_description vide (alt de secours utilisé)",
      ]),
    );
    expect(warnings.filter((w) => w.includes("fichier téléversé") || w.includes("non autorisé"))).toEqual([]);
  });
});

/** Ligne d'Avis_Patients. */
const reviewRow = (name: string, text: string, note: string, date: string | null, published?: boolean) =>
  row({
    Nom_Patient: prop.title(name),
    Avis_Texte: prop.text(text),
    Note: prop.text(note),
    Date: prop.date(date),
    ...(published === undefined ? {} : { Publié: prop.checkbox(published) }),
  });

describe("fetchSiteContent : Section A_Propos", () => {
  it("formation, formations continues, titre et biographies lus depuis Notion", async () => {
    const about = [
      kv("Formation", "D.O., London School of Osteopathy, 2010"),
      kv("Formations_Continues", "Ostéopathie pédiatrique ; Sport"),
      kv("Titre", "Mon parcours"),
      kv("Bio_Courte", "Ostéopathe à Dudelange."),
      kv("Bio_Detaillee", "Ancien sportif de haut niveau."),
    ];
    const { content, warnings } = await fetchSiteContent(fakeNotion({ about }));
    expect(content.about).toMatchObject({
      education: "D.O., London School of Osteopathy, 2010",
      continuingEducation: ["Ostéopathie pédiatrique", "Sport"],
      title: "Mon parcours",
      shortBio: "Ostéopathe à Dudelange.",
      longBio: "Ancien sportif de haut niveau.",
    });
    expect(warnings.filter((w) => w.includes("A_Propos"))).toEqual([]);
  });
});

describe("fetchSiteContent : Avis_Patients", () => {
  it("du plus récent au plus ancien, nom réduit (minimisation), avis masqués ou vides ignorés", async () => {
    const { content } = await fetchSiteContent(
      fakeNotion({
        reviews: [
          reviewRow("Paul Sans-Date", "Correct.", "4", null),
          reviewRow("Yves Schweicher", "Très bien.", "5", "2026-03-01"),
          reviewRow("Michelle", "Parfait.", "4,5", "2026-06-15", true),
          reviewRow("Caché Patient", "Masqué.", "5", "2026-07-01", false),
          reviewRow("Sans Texte", "", "5", "2026-08-01"),
          reviewRow("Anne Sans-Date", "Bien.", "", null),
        ],
      }),
    );
    expect(content.reviews).toEqual([
      { author: "Michelle", rating: 4.5, text: "Parfait.", date: "2026-06-15" },
      { author: "Yves S.", rating: 5, text: "Très bien.", date: "2026-03-01" },
      { author: "Paul S.", rating: 4, text: "Correct.", date: null }, // sans date : après les avis datés, ordre de Notion
      { author: "Anne S.", rating: null, text: "Bien.", date: null },
    ]);
  });
});

/** Ligne de FAQ_SEO. */
const faqRow = (question: string, answer: string, order: number | null, options: { published?: boolean; created?: string } = {}) =>
  row(
    {
      Name: prop.title(question),
      Reponse: prop.text(answer),
      Ordre: prop.number(order),
      ...(options.published === undefined ? {} : { Publié: prop.checkbox(options.published) }),
    },
    { created: options.created },
  );

describe("fetchSiteContent : FAQ_SEO", () => {
  it("triée par Ordre, puis sans ordre par date de création ; questions masquées ou sans réponse ignorées", async () => {
    const { content } = await fetchSiteContent(
      fakeNotion({
        faq: [
          faqRow("Sans ordre, récente ?", "R.", null, { created: "2026-05-01T00:00:00.000Z" }),
          faqRow("Deuxième ?", "R2.", 2),
          faqRow("Sans ordre, ancienne ?", "R.", null, { created: "2026-01-01T00:00:00.000Z" }),
          faqRow("Première ?", "R1.", 1),
          faqRow("Masquée ?", "R.", 0, { published: false }),
          faqRow("Sans réponse ?", "", 3),
        ],
      }),
    );
    expect(content.faq.map((f) => f.question)).toEqual(["Première ?", "Deuxième ?", "Sans ordre, ancienne ?", "Sans ordre, récente ?"]);
    expect(content.faq[0]).toEqual({ question: "Première ?", answer: "R1." });
  });

  it("« {tarif} » et « {duree} » remplacés par Tarif_Consultation et Duree_Consultation", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: general({ Tarif_Consultation: "95 €", Duree_Consultation: "50 minutes" }),
        faq: [faqRow("Combien coûte {Tarif} ?", "La séance de {duree} coûte {tarif}.", 1)],
      }),
    );
    expect(content.faq).toEqual([{ question: "Combien coûte 95 € ?", answer: "La séance de 50 minutes coûte 95 €." }]);
    expect(warnings.filter((w) => w.startsWith("FAQ"))).toEqual([]);
  });

  it("variable sans valeur ou inconnue : question masquée et signalée, les autres restent", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: general({ Tarif_Consultation: "[Mettre le tarif]" }),
        faq: [
          faqRow("Combien coûte une séance ?", "{tarif}, réglée après la séance.", 1),
          faqRow("Durée ?", "{durée_séance}.", 2),
          faqRow("Gardée ?", "Séance de {duree}.", 3),
        ],
      }),
    );
    expect(content.faq).toEqual([{ question: "Gardée ?", answer: "Séance de 45 minutes." }]);
    expect(warnings).toContain("FAQ « Combien coûte une séance ? » : « {tarif} » sans valeur (Tarif_Consultation non renseigné) — question masquée");
    expect(warnings).toContain("FAQ « Durée ? » : variable inconnue « {durée_séance} » (disponibles : {tarif}, {duree}) — question masquée");
  });
});

/** Ligne de Motifs_Consultation (sans colonne Page_Validée : pas de page détaillée). */
const motifRow = (title: string, slug: string, order: number | null, icon = "Activity", published?: boolean) =>
  row({
    Motif: prop.title(title),
    "slug URL": prop.text(slug),
    Description_Courte: prop.text(`${title}.`),
    Icone_Lucide: prop.text(icon),
    Ordre: prop.number(order),
    ...(published === undefined ? {} : { Publié: prop.checkbox(published) }),
  });

describe("fetchSiteContent : Motifs_Consultation (cartes)", () => {
  it("ordre, slug déduit du titre si absent, motifs sans titre ou masqués ignorés, icône inconnue signalée", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        motifs: [
          motifRow("Sans ordre", "sans-ordre", null),
          motifRow("Dos & Nuque", "", 2),
          motifRow("", "vide", 0),
          motifRow("Masqué", "masque", 1, "Activity", false),
          motifRow("Sport", "sport", 1, "IconeInexistante"),
        ],
      }),
    );
    expect(content.motifs.map((m) => [m.title, m.slug])).toEqual([
      ["Sport", "sport"],
      ["Dos & Nuque", "dos-nuque"],
      ["Sans ordre", "sans-ordre"],
    ]);
    expect(content.motifs[0]).toMatchObject({ description: "Sport.", icon: "Sparkles", page: null }); // icône inconnue => défaut
    expect(content.motifs[1]).toMatchObject({ icon: "Activity" });
    expect(warnings).toContain("Icône Lucide inconnue « IconeInexistante » pour « Sport » (icône par défaut)");
  });
});

describe("fetchSiteContent : tri des lignes", () => {
  it("Ordre égal : départage par date de création ; sans Ordre : date de création, quel que soit l'ordre reçu de l'API", async () => {
    const at = (day: string) => ({ created: `2026-01-${day}T00:00:00.000Z` });
    const rows = [
      faqRow("A ?", "R.", 1, at("01")),
      faqRow("B ?", "R.", 1, at("02")),
      faqRow("C ?", "R.", null, at("03")),
      faqRow("D ?", "R.", null, at("04")),
      faqRow("E ?", "R.", null, at("05")),
    ];
    // Deux ordres d'arrivée : le résultat ne doit dépendre que d'Ordre et de la date de création.
    for (const received of [rows, [...rows].reverse()]) {
      const { content } = await fetchSiteContent(fakeNotion({ faq: received }));
      expect(content.faq.map((f) => f.question)).toEqual(["A ?", "B ?", "C ?", "D ?", "E ?"]);
    }
  });
});

describe("fetchSiteContent : lecture des bases Notion", () => {
  it("objet partiel renvoyé par l'API (sans propriétés) : ignoré, sans erreur", async () => {
    const partial = { object: "page", id: "partielle" };
    const { content } = await fetchSiteContent(fakeNotion({ faq: [partial, faqRow("Gardée ?", "R.", 1)] }));
    expect(content.faq.map((f) => f.question)).toEqual(["Gardée ?"]);
  });

  it("toutes les pages de résultats sont lues (pagination de l'API)", async () => {
    const faq = Array.from({ length: 5 }, (_, i) => faqRow(`Q${i} ?`, `R${i}.`, i));
    const { content } = await fetchSiteContent(fakeNotion({ faq }, { pageSize: 2 }));
    expect(content.faq.map((f) => f.question)).toEqual(["Q0 ?", "Q1 ?", "Q2 ?", "Q3 ?", "Q4 ?"]);
  });

  it("lignes dans la corbeille Notion ignorées", async () => {
    const trashed = row({ Name: prop.title("Supprimée ?"), Reponse: prop.text("R."), Ordre: prop.number(0) }, { trashed: true });
    const { content } = await fetchSiteContent(fakeNotion({ faq: [trashed, faqRow("Gardée ?", "R.", 1)] }));
    expect(content.faq.map((f) => f.question)).toEqual(["Gardée ?"]);
  });

  it("base non partagée avec l'intégration : erreur explicite (jamais de contenu partiel silencieux)", async () => {
    await expect(fetchSiteContent(fakeNotion({}, { inaccessible: ["faq"] }))).rejects.toThrow(
      /Base Notion [0-9a-f]+ inaccessible \(intégration non connectée \?\)/,
    );
  });
});

describe("fetchSiteContent : avertissements remontés par les réglages d'affichage", () => {
  it("Page_Paiement : les avertissements de construction de la page sont remontés", async () => {
    const payment = [
      row({ Name: prop.title("Titre_Page"), Type: prop.text("Texte"), Texte: prop.text("Payer") }),
      row({ Name: prop.title("Cle_Inconnue"), Type: prop.text("Texte"), Texte: prop.text("x") }),
    ];
    const { content, warnings } = await fetchSiteContent(fakeNotion({ payment }));
    expect(content.payment.page.title).toBe("Payer");
    expect(warnings).toContain("Page_Paiement : clé « Cle_Inconnue » inconnue, ligne ignorée");
  });

  it("Infos_Ordre : identifiant inconnu signalé, avec la liste des identifiants attendus", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ general: general({ Infos_Ordre: "tarif, carte" }) }));
    expect(content.rowOrder.infos[0]).toBe("tarif");
    expect(warnings).toContain(
      "Infos_Ordre : identifiant inconnu « carte » (attendus : acces, telephone, duree, tarif, reglement, remboursement, horaires, langues)",
    );
  });

  it("Page_Paiement : une ligne décochée dans « Publié » est ignorée", async () => {
    const payment = [
      row({ Name: prop.title("Titre_Page"), Type: prop.text("Texte"), Texte: prop.text("Payer"), Ordre: prop.number(1) }),
      row({ Name: prop.title("Titre_Page"), Type: prop.text("Texte"), Texte: prop.text("Brouillon"), Ordre: prop.number(2), Publié: prop.checkbox(false) }),
    ];
    const { content } = await fetchSiteContent(fakeNotion({ payment }));
    expect(content.payment.page.title).toBe("Payer");
  });

  it("Acces_Ordre : identifiant inconnu signalé, avec la liste des identifiants attendus", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ general: general({ Acces_Ordre: "bus, metro" }) }));
    expect(content.rowOrder.access[0]).toBe("bus");
    expect(warnings).toContain("Acces_Ordre : identifiant inconnu « metro » (attendus : adresse, train, bus, parking, pmr)");
  });
});
