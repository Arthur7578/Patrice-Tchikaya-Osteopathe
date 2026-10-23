import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { translationMode, type Locale } from "@/config/i18n";
import type { SiteContent } from "@/lib/content/types";
import { sharedOnDisk } from "./file-cache";
import { applyTranslations, collectTranslatable, type TranslationGroups } from "./localize-content";
import { blobTranslationMemory, memoryKey, type TranslationMemory } from "./memory";
import { createClaudeTranslator, identityTranslator, PROMPT_VERSION, TRANSLATION_MODEL, type TextBatch, type Translator } from "./translate";

/** Étiquette du cache des traductions (jamais purgée par /api/revalidate : une traduction ne se périme pas). */
export const TRANSLATIONS_TAG = "translations";

let claude: Translator | null = null;
const translator = (): Translator =>
  translationMode() === "claude" ? (claude ??= createClaudeTranslator()) : identityTranslator;

/** Lecture de la mémoire de traduction, en cache 5 min (une liste Blob par instance au plus). */
const TRANSLATION_MEMORY_TAG = "translation-memory";
let memory: { store: TranslationMemory; load: () => Promise<Array<[string, string]>> } | null | undefined;
const getMemory = () => {
  if (memory === undefined) {
    const store = blobTranslationMemory();
    memory = store && {
      store,
      load: unstable_cache(async () => [...(await store.load())], ["translation-memory"], { revalidate: 300, tags: [TRANSLATION_MEMORY_TAG] }),
    };
  }
  return memory;
};

/** Empreintes connues de la mémoire dans ce processus (lues ou enregistrées) : évite les écritures en double. */
const inMemory = new Set<string>();

/** Sépare un lot entre textes déjà en mémoire (traduits) et textes jamais traduits. */
function split(batch: TextBatch, locale: Locale, known: Array<[string, string]>) {
  const map = new Map(known);
  for (const hash of map.keys()) inMemory.add(hash);
  const hits: TextBatch = {};
  const missing: TextBatch = {};
  for (const [key, text] of Object.entries(batch)) {
    const found = map.get(memoryKey(locale, text));
    if (found === undefined) missing[key] = text;
    else hits[key] = found;
  }
  return { hits, missing };
}

/**
 * Traduction d'un lot avec la mémoire : seuls les textes jamais traduits partent à l'API, et chaque traduction validée
 * y est enregistrée. Avant tout appel payant, la mémoire est relue sans cache (un autre build vient peut-être de les
 * traduire). Un texte que le traducteur n'a pas pu traduire n'est pas enregistré : il sera redemandé.
 */
async function translateWithMemory(batch: TextBatch, locale: Locale, names: string[]): Promise<TextBatch> {
  const mem = translationMode() === "claude" ? getMemory() : null;
  if (!mem) return translator()(batch, locale, names);
  let { hits, missing } = split(batch, locale, await mem.load());
  if (Object.keys(missing).length > 0) ({ hits, missing } = split(batch, locale, [...(await mem.store.load())]));
  if (Object.keys(missing).length === 0) return hits;
  const fresh = await translator()(missing, locale, names);
  const entries = Object.fromEntries(Object.entries(fresh).map(([key, text]) => [memoryKey(locale, missing[key]!), text]));
  await mem.store.save(entries);
  for (const hash of Object.keys(entries)) inMemory.add(hash);
  return { ...hits, ...fresh };
}

/**
 * Recopie dans la mémoire les traductions servies par un cache (disque du build, cache de données Next) et qu'elle
 * n'a pas encore : sans cela, une traduction faite avant la mémoire, ou restée dans le cache d'une preview, serait
 * refaite par le build de production. Un texte identique au français n'est pas recopié (texte peut-être laissé en
 * français après 3 refus, par l'ancien code). Une erreur ne bloque jamais la page.
 */
async function backfillMemory(batch: TextBatch, locale: Locale, result: TextBatch): Promise<void> {
  const mem = translationMode() === "claude" ? getMemory() : null;
  if (!mem) return;
  const candidates = Object.entries(result).flatMap(([key, text]) =>
    batch[key] !== undefined && text !== batch[key] ? [[memoryKey(locale, batch[key]!), text] as const] : [],
  );
  if (candidates.every(([hash]) => inMemory.has(hash))) return;
  try {
    for (const [hash] of await mem.load()) inMemory.add(hash);
    const entries = Object.fromEntries(candidates.filter(([hash]) => !inMemory.has(hash)));
    await mem.store.save(entries);
    for (const hash of Object.keys(entries)) inMemory.add(hash);
  } catch (error) {
    console.warn(`[i18n] mémoire de traduction non complétée : ${error instanceof Error ? error.message : error}`);
  }
}

/** Traductions en cours dans ce processus : une page régénérée en même temps qu'une autre attend le même appel. */
const inFlight = new Map<string, Promise<TextBatch>>();

/**
 * Traduction d'un lot, mise en cache sans expiration sous l'empreinte de son texte français, de la langue, du modèle
 * et des consignes : un lot inchangé dans Notion n'est jamais retraduit ; une erreur n'est jamais mise en cache (la
 * requête suivante réessaie). Quatre niveaux : traductions en cours dans ce processus, cache de données Next (partagé
 * entre les requêtes), disque (un seul appel par lot entre les processus du build), puis mémoire de traduction Blob
 * (partagée par tous les déploiements : seul un texte jamais traduit part à l'API).
 */
function translateBatch(batch: TextBatch, locale: Locale, names: string[]): Promise<TextBatch> {
  const mode = translationMode();
  const hash = createHash("sha256")
    .update(JSON.stringify([mode, TRANSLATION_MODEL, PROMPT_VERSION, locale, batch]))
    .digest("hex");
  let pending = inFlight.get(hash);
  if (!pending) {
    pending = unstable_cache(() => sharedOnDisk(hash, () => translateWithMemory(batch, locale, names)), ["translation", hash], {
      revalidate: false,
      tags: [TRANSLATIONS_TAG],
    })().then(async (result) => {
      await backfillMemory(batch, locale, result);
      return result;
    });
    inFlight.set(hash, pending);
    pending.catch(() => {}).finally(() => inFlight.delete(hash));
  }
  return pending;
}

/** Lot de textes traduit (avec les mêmes caches) : sert aussi aux slugs (src/lib/i18n/slugs.ts). */
export const translateTexts = (batch: TextBatch, locale: Locale) => translateBatch(batch, locale, []);

/** Contenu traduit dans `locale` (tous les lots en parallèle). Une erreur de traduction est levée, comme une erreur Notion. */
export async function localizeContent(content: SiteContent, locale: Locale): Promise<SiteContent> {
  const groups = collectTranslatable(content);
  const names = content.practitioner.name.split(/\s+/);
  const entries = await Promise.all(
    Object.entries(groups).map(async ([group, batch]) => [group, await translateBatch(batch, locale, names)] as const),
  );
  const translations: TranslationGroups = Object.fromEntries(entries);
  return applyTranslations(content, locale, translations);
}
