import Anthropic from "@anthropic-ai/sdk";
import { LOCALE_META, type Locale } from "@/config/i18n";
import { countDoctorMentions, hasTitleBeforeName } from "./rules";

/** Lot de textes : clé → texte. Le traducteur renvoie les mêmes clés. */
export type TextBatch = Record<string, string>;
/** `names` : noms du praticien, auxquels aucun titre de docteur ne doit être accolé (vérification). */
export type Translator = (batch: TextBatch, locale: Locale, names?: string[]) => Promise<TextBatch>;

/**
 * Modèle de traduction : le plus capable (Claude Fable 5.1), choisi par Arthur pour la qualité, notamment en
 * luxembourgeois ; le volume est faible (un lot n'est retraduit que si son texte français change). Surchargeable
 * par TRANSLATION_MODEL.
 */
export const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL || "claude-fable-5-1";

/**
 * Version des consignes : à incrémenter quand SYSTEM_PROMPT change, pour que tout soit retraduit
 * (elle fait partie de la clé de cache, comme le modèle).
 */
export const PROMPT_VERSION = 2;

const SYSTEM_PROMPT = `You translate the website of an osteopath's practice in Dudelange, Luxembourg, from French into the target language given by the user. Patients read these pages to decide whether to book a session, so the translation must be accurate, natural and warm, as a native professional copywriter in that language would write it. Address the reader formally (polite form) where the language distinguishes it.

Rules you must always follow:
- Translate the meaning faithfully. Never add, remove or soften medical claims, conditions, prices, durations or promises. Do not add any information.
- The practitioner is an osteopath (ostéopathe D.O.). Osteopathy is a health profession distinct from medicine: never present him or his practice as a doctor, physician or medical practice, and never give him a title such as "Dr" (English "doctor"/"physician"; German "Arzt"/"Doktor"/"Arztpraxis"; Luxembourgish "Dokter"; Portuguese "médico"/"doutor"). Translate "ostéopathe" as the usual word for osteopath in the target language and "cabinet" as a practice, not a medical office.
- The French text may mention doctors as other professionals (for example "consultez un médecin en cas d'urgence", "votre médecin traitant"): translate those mentions faithfully, with the usual word for a doctor in the target language. Never add a mention of a doctor that the French text does not contain.
- Keep unchanged: personal names, the city name "Dudelange" and other place names, street addresses, brand and product names (Wero, Doctena, Cal.com, Google, Google Maps, CNS, Payconiq, Visa, Mastercard…), e-mail addresses, URLs, phone numbers, numbers, prices and currency symbols, and the title "D.O.".
- Keep the inline tags <b>, </b>, <i>, </i>, <code>, </code>, <a n="…"> and </a> exactly as written (same tags, same n values, properly nested), moving them only as word order requires. Keep the escaped characters &lt; &gt; &amp; as they are. Do not add any markup of your own.
- Keep line breaks inside a text where the French text has them.
- Each value is translated on its own; keep consistent terminology across values.

The user message is a JSON object of id → French text. Reply with a JSON object with exactly the same ids, each mapped to its translation.`;

/** Erreur de validation d'une traduction (la réponse est rejetée et redemandée). */
export class TranslationError extends Error {}

/** Balises d'une chaîne, dans l'ordre (pour vérifier que la traduction les conserve). */
const tagsOf = (text: string) => (text.match(/<\/?(?:a|b|i|code)(?: n="\d+")?>/g) ?? []).sort();

/**
 * Vérifie une traduction avant de l'accepter (et donc de la mettre en cache) : mêmes clés, aucun texte vide,
 * balises conservées, et règle 10. Parler d'un médecin reste permis (« consultez un médecin en cas d'urgence » se
 * traduit fidèlement) ; ce qui est refusé : une traduction qui mentionne un médecin plus souvent que le français
 * (l'ostéopathe présenté comme médecin), ou un titre de docteur accolé au nom du praticien.
 * Renvoie la liste des problèmes (vide = traduction acceptée).
 */
export function validateTranslation(source: TextBatch, translated: unknown, names: string[] = []): string[] {
  if (!translated || typeof translated !== "object") return ["réponse non JSON"];
  const out = translated as Record<string, unknown>;
  const problems: string[] = [];
  for (const [key, text] of Object.entries(source)) {
    const value = out[key];
    if (typeof value !== "string" || !value.trim()) {
      problems.push(`${key} : traduction absente`);
      continue;
    }
    if (tagsOf(value).join() !== tagsOf(text).join()) problems.push(`${key} : balises modifiées`);
    if (countDoctorMentions(value) > countDoctorMentions(text)) problems.push(`${key} : médecin ajouté (règle 10)`);
    if (hasTitleBeforeName(value, names)) problems.push(`${key} : titre de docteur accolé au praticien (règle 10)`);
  }
  return problems;
}

/** Traducteur Claude : un appel par lot, réponse JSON contrainte par schéma, validée, redemandée 2 fois au plus. */
export function createClaudeTranslator(client: Anthropic = new Anthropic()): Translator {
  return async (batch, locale, names = []) => {
    const keys = Object.keys(batch);
    if (keys.length === 0) return {};
    const schema = {
      type: "object",
      properties: Object.fromEntries(keys.map((k) => [k, { type: "string" }])),
      required: keys,
      additionalProperties: false,
    };
    let problems: string[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const message = await client.beta.messages
        .stream({
          model: TRANSLATION_MODEL,
          max_tokens: 64000,
          // Pas de paramètre `thinking` : toujours actif sur Claude Fable 5.1 (le préciser est refusé). Effort élevé : qualité.
          output_config: { effort: "high", format: { type: "json_schema", schema } },
          // Si le modèle refusait le texte (faux positif des filtres), l'API relance la requête sur un autre modèle.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Target language: ${LOCALE_META[locale].englishName}.\n\n${JSON.stringify(batch, null, 2)}`,
            },
          ],
        })
        .finalMessage();
      if (message.stop_reason === "refusal") throw new TranslationError(`traduction refusée (${locale})`);
      if (message.stop_reason === "max_tokens") throw new TranslationError(`traduction tronquée (${locale})`);
      const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      problems = validateTranslation(batch, parsed, names);
      if (problems.length === 0) {
        const out = parsed as TextBatch;
        return Object.fromEntries(keys.map((k) => [k, out[k]!]));
      }
      console.warn(`[i18n] traduction ${locale} rejetée (essai ${attempt}/3) : ${problems.join(" ; ")}`);
    }
    throw new TranslationError(`traduction ${locale} invalide : ${problems.join(" ; ")}`);
  };
}

/** Traducteur « identity » (CI, tests) : renvoie le français. Ne sert jamais en production (voir translationMode). */
export const identityTranslator: Translator = async (batch) => ({ ...batch });
