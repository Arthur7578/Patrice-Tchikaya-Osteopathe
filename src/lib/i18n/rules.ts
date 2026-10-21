/**
 * Règle 10 pour les textes du site écrits dans le code (ui-copy*.ts, fallback.ts) : aucune mention d'un médecin, dans
 * aucune langue. Le portugais « médico » n'y est pas : c'est aussi l'adjectif « médical » (« acompanhamento médico »).
 */
export const FORBIDDEN_TITLES = /médecin|\bDr\b|\bdoctors?\b|\bphysicians?\b|\bDokter\b|\bDoktor\b|\bArzt\b|\bdoutor\b/iu;

/** Déterminants portugais devant « médico » nom (« um médico », « o seu médico ») ; sans eux, c'est l'adjectif. */
const PT_DETERMINERS = "o|a|os|as|um|uma|uns|umas|seu|sua|seus|suas|meu|minha|teu|tua|ao|à|aos|às|do|da|dos|das|no|na|nos|nas|pelo|pela|outro|outra";

/**
 * Mentions d'un médecin (la profession) dans les 5 langues du site : « médecin », « docteur », « Dr », « doctor »,
 * « physician », « Arzt » (et « Hausarzt », « Arztpraxis », « Ärztin »…), « Doktor », « Dokter », « doutor », « um médico ».
 * Les adjectifs (« ärztliche Verordnung », « acompanhamento médico ») ne comptent pas.
 */
const DOCTOR_MENTION = new RegExp(
  `(?<!\\p{L})(?:médecins?|docteurs?|doctoresses?|dre?|drs|doctors?|physicians?|\\p{L}*arzt\\p{L}*|\\p{L}*ärzt(?:in|innen|e|en)|doktor(?:in|innen|en)?|\\p{L}*dokter(?:en|in|inne)?|doktesch|doutor(?:a|es|as)?|dra)(?!\\p{L})` +
    `|(?<=(?<!\\p{L})(?:${PT_DETERMINERS})\\s+)médic[oa]s?(?!\\p{L})`,
  "giu",
);

/** Nombre de mentions d'un médecin dans un texte (voir DOCTOR_MENTION). */
export const countDoctorMentions = (text: string) => text.match(DOCTOR_MENTION)?.length ?? 0;

/** Titres ; le point n'est permis qu'après une abréviation (« Dr. Tchikaya », mais « … a doctor. Patrice … » est permis). */
const TITLES = "(?:dr|dre|dra)\\.?|docteur|doctor|doktor|dokter|doutor|doutora";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Titre de docteur accolé à l'un des noms donnés (« Dr Tchikaya », « Doktor Patrice ») : toujours interdit. */
export function hasTitleBeforeName(text: string, names: string[]): boolean {
  const parts = names.map((n) => n.trim()).filter((n) => n.length > 1);
  if (parts.length === 0) return false;
  return new RegExp(`(?<!\\p{L})(?:${TITLES})\\s+(?:${parts.map(escape).join("|")})(?!\\p{L})`, "iu").test(text);
}
