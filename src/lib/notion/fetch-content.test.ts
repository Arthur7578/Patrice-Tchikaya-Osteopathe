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

/** Client Notion simulé : une data source par base, lignes fournies par base (vide sinon). */
function fakeNotion(rows: Partial<Record<NotionDatabaseKey, unknown[]>>): NotionClient {
  const rowsById = new Map<string, unknown[]>(
    (Object.keys(NOTION_DATABASES) as NotionDatabaseKey[]).map((key) => [NOTION_DATABASES[key], rows[key] ?? []]),
  );
  return {
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
    const { content } = await fetchSiteContent(
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

describe("fetchSiteContent : règlement après la séance (page /paiement)", () => {
  it("état réel de Notion : lignes « à compléter » masquées, texte et conseil publiés", async () => {
    // Valeurs exactes des lignes créées dans Informations_generales le 29/09/2026.
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: [
          kvRow("Info_Paiement", "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés."),
          kvRow("Wero_Numero_Ou_Email", "[À COMPLÉTER : numéro de mobile ou adresse e-mail Wero du cabinet]"),
          kvRow("Wero_Nom_Beneficiaire", "[À COMPLÉTER : nom tel qu'affiché par Wero avant la validation du paiement]"),
          kvRow("Autres_Moyens_Paiement", "[À COMPLÉTER — facultatif : autres moyens de paiement acceptés, en texte libre. Laisser tel quel pour ne rien afficher]"),
          kvRow("Wero_Conseil_Message", "En message, précisez le nom du patient et la date de la séance."),
          kvRow("Paiement_Mise_En_Garde", "[Facultatif — encart « Bon à savoir » sous les étapes de paiement. Laisser tel quel pour ne rien afficher]"),
        ],
      }),
    );
    expect(content.payment).toEqual({
      info: "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés.",
      wero: { recipient: null, recipientName: null },
      otherMethods: null,
      messageTip: "En message, précisez le nom du patient et la date de la séance.",
      caution: null,
    });
    expect(warnings).toContain("Wero_Numero_Ou_Email non renseigné : /paiement explique Wero sans afficher de numéro");
    expect(warnings.filter((w) => w.includes("Info_Paiement"))).toEqual([]);
  });

  it("champs renseignés : coordonnées Wero, autres moyens et encart publiés ; conseil vide => masqué", async () => {
    const { content, warnings } = await fetchSiteContent(
      fakeNotion({
        general: [
          kvRow("Wero_Numero_Ou_Email", "+352 621 000 000"),
          kvRow("Wero_Nom_Beneficiaire", "Patrice Tchikaya"),
          kvRow("Autres_Moyens_Paiement", "Espèces sur place."),
          kvRow("Wero_Conseil_Message", ""),
          kvRow("Paiement_Mise_En_Garde", "Un paiement Wero est immédiat."),
        ],
      }),
    );
    expect(content.payment.wero).toEqual({
      recipient: { value: "+352 621 000 000", kind: "phone" },
      recipientName: "Patrice Tchikaya",
    });
    expect(content.payment.otherMethods).toBe("Espèces sur place.");
    expect(content.payment.messageTip).toBeNull();
    expect(content.payment.caution).toBe("Un paiement Wero est immédiat.");
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
