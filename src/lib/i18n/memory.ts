import "server-only";
import { createHash } from "node:crypto";
import { get, list, put } from "@vercel/blob";
import type { Locale } from "@/config/i18n";
import type { TextBatch } from "./translate";

/**
 * Version de la mémoire : à incrémenter pour tout faire retraduire (changement de consignes qui doit s'appliquer aux
 * textes déjà traduits). Changer de modèle ne retraduit rien : une traduction validée reste bonne.
 */
export const MEMORY_VERSION = 1;

/** Empreinte d'un texte français dans une langue : clé de la mémoire. */
export const memoryKey = (locale: Locale, source: string) =>
  createHash("sha256").update(JSON.stringify([MEMORY_VERSION, locale, source])).digest("hex");

/** Mémoire de traduction : empreinte (memoryKey) → traduction validée. */
export type TranslationMemory = {
  load(): Promise<Map<string, string>>;
  /** Enregistre des traductions validées (empreinte → texte). */
  save(entries: Record<string, string>): Promise<void>;
};

const PREFIX = "i18n/translations/";

/**
 * Mémoire de traduction dans Vercel Blob, partagée par tous les builds et toutes les régénérations, en production comme
 * en preview : un texte n'est traduit qu'une fois dans chaque langue, quel que soit le cache du build (le build de
 * production ne récupère pas celui des previews). Fichiers JSON nommés par l'empreinte de leur contenu : deux
 * processus qui enregistrent en même temps ne s'écrasent pas. Sans store (dev, CI) : null.
 */
export function blobTranslationMemory(env: NodeJS.ProcessEnv = process.env): TranslationMemory | null {
  if (!env.BLOB_STORE_ID && !env.BLOB_READ_WRITE_TOKEN) return null;
  return {
    async load() {
      const pathnames: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
        pathnames.push(...page.blobs.map((b) => b.pathname));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const files = await Promise.all(
        pathnames.map(async (pathname) => {
          const file = await get(pathname, { access: "public" });
          return file?.statusCode === 200 ? (JSON.parse(await new Response(file.stream).text()) as TextBatch) : {};
        }),
      );
      return new Map(files.flatMap((f) => Object.entries(f)));
    },
    async save(entries) {
      if (Object.keys(entries).length === 0) return;
      const body = JSON.stringify(entries);
      const name = createHash("sha256").update(body).digest("hex");
      try {
        // Nom = empreinte du contenu : réécrire un fichier, c'est réécrire le même contenu (deux processus du build).
        await put(`${PREFIX}${name}.json`, body, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
      } catch (error) {
        // Une mémoire non enregistrée coûte seulement une retraduction plus tard : la page est publiée quand même.
        console.warn(`[i18n] mémoire de traduction non enregistrée : ${error instanceof Error ? error.message : error}`);
      }
    },
  };
}
