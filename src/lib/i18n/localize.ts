import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { translationMode, type Locale } from "@/config/i18n";
import type { SiteContent } from "@/lib/content/types";
import { sharedOnDisk } from "./file-cache";
import { applyTranslations, collectTranslatable, type TranslationGroups } from "./localize-content";
import { createClaudeTranslator, identityTranslator, PROMPT_VERSION, TRANSLATION_MODEL, type TextBatch, type Translator } from "./translate";

/** Étiquette du cache des traductions (jamais purgée par /api/revalidate : une traduction ne se périme pas). */
export const TRANSLATIONS_TAG = "translations";

let claude: Translator | null = null;
const translator = (): Translator =>
  translationMode() === "claude" ? (claude ??= createClaudeTranslator()) : identityTranslator;

/** Traductions en cours dans ce processus : une page régénérée en même temps qu'une autre attend le même appel. */
const inFlight = new Map<string, Promise<TextBatch>>();

/**
 * Traduction d'un lot, mise en cache sans expiration sous l'empreinte de son texte français, de la langue, du modèle
 * et des consignes : un lot inchangé dans Notion n'est jamais retraduit ; une erreur n'est jamais mise en cache (la
 * requête suivante réessaie). Trois niveaux : traductions en cours dans ce processus, cache de données Next (partagé
 * entre les requêtes), puis disque (partagé entre les processus du build et conservé d'un build Vercel à l'autre).
 */
function translateBatch(batch: TextBatch, locale: Locale, names: string[]): Promise<TextBatch> {
  const mode = translationMode();
  const hash = createHash("sha256")
    .update(JSON.stringify([mode, TRANSLATION_MODEL, PROMPT_VERSION, locale, batch]))
    .digest("hex");
  let pending = inFlight.get(hash);
  if (!pending) {
    pending = unstable_cache(() => sharedOnDisk(hash, () => translator()(batch, locale, names)), ["translation", hash], {
      revalidate: false,
      tags: [TRANSLATIONS_TAG],
    })();
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
