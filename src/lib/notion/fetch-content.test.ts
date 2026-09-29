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
