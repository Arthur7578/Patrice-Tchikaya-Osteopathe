import { describe, expect, it } from "vitest";
import { NOTION_DATABASES, type NotionDatabaseKey } from "@/config/site";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import type { NotionClient } from "./client";
import { fetchSiteContent } from "./fetch-content";

/** Ligne d'une base clé/valeur (Variable -> Valeur), réduite à ce que lit le code. */
function kvRow(variable: string, valeur: string) {
  return {
    object: "page",
    id: variable,
    url: `https://www.notion.so/${variable}`,
    created_time: "2026-09-28T00:00:00.000Z",
    in_trash: false,
    properties: {
      Variable: { type: "title", title: [{ plain_text: variable }] },
      Valeur: { type: "rich_text", rich_text: [{ plain_text: valeur }] },
    },
  };
}

/**
 * Client Notion simulé : une data source par base, lignes fournies par base (vide sinon) ;
 * corps de page (blocs) fournis par id de page, avec la liste des pages dont le corps a été lu.
 */
function fakeNotion(
  rows: Partial<Record<NotionDatabaseKey, unknown[]>>,
  pageBlocks: Record<string, unknown[]> = {},
  blockReads: string[] = [],
): NotionClient {
  const rowsById = new Map<string, unknown[]>(
    (Object.keys(NOTION_DATABASES) as NotionDatabaseKey[]).map((key) => [NOTION_DATABASES[key], rows[key] ?? []]),
  );
  return {
    blocks: {
      children: {
        list: async ({ block_id }: { block_id: string }) => {
          blockReads.push(block_id);
          return { results: pageBlocks[block_id] ?? [], next_cursor: null };
        },
      },
    },
    databases: {
      retrieve: async ({ database_id }: { database_id: string }) => ({
        object: "database",
        title: [],
        data_sources: [{ id: database_id }],
      }),
    },
    dataSources: {
      query: async ({ data_source_id }: { data_source_id: string }) => ({
        results: rowsById.get(data_source_id) ?? [],
        next_cursor: null,
      }),
    },
  } as unknown as NotionClient;
}

describe("fetchSiteContent : cartes d'expertise de la section À propos", () => {
  it("lit titre, texte et icône depuis Notion ; icône vide => icône par défaut de la carte", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        about: [
          kvRow("Expertise_1_Titre", "Ancien joueur de handball"),
          kvRow("Expertise_1_Texte", "Traumatismes sportifs."),
          kvRow("Expertise_1_Icone", "Dumbbell"),
          kvRow("Expertise_2_Titre", "Ancien cadre en entreprise"),
          kvRow("Expertise_2_Texte", "Stress et TMS."),
          kvRow("Expertise_2_Icone", "[À COMPLÉTER]"),
          kvRow("Expertise_3_Titre", "Ostéopathe D.O."),
          kvRow("Expertise_3_Texte", "Approche globale."),
        ],
      }),
    );
    expect(content.about.expertises).toEqual([
      { title: "Ancien joueur de handball", text: "Traumatismes sportifs.", icon: "Dumbbell" },
      { title: "Ancien cadre en entreprise", text: "Stress et TMS.", icon: "Briefcase" },
      { title: "Ostéopathe D.O.", text: "Approche globale.", icon: "BadgeCheck" },
    ]);
    expect(warnings.filter((w) => w.includes("Icône"))).toEqual([]); // icône vide ou à compléter : pas une erreur
  });

  it("ignore une carte incomplète et signale une icône inconnue", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        about: [
          kvRow("Expertise_1_Titre", "Carte sans texte"),
          kvRow("Expertise_2_Titre", "Deuxième carte"),
          kvRow("Expertise_2_Texte", "Texte."),
          kvRow("Expertise_2_Icone", "trophy"), // casse incorrecte
          kvRow("Expertise_4_Titre", "Quatrième carte"),
          kvRow("Expertise_4_Texte", "Texte."),
          kvRow("Expertise_4_Icone", "constructor"), // propriété héritée d'Object, pas une icône
        ],
      }),
    );
    expect(content.about.expertises).toEqual([
      { title: "Deuxième carte", text: "Texte.", icon: "Briefcase" },
      { title: "Quatrième carte", text: "Texte.", icon: "Trophy" },
    ]);
    expect(warnings).toContain("Icône Lucide inconnue « trophy » pour Expertise_2_Icone (icône par défaut)");
    expect(warnings).toContain("Icône Lucide inconnue « constructor » pour Expertise_4_Icone (icône par défaut)");
  });

  it("sans carte dans Notion : cartes de secours", async () => {
    const { content } = await fetchSiteContent(fakeNotion({ about: [kvRow("Titre", "Titre")] }));
    expect(content.about.expertises).toEqual(FALLBACK_CONTENT.about.expertises);
  });
});

/** Ligne de Motifs_Consultation ; `validated` absent = colonne Page_Validée inexistante. */
function motifRow(id: string, slug: string, validated?: boolean) {
  return {
    object: "page",
    id,
    url: `https://www.notion.so/${id}`,
    created_time: "2026-09-27T00:00:00.000Z",
    last_edited_time: "2026-09-29T21:03:59.543Z",
    in_trash: false,
    properties: {
      Motif: { type: "title", title: [{ plain_text: `Motif ${id}` }] },
      "slug URL": { type: "rich_text", rich_text: [{ plain_text: slug }] },
      Description_Courte: { type: "rich_text", rich_text: [{ plain_text: "Description courte." }] },
      Icone_Lucide: { type: "rich_text", rich_text: [{ plain_text: "Activity" }] },
      ...(validated === undefined ? {} : { Page_Validée: { type: "checkbox", checkbox: validated } }),
    },
  };
}

/** Paragraphe Notion de `words` mots. */
function paragraph(words: number) {
  const text = Array.from({ length: words }, (_, i) => `mot${i}`).join(" ");
  const annotations = { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default" };
  return {
    object: "block",
    id: `p${words}`,
    type: "paragraph",
    has_children: false,
    in_trash: false,
    paragraph: { color: "default", rich_text: [{ type: "text", plain_text: text, href: null, annotations }] },
  };
}

describe("fetchSiteContent : pages motifs (phase 9)", () => {
  it("publie la page d'un motif validé dont le corps atteint le seuil de mots", async () => {
    const reads: string[] = [];
    const { content } = await fetchSiteContent(
      fakeNotion({ motifs: [motifRow("m1", "osteopathie-du-sport-dudelange", true)] }, { m1: [paragraph(320)] }, reads),
    );
    expect(reads).toEqual(["m1"]);
    expect(content.motifs[0].page).toEqual({
      blocks: [{ type: "paragraph", text: [{ text: expect.stringMatching(/^mot0 /) }] }],
      wordCount: 320,
      lastEdited: "2026-09-29T21:03:59.543Z",
    });
  });

  it("seuil de mots atteint exactement : page publiée ; colonne Page_Validée présente : aucun avertissement", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ motifs: [motifRow("m1", "bilan", true)] }, { m1: [paragraph(300)] }));
    expect(content.motifs[0].page?.wordCount).toBe(300);
    expect(warnings.filter((w) => w.includes("Page_Validée") || w.includes("Motif m1"))).toEqual([]);
  });

  it("avertissements du corps de la page préfixés par la page ; blocs incomplets de l'API ignorés sans bruit", async () => {
    const table = { object: "block", id: "t1", type: "table", has_children: false, in_trash: false, table: {} };
    const partial = { object: "block", id: "partiel" }; // réponse partielle de l'API (sans type)
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ motifs: [motifRow("m1", "bilan", true)] }, { m1: [paragraph(320), table, partial] }),
    );
    expect(content.motifs[0].page?.wordCount).toBe(320);
    expect(warnings.filter((w) => w.startsWith("Page « Motif m1 »"))).toEqual([
      "Page « Motif m1 » : bloc « table » non pris en charge : ignoré",
    ]);
  });

  it("ne lit jamais le corps d'une page non validée", async () => {
    const reads: string[] = [];
    const { content } = await fetchSiteContent(
      fakeNotion({ motifs: [motifRow("m1", "bilan", false)] }, { m1: [paragraph(500)] }, reads),
    );
    expect(reads).toEqual([]);
    expect(content.motifs[0].page).toBeNull();
    expect(content.motifs[0].title).toBe("Motif m1"); // la carte reste affichée
  });

  it("page validée trop courte : non publiée, avec avertissement", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ motifs: [motifRow("m1", "bilan", true)] }, { m1: [paragraph(120)] }),
    );
    expect(content.motifs[0].page).toBeNull();
    expect(warnings).toContain("Page « Motif m1 » validée mais trop courte (120 mots, minimum 300) : non publiée");
  });

  it("slug réservé par le site : page non publiée, corps non lu", async () => {
    const reads: string[] = [];
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ motifs: [motifRow("m1", "mentions-legales", true)] }, { m1: [paragraph(500)] }, reads),
    );
    expect(reads).toEqual([]);
    expect(content.motifs[0].page).toBeNull();
    expect(warnings).toContain("Page « Motif m1 » : slug « mentions-legales » déjà utilisé par le site, page non publiée");
  });

  it("colonne Page_Validée absente : aucune page, un seul avertissement", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ motifs: [motifRow("m1", "a"), motifRow("m2", "b")] }, { m1: [paragraph(500)] }),
    );
    expect(content.motifs.map((m) => m.page)).toEqual([null, null]);
    expect(warnings.filter((w) => w.includes("Page_Validée"))).toHaveLength(1);
  });

  it("sans motif dans Notion : cartes de secours, jamais leurs pages", async () => {
    const { content } = await fetchSiteContent(fakeNotion({}));
    expect(content.motifs.map((m) => m.slug)).toEqual(FALLBACK_CONTENT.motifs.map((m) => m.slug));
    expect(content.motifs.every((m) => m.page === null)).toBe(true);
  });
});

describe("fetchSiteContent : ordre des blocs Infos pratiques / lignes Accès", () => {
  it("applique Infos_Ordre et Acces_Ordre, signale les identifiants inconnus", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ general: [kvRow("Infos_Ordre", "tarif, horaires, oups"), kvRow("Acces_Ordre", "parking, adresse")] }),
    );
    expect(content.rowOrder.infos.slice(0, 2)).toEqual(["tarif", "horaires"]);
    expect(content.rowOrder.access).toEqual(["parking", "adresse", "train", "bus", "pmr"]);
    expect(warnings.some((w) => w.includes("Infos_Ordre") && w.includes("oups"))).toBe(true);
  });

  it("applique Hero_Points : seuls les points listés, dans l'ordre", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ general: [kvRow("Hero_Points", "duree, tarif, ordonnance, confirmation, oups")] }),
    );
    expect(content.rowOrder.hero).toEqual(["duree", "tarif", "ordonnance", "confirmation"]);
    expect(warnings.some((w) => w.includes("Hero_Points") && w.includes("oups"))).toBe(true);
  });

  it("sans clé : ordre par défaut", async () => {
    const { content } = await fetchSiteContent(fakeNotion({ general: [kvRow("Nom_Praticien", "Patrice")] }));
    expect(content.rowOrder).toEqual(FALLBACK_CONTENT.rowOrder);
  });
});

/** Ligne de la base Page_Paiement (Name, Type, Texte, Ordre), réduite à ce que lit le code. */
function payRow(name: string, type: string, texte: string, ordre?: number) {
  return {
    object: "page",
    id: `${type}-${name}`,
    url: `https://www.notion.so/${encodeURIComponent(name)}`,
    created_time: "2026-09-29T00:00:00.000Z",
    in_trash: false,
    properties: {
      Name: { type: "title", title: [{ plain_text: name }] },
      Type: { type: "select", select: { name: type } },
      Texte: { type: "rich_text", rich_text: [{ plain_text: texte }] },
      Ordre: { type: "number", number: ordre ?? null },
    },
  };
}

/** Les 27 lignes de la base Notion Page_Paiement (créées le 29/09/2026, relues le 01/10/2026) : [Name, Type, Texte, Ordre]. */
const PAGE_PAIEMENT_NOTION: Array<[string, string, string, number?]> = [
  ["Titre_Page", "Texte", "Régler votre séance"],
  ["Surtitre", "Texte", "Paiement"],
  ["Introduction", "Texte", "Voici comment payer avec Wero, en quelques secondes depuis votre téléphone."],
  ["Titre_Etapes", "Texte", "Payer avec Wero, étape par étape"],
  ["Titre_Securite", "Texte", "Un paiement simple et sûr"],
  ["Titre_Premiere_Utilisation", "Texte", "Première utilisation de Wero ?"],
  ["Titre_Aide", "Texte", "Pas de Wero, ou une question ?"],
  ["Texte_Aide", "Texte", "Votre banque ne propose pas encore Wero, ou vous avez une question sur le règlement ? Appelez le cabinet :"],
  ["Encart", "Texte", "[Facultatif — encart « Bon à savoir » sous les étapes de paiement. Laisser tel quel pour ne rien afficher]"],
  ["Meta_Title", "Texte", "[Facultatif — titre de la page dans l'onglet du navigateur et sur Google. Laisser tel quel pour utiliser le titre par défaut]"],
  ["Meta_Description", "Texte", "[Facultatif — description de la page sur Google (70 à 160 caractères). Laisser tel quel pour utiliser la description par défaut]"],
  ["Libelle_Numero", "Texte", "Numéro Wero"],
  ["Libelle_Email", "Texte", "Adresse e-mail Wero"],
  ["Libelle_Nom", "Texte", "Nom affiché par Wero"],
  ["Libelle_Tarif", "Texte", "Tarif de la consultation"],
  ["Libelle_Encart", "Texte", "Bon à savoir"],
  ["Libelle_Autres_Moyens", "Texte", "Autres moyens de paiement acceptés"],
  ["Ouvrez Wero", "Étape", "Dans l'application Wero, ou dans l'application de votre banque si Wero y est intégré.", 1],
  ["Choisissez le destinataire", "Étape", "Choisissez l'envoi d'argent, puis saisissez le numéro de mobile ou l'adresse e-mail Wero de Patrice Tchikaya.", 2],
  ["Indiquez le montant", "Étape", "Saisissez le montant de votre séance. En message, précisez le nom du patient et la date de la séance.", 3],
  ["Vérifiez, puis validez", "Étape", "Contrôlez le nom du bénéficiaire affiché et le montant, puis validez avec votre empreinte, votre visage ou votre code. L'argent arrive en quelques secondes.", 4],
  ["Une solution des banques européennes", "Sécurité", "Wero est développé par l'European Payments Initiative (EPI), soutenue par de grandes banques européennes.", 1],
  ["Aucune coordonnée bancaire à partager", "Sécurité", "Un numéro de mobile ou une adresse e-mail suffit : ni IBAN, ni numéro de carte.", 2],
  ["Validé par vous seul", "Sécurité", "Aucun paiement ne part sans votre validation dans l'application : empreinte, reconnaissance faciale ou code.", 3],
  ["Le bon destinataire, en quelques secondes", "Sécurité", "Wero affiche le nom du bénéficiaire avant que vous validiez, puis l'argent arrive en quelques secondes.", 4],
  ["Votre banque est au Luxembourg", "Première utilisation", "Téléchargez l'application Wero, puis reliez-la à votre compte : votre identité est vérifiée via LuxTrust ou l'application de votre banque.\nWero est proposé notamment par Spuerkeess, BGL BNP Paribas, BIL, Banque Raiffeisen et POST.\nVous utilisiez Payconiq ? Wero le remplace au Luxembourg depuis septembre 2026.", 1],
  ["Votre banque est en France, en Belgique ou en Allemagne", "Première utilisation", "Wero y est proposé par de nombreuses banques, souvent directement dans leur application : cherchez « Wero » dans ses menus.", 2],
];

const payRows = (rows = PAGE_PAIEMENT_NOTION) => rows.map(([name, type, texte, ordre]) => payRow(name, type, texte, ordre));

describe("fetchSiteContent : règlement après la séance (page /paiement)", () => {
  it("lignes Notion actuelles de Page_Paiement : mêmes textes que l'instantané de secours (pas de dérive)", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({ payment: payRows() }));
    expect(content.payment.page).toEqual(FALLBACK_CONTENT.payment.page);
    expect(warnings.filter((w) => w.includes("Page_Paiement"))).toEqual([]);
  });

  it("base Page_Paiement vide : instantané de secours + avertissement", async () => {
    const { content, warnings } = await fetchSiteContent(fakeNotion({}));
    expect(content.payment.page).toEqual(FALLBACK_CONTENT.payment.page);
    expect(warnings).toContain("Page_Paiement vide : texte de secours utilisé pour /paiement");
  });

  it("modifications faites dans Notion : texte changé, encart activé, étape ajoutée et réordonnée, section retirée", async () => {
    const edited = PAGE_PAIEMENT_NOTION.filter(([, type]) => type !== "Sécurité") // toutes les lignes « Sécurité » supprimées
      .map(([name, type, texte, ordre]): [string, string, string, number?] => {
        if (name === "Titre_Page") return [name, type, "Payer votre séance", ordre];
        if (name === "Libelle_Numero") return [name, type, "Numéro Wero de Patrice", ordre];
        if (name === "Encart") return [name, type, "Un paiement Wero est immédiat.", ordre];
        if (name === "Ouvrez Wero") return [name, type, texte, 2]; // permutation avec « Choisissez le destinataire »
        if (name === "Choisissez le destinataire") return [name, type, texte, 1];
        return [name, type, texte, ordre];
      });
    edited.push(["Confirmez", "Étape", "Le cabinet reçoit le paiement.", 5]);
    const { content } = await fetchSiteContent(fakeNotion({ payment: payRows(edited) }));
    const page = content.payment.page;
    expect(page.title).toBe("Payer votre séance");
    expect(page.labels.phone).toBe("Numéro Wero de Patrice");
    expect(page.labels.email).toBe("Adresse e-mail Wero");
    expect(page.caution).toBe("Un paiement Wero est immédiat.");
    expect(page.steps?.cards.map((c) => c.title)).toEqual([
      "Choisissez le destinataire",
      "Ouvrez Wero",
      "Indiquez le montant",
      "Vérifiez, puis validez",
      "Confirmez",
    ]);
    expect(page.reassurance).toBeNull();
    expect(page.firstTime?.cards).toHaveLength(2);
  });

  it("lignes « à compléter » (Notion au 29/09/2026) : masquées, phrase de règlement publiée", async () => {
    // Valeurs exactes des lignes créées dans Informations_generales le 29/09/2026.
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: [
          kvRow("Info_Paiement", "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés."),
          kvRow("Wero_Numero_Ou_Email", "[À COMPLÉTER : numéro de mobile ou adresse e-mail Wero du cabinet]"),
          kvRow("Wero_Nom_Beneficiaire", "[À COMPLÉTER : nom tel qu'affiché par Wero avant la validation du paiement]"),
          kvRow("Autres_Moyens_Paiement", "[À COMPLÉTER — facultatif : autres moyens de paiement acceptés, en texte libre. Laisser tel quel pour ne rien afficher]"),
        ],
      }),
    );
    expect(content.payment).toEqual({
      info: "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés.",
      wero: { recipient: null, recipientName: null },
      otherMethods: null,
      page: FALLBACK_CONTENT.payment.page,
    });
    expect(warnings).toContain("Wero_Numero_Ou_Email non renseigné : /paiement explique Wero sans afficher de numéro");
    expect(warnings.filter((w) => w.includes("Info_Paiement"))).toEqual([]);
  });

  it("champs renseignés : coordonnées Wero et autres moyens publiés", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: [
          kvRow("Wero_Numero_Ou_Email", "+352 621 000 000"),
          kvRow("Wero_Nom_Beneficiaire", "Patrice Tchikaya"),
          kvRow("Autres_Moyens_Paiement", "Espèces sur place."),
        ],
      }),
    );
    expect(content.payment.wero).toEqual({
      recipient: { value: "+352 621 000 000", kind: "phone" },
      recipientName: "Patrice Tchikaya",
    });
    expect(content.payment.otherMethods).toBe("Espèces sur place.");
    expect(warnings.filter((w) => w.includes("Wero_Numero_Ou_Email"))).toEqual([]);
  });

  it("Info_Paiement absente => texte de secours + avertissement ; coordonnée Wero illisible => non publiée", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({ general: [kvRow("Wero_Numero_Ou_Email", "Patrice")] }),
    );
    expect(content.payment.info).toBe(FALLBACK_CONTENT.payment.info);
    expect(content.payment.wero.recipient).toBeNull();
    expect(warnings).toContain("Champ obligatoire vide dans Notion : Info_Paiement (valeur de secours utilisée)");
    expect(warnings.some((w) => w.startsWith("Wero_Numero_Ou_Email illisible"))).toBe(true);
  });
});
