/**
 * Règle 10 pour les textes du site écrits dans le code (ui-copy*.ts, fallback.ts) : aucune mention d'un médecin, dans
 * aucune langue. Le portugais « médico » n'y est pas : c'est aussi l'adjectif « médical » (« acompanhamento médico »).
 */
export const FORBIDDEN_TITLES = /médecin|\bDr\b|\bdoctors?\b|\bphysicians?\b|\bDokter\b|\bDoktor\b|\bArzt\b|\bdoutor\b/iu;

/** Déterminants portugais devant « médico » nom (« um médico », « o seu médico ») ; sans eux, c'est l'adjectif. */
const PT_DETERMINERS = "o|a|os|as|um|uma|uns|umas|seu|sua|seus|suas|meu|minha|teu|tua|ao|à|aos|às|do|da|dos|das|no|na|nos|nas|pelo|pela|outro|outra";

/**
 * Spécialités médicales en français : l'allemand les traduit souvent par un composé en « -arzt » (« généraliste » →
 * « Hausarzt », « pédiatre » → « Kinderarzt », « dentiste » → « Zahnarzt ») ; elles comptent donc comme un médecin.
 */
const FRENCH_SPECIALISTS =
  "généralistes?|spécialistes?|pédiatres?|gynécologues?|dentistes?|rhumatologues?|orthopédistes?|chirurgiens?|neurologues?|cardiologues?|radiologues?|ophtalmologues?|ophtalmologistes?|dermatologues?|psychiatres?|urgentistes?|anesthésistes?";

/**
 * Mentions d'un médecin (la profession) dans les 5 langues du site : « médecin », « docteur », « Dr », « doctor »,
 * « physician », « Arzt » (et « Hausarzt », « Arztpraxis », « Ärztin »…), « Doktor », « Dokter », « doutor », « um médico »,
 * et les spécialités en français (FRENCH_SPECIALISTS). Les adjectifs (« ärztliche Verordnung », « acompanhamento médico »)
 * ne comptent pas.
 */
const DOCTOR_MENTION = new RegExp(
  `(?<!\\p{L})(?:${FRENCH_SPECIALISTS}|médecins?|docteurs?|doctoresses?|dre?|drs|doctors?|physicians?|\\p{L}*arzt\\p{L}*|\\p{L}*ärzt(?:in|innen|e|en)|doktor(?:in|innen|en)?|\\p{L}*dokter(?:en|in|inne)?|doktesch|doutor(?:a|es|as)?|dra)(?!\\p{L})` +
    `|(?<=(?<!\\p{L})(?:${PT_DETERMINERS})\\s+)médic[oa]s?(?!\\p{L})`,
  "giu",
);

/** Mentions d'un médecin dans un texte, dans l'ordre (voir DOCTOR_MENTION). */
export const doctorMentions = (text: string): string[] => text.match(DOCTOR_MENTION) ?? [];

/** Nombre de mentions d'un médecin dans un texte. */
export const countDoctorMentions = (text: string) => doctorMentions(text).length;

/** Titres ; le point n'est permis qu'après une abréviation (« Dr. Tchikaya », mais « … a doctor. Patrice … » est permis). */
const TITLES = "(?:dr|dre|dra)\\.?|docteur|doctor|doktor|dokter|doutor|doutora";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Titre de docteur accolé à l'un des noms donnés (« Dr Tchikaya », « Doktor Patrice ») : toujours interdit. */
export function hasTitleBeforeName(text: string, names: string[]): boolean {
  const parts = names.map((n) => n.trim()).filter((n) => n.length > 1);
  if (parts.length === 0) return false;
  return new RegExp(`(?<!\\p{L})(?:${TITLES})\\s+(?:${parts.map(escape).join("|")})(?!\\p{L})`, "iu").test(text);
}
