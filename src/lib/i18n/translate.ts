import Anthropic from "@anthropic-ai/sdk";
import { LOCALE_META, type Locale } from "@/config/i18n";
import { countDoctorMentions, doctorMentions, hasTitleBeforeName } from "./rules";

/** Lot de textes : clé → texte. Le traducteur renvoie les mêmes clés, sauf les textes qu'il n'a pas pu traduire. */
export type TextBatch = Record<string, string>;
/** `names` : noms du praticien, auxquels aucun titre de docteur ne doit être accolé (vérification). */
export type Translator = (batch: TextBatch, locale: Locale, names?: string[]) => Promise<TextBatch>;

/**
 * Modèle de traduction : Claude Opus 5.5 (choix d'Arthur : Claude Fable 5.1, plus capable, est trop cher), en effort
 * bas : traduire ne demande pas de longue réflexion, et la réflexion est facturée comme du texte produit (c'était
 * l'essentiel du coût en effort élevé). Chaque texte n'est traduit qu'une fois (mémoire de traduction, memory.ts).
 * Surchargeable par TRANSLATION_MODEL.
 */
export const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL || "claude-opus-5-5";

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
- Values whose id starts with "slug." are the words of a page address (URL): translate them into a short, natural phrase in the target language that people would search for, keeping place names such as "Dudelange", without punctuation.
- Values whose id starts with "reviews." are patient reviews quoted on the site: translate them faithfully in the patient's own voice and register, without improving, shortening or correcting them. A review may be written in a language other than French: translate it into the target language too, and return it unchanged if it is already in the target language.

The user message is a JSON object of id → French text. Reply with a JSON object with exactly the same ids, each mapped to its translation.`;

/** Erreur de traduction (refus, réponse tronquée, réponse illisible après 3 essais). */
export class TranslationError extends Error {}

/** Problème d'une traduction : clé concernée (null = réponse entière), type, et explication en anglais pour le modèle. */
export type Problem = { key: string | null; code: "json" | "missing" | "tags" | "doctor" | "title"; reason: string };

/** Balises d'une chaîne, dans l'ordre (pour vérifier que la traduction les conserve). */
const tagsOf = (text: string) => (text.match(/<\/?(?:a|b|i|code)(?: n="\d+")?>/g) ?? []).sort();

/**
 * Vérifie une traduction avant de l'accepter (et donc de la mettre en cache) : mêmes clés, aucun texte vide,
 * balises conservées, et règle 10. Parler d'un médecin reste permis (« consultez un médecin en cas d'urgence » se
 * traduit fidèlement) ; ce qui est refusé : une traduction qui mentionne un médecin plus souvent que le français
 * (l'ostéopathe présenté comme médecin), ou un titre de docteur accolé au nom du praticien que le français n'a pas.
 * Renvoie la liste des problèmes (vide = traduction acceptée).
 */
export function validateTranslation(source: TextBatch, translated: unknown, names: string[] = []): Problem[] {
  if (!translated || typeof translated !== "object") return [{ key: null, code: "json", reason: "the reply was not a JSON object" }];
  const out = translated as Record<string, unknown>;
  const problems: Problem[] = [];
  for (const [key, text] of Object.entries(source)) {
    const value = out[key];
    if (typeof value !== "string" || !value.trim()) {
      problems.push({ key, code: "missing", reason: "the translation is missing or empty" });
      continue;
    }
    if (tagsOf(value).join() !== tagsOf(text).join()) {
      problems.push({ key, code: "tags", reason: "the inline tags differ from the French text; keep exactly the same tags" });
    }
    const added = doctorMentions(value).slice(countDoctorMentions(text));
    if (added.length > 0) {
      problems.push({
        key,
        code: "doctor",
        reason: `it mentions a doctor (${added.map((w) => `"${w}"`).join(", ")}) more often than the French text does; the osteopath must never be presented as a doctor, so translate without that mention`,
      });
    }
    if (hasTitleBeforeName(value, names) && !hasTitleBeforeName(text, names)) {
      problems.push({ key, code: "title", reason: "it gives the practitioner a doctor title; remove it" });
    }
  }
  return problems;
}

/** Problème lisible dans les journaux : clé, explication, et les deux textes (tronqués) pour comprendre. */
const describe = (p: Problem, source: TextBatch, translated: unknown) => {
  if (p.key === null) return p.reason;
  const cut = (t: unknown) => String(t ?? "").replace(/\s+/g, " ").slice(0, 160);
  return `${p.key} : ${p.reason} (FR : « ${cut(source[p.key])} » ; traduction : « ${cut((translated as TextBatch | null)?.[p.key])} »)`;
};

/**
 * Traducteur Claude : un appel par lot, réponse JSON contrainte par schéma, vérifiée. Seuls les textes rejetés sont
 * redemandés (2 fois au plus), en expliquant au modèle ce qui ne va pas. Après 3 essais, les textes encore refusés sont
 * absents du résultat (ils restent en français à l'affichage et seront redemandés plus tard) plutôt que de bloquer la
 * page entière ; seule une réponse inexploitable (refus, réponse tronquée, ou jamais lisible) lève une erreur.
 */
export function createClaudeTranslator(client: Anthropic = new Anthropic()): Translator {
  return async (batch, locale, names = []) => {
    let pending = Object.keys(batch);
    if (pending.length === 0) return {};
    const accepted: TextBatch = {};
    let feedback = "";
    let readable = false;
    for (let attempt = 1; attempt <= 3 && pending.length > 0; attempt++) {
      const sub = Object.fromEntries(pending.map((k) => [k, batch[k]!]));
      const schema = {
        type: "object",
        properties: Object.fromEntries(pending.map((k) => [k, { type: "string" }])),
        required: pending,
        additionalProperties: false,
      };
      const message = await client.beta.messages
        .stream({
          model: TRANSLATION_MODEL,
          max_tokens: 64000,
          output_config: { effort: "low", format: { type: "json_schema", schema } },
          // Si le modèle refusait le texte (faux positif des filtres), l'API relance la requête sur un autre modèle.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Target language: ${LOCALE_META[locale].englishName}.\n\n${JSON.stringify(sub, null, 2)}${feedback}` }],
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
      const problems = validateTranslation(sub, parsed, names);
      if (problems.every((p) => p.key !== null)) {
        readable = true;
        const rejected = new Set(problems.map((p) => p.key));
        for (const k of pending) if (!rejected.has(k)) accepted[k] = (parsed as TextBatch)[k]!;
        pending = pending.filter((k) => rejected.has(k));
      }
      if (problems.length === 0) break;
      console.warn(`[i18n] traduction ${locale} rejetée (essai ${attempt}/3) : ${problems.map((p) => describe(p, sub, parsed)).join(" ; ")}`);
      feedback =
        "\n\nA previous translation of these texts was rejected for these reasons; fix them in your new translation:\n" +
        problems.map((p) => `- ${p.key === null ? "whole reply" : `id "${p.key}"`}: ${p.reason}`).join("\n");
    }
    if (!readable) throw new TranslationError(`traduction ${locale} illisible après 3 essais`);
    if (pending.length > 0) console.warn(`[i18n] traduction ${locale} : ${pending.length} texte(s) laissé(s) en français après 3 essais : ${pending.join(", ")}`);
    return accepted;
  };
}

/** Traducteur « identity » (CI, tests) : renvoie le français. Ne sert jamais en production (voir translationMode). */
export const identityTranslator: Translator = async (batch) => ({ ...batch });
