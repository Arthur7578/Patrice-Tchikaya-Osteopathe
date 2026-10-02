import { NOTION_DATABASES, type NotionDatabaseKey } from "@/config/site";
import type { NotionClient } from "@/lib/notion/client";

/** Propriétés Notion, réduites à ce que lit le code (src/lib/notion/properties.ts). */
export const prop = {
  title: (text: string) => ({ type: "title", title: text ? [{ plain_text: text, href: null }] : [] }),
  text: (text: string, href: string | null = null) => ({ type: "rich_text", rich_text: text ? [{ plain_text: text, href }] : [] }),
  url: (url: string | null) => ({ type: "url", url }),
  number: (value: number | null) => ({ type: "number", number: value }),
  checkbox: (checked: boolean) => ({ type: "checkbox", checkbox: checked }),
  date: (start: string | null) => ({ type: "date", date: start ? { start } : null }),
  files: (count: number) => ({ type: "files", files: Array.from({ length: count }, (_, i) => ({ name: `f${i}` })) }),
};

let sequence = 0;

/** Ligne (page) d'une base Notion. `created` sert au tri par défaut (date de création). */
export function row(properties: Record<string, unknown>, options: { id?: string; created?: string; trashed?: boolean } = {}) {
  sequence += 1;
  const id = options.id ?? `row-${sequence}`;
  return {
    object: "page",
    id,
    url: `https://www.notion.so/${id}`,
    created_time: options.created ?? `2026-01-01T00:00:${String(sequence % 60).padStart(2, "0")}.000Z`,
    last_edited_time: "2026-09-29T21:03:59.543Z",
    in_trash: options.trashed ?? false,
    properties,
  };
}

/** Ligne d'une base clé/valeur (Variable -> Valeur), valeur en texte enrichi (éventuellement lien). */
export const kv = (variable: string, value: string, href: string | null = null) =>
  row({ Variable: prop.title(variable), Valeur: prop.text(value, href) });

type FakeOptions = {
  /** Corps (blocs) des pages, par id de page. */
  pageBlocks?: Record<string, unknown[]>;
  /** Pages dont le corps a été lu (rempli par le client simulé). */
  blockReads?: string[];
  /** Nombre de lignes par page de résultats (pagination de l'API). */
  pageSize?: number;
  /** Bases renvoyées sans data source (intégration non connectée). */
  inaccessible?: NotionDatabaseKey[];
};

/** Client Notion simulé : une data source par base, lignes fournies par base (vide sinon), pagination réelle. */
export function fakeNotion(rows: Partial<Record<NotionDatabaseKey, unknown[]>>, options: FakeOptions = {}): NotionClient {
  const { pageBlocks = {}, blockReads = [], pageSize = 100, inaccessible = [] } = options;
  const keyById = new Map<string, NotionDatabaseKey>(
    (Object.keys(NOTION_DATABASES) as NotionDatabaseKey[]).map((key) => [NOTION_DATABASES[key], key]),
  );
  const paginate = (all: unknown[], cursor: string | undefined) => {
    const start = cursor ? Number(cursor) : 0;
    const next = start + pageSize;
    return { results: all.slice(start, next), next_cursor: next < all.length ? String(next) : null, has_more: next < all.length };
  };
  return {
    databases: {
      retrieve: async ({ database_id }: { database_id: string }) => ({
        object: "database",
        title: [],
        data_sources: inaccessible.includes(keyById.get(database_id)!) ? [] : [{ id: database_id }],
      }),
    },
    dataSources: {
      query: async ({ data_source_id, start_cursor }: { data_source_id: string; start_cursor?: string }) =>
        paginate(rows[keyById.get(data_source_id)!] ?? [], start_cursor),
    },
    blocks: {
      children: {
        list: async ({ block_id, start_cursor }: { block_id: string; start_cursor?: string }) => {
          blockReads.push(block_id);
          return paginate(pageBlocks[block_id] ?? [], start_cursor);
        },
      },
    },
  } as unknown as NotionClient;
}
