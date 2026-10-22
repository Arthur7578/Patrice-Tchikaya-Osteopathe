import "server-only";
import { list, put } from "@vercel/blob";
import { isLocale, type Locale } from "@/config/i18n";

/**
 * Slug traduit, enregistré une fois pour toutes : page (`pageKey` : identifiant Notion), slug français au moment de
 * l'enregistrement, langue, slug traduit, date. Jamais modifié ni supprimé : un slug français qui change crée de
 * nouveaux enregistrements, les anciens restent et servent à rediriger les anciennes adresses.
 */
export type SlugRecord = { pageKey: string; frSlug: string; locale: Locale; slug: string; createdAt: number };

export type SlugStore = {
  /** Tous les enregistrements. `fresh` : sans cache (avant d'en créer, pour ne jamais créer un doublon). */
  list(options?: { fresh?: boolean }): Promise<SlugRecord[]>;
  create(record: Omit<SlugRecord, "createdAt">): Promise<void>;
};

const PREFIX = "i18n/slugs/";

/** Chemin d'un enregistrement : tout est dans le nom (fichier vide), une seule liste suffit à tout relire. */
export const slugPath = (r: Omit<SlugRecord, "createdAt">) => `${PREFIX}${r.pageKey}/${r.frSlug}/${r.locale}/${r.slug}`;

/** Lit un chemin d'enregistrement ; null s'il ne correspond pas au format. */
export function parseSlugPath(pathname: string, uploadedAt: Date): SlugRecord | null {
  if (!pathname.startsWith(PREFIX)) return null;
  const [pageKey, frSlug, locale, slug, ...rest] = pathname.slice(PREFIX.length).split("/");
  if (!pageKey || !frSlug || !locale || !slug || rest.length > 0 || !isLocale(locale)) return null;
  return { pageKey, frSlug, locale, slug, createdAt: uploadedAt.getTime() };
}

/**
 * Stockage dans Vercel Blob (store du projet : `BLOB_STORE_ID` avec l'authentification OIDC de Vercel, ou
 * `BLOB_READ_WRITE_TOKEN`). Sans store configuré (dev, CI) : null, et les slugs restent en français.
 */
export function blobSlugStore(env: NodeJS.ProcessEnv = process.env): SlugStore | null {
  if (!env.BLOB_STORE_ID && !env.BLOB_READ_WRITE_TOKEN) return null;
  const listAll = async () => {
    const records: SlugRecord[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
      for (const blob of page.blobs) {
        const record = parseSlugPath(blob.pathname, new Date(blob.uploadedAt));
        if (record) records.push(record);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return records;
  };
  return {
    list: listAll,
    async create(record) {
      const pathname = slugPath(record);
      try {
        await put(pathname, "1", { access: "public", addRandomSuffix: false, contentType: "text/plain" });
      } catch (error) {
        // Déjà créé (par un autre processus du build, par exemple) : rien à faire. Toute autre erreur est levée.
        if (!(await listAll()).some((r) => slugPath(r) === pathname)) throw error;
      }
    },
  };
}
