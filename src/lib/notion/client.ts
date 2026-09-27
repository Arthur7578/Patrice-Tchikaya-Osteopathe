import { Client } from "@notionhq/client";

/** Version d'API épinglée (data sources). Ne pas changer sans relire le guide de migration Notion. */
export const NOTION_API_VERSION = "2025-09-03";

export function createNotionClient(token: string) {
  return new Client({ auth: token, notionVersion: NOTION_API_VERSION, timeoutMs: 15_000 });
}
export type NotionClient = ReturnType<typeof createNotionClient>;
