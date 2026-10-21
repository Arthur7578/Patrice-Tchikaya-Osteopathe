import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { translationMode, type Locale } from "@/config/i18n";
import type { SiteContent } from "@/lib/content/types";
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
 * Traduction d'un lot, mise en cache sans expiration (cache de données Next, partagé entre les requêtes) sous
 * l'empreinte de son texte français, de la langue, du modèle et des consignes : un lot inchangé dans Notion n'est
 * jamais retraduit ; une erreur n'est jamais mise en cache (la requête suivante réessaie).
 */
function translateBatch(batch: TextBatch, locale: Locale): Promise<TextBatch> {
  const mode = translationMode();
  const hash = createHash("sha256")
    .update(JSON.stringify([mode, TRANSLATION_MODEL, PROMPT_VERSION, locale, batch]))
    .digest("hex");
  let pending = inFlight.get(hash);
  if (!pending) {
    pending = unstable_cache(() => translator()(batch, locale), ["translation", hash], {
      revalidate: false,
      tags: [TRANSLATIONS_TAG],
    })();
    inFlight.set(hash, pending);
    pending.catch(() => {}).finally(() => inFlight.delete(hash));
  }
  return pending;
}

/** Contenu traduit dans `locale` (tous les lots en parallèle). Une erreur de traduction est levée, comme une erreur Notion. */
export async function localizeContent(content: SiteContent, locale: Locale): Promise<SiteContent> {
  const groups = collectTranslatable(content);
  const entries = await Promise.all(
    Object.entries(groups).map(async ([group, batch]) => [group, await translateBatch(batch, locale)] as const),
  );
  const translations: TranslationGroups = Object.fromEntries(entries);
  return applyTranslations(content, locale, translations);
}
