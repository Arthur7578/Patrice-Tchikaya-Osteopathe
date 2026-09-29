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
