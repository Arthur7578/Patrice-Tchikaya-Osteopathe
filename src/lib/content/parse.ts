import type { Booking, Geo, OpeningHoursRange, Phone } from "./types";

/** "[Mettre le tarif ex: 90 €]" ou vide => valeur non renseignée. */
export function isPlaceholder(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return v === "" || /^\[.*\]$/.test(v) || /mettre le|à compléter|a completer|todo/i.test(v);
}

export function cleanOptional(value: string | null | undefined): string | null {
  return isPlaceholder(value) ? null : (value ?? "").trim();
}

/** "3440 Dudelange, Luxembourg" | "L-3440 Dudelange" -> { postalCode, locality, countryName } */
export function parsePostalLine(value: string) {
  const m = value.trim().match(/^(?:L-)?(\d{4})\s+([^,]+?)(?:,\s*(.+))?$/i);
  if (!m) return null;
  return { postalCode: m[1], locality: m[2].trim(), countryName: (m[3] ?? "Luxembourg").trim() };
}

/** Garde uniquement "+" et les chiffres : "+352 51 92 92" -> "+352519292" */
export function toE164(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/**
 * Numéro optionnel, indicatif international obligatoire : "+352 691 044 147" -> { display, e164: "+352691044147" }.
 * Sans « + » ou illisible -> null (sans indicatif, "691 044 147" deviendrait "+691…" : la Micronésie).
 */
export function parsePhone(value: string | null | undefined): Phone | null {
  if (isPlaceholder(value)) return null;
  const display = value!.trim();
  const e164 = toE164(display);
  return display.startsWith("+") && /^\+[1-9]\d{6,14}$/.test(e164) ? { display, e164 } : null;
}

/** Hôtes Cal.com connus (UE et global) : seuls ceux-ci activent l'intégration embarquée. */
const CAL_HOSTS = new Set(["cal.eu", "app.cal.eu", "cal.com", "app.cal.com"]);

/**
 * Analyse l'URL de réservation (Notion : `Url_Booking`), pensée pour être générique et
 * configurable : n'importe quelle URL de prise de RDV est acceptée et devient un vrai lien
 * `<a href>` (règle 6). Seuls les hôtes Cal.com connus sont enrichis en popup / agenda inline
 * (§9) ; tout autre prestataire (Doctena, Calendly, un futur outil…) reste en lien simple —
 * changer de prestataire ne demande donc aucun changement de code, juste une nouvelle URL
 * dans Notion.
 */
export function parseBookingUrl(value: string): Booking | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  const calLink = url.pathname.replace(/^\/+|\/+$/g, "");
  if (!CAL_HOSTS.has(host) || !calLink) {
    return { url: url.toString(), provider: "generic", calLink: null, calOrigin: null };
  }
  const calOrigin = host === "cal.eu" || host === "app.cal.eu" ? "https://app.cal.eu" : "https://app.cal.com";
  return { url: url.toString(), provider: "cal", calLink, calOrigin };
}

/** "49.481194, 6.084361" -> { latitude, longitude } ; hors bornes ou illisible -> null */
export function parseGeo(value: string | null | undefined): Geo | null {
  if (isPlaceholder(value)) return null;
  const m = value!.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const latitude = Number(m[1]);
  const longitude = Number(m[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

/** "5 / 5" | "4,5" | "5" -> 5 | 4.5 ; hors [0,5] ou illisible -> null */
export function parseRating(value: string | null | undefined): number | null {
  if (isPlaceholder(value)) return null; // « [À COMPLÉTER : ex. 5,0] » ne doit jamais devenir une note
  const m = value!.replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 0 && n <= 5 ? n : null;
}

export function parseInteger(value: string | null | undefined): number | null {
  if (isPlaceholder(value)) return null;
  const m = value!.match(/\d+/);
  return m ? Number(m[0]) : null;
}

/**
 * Liste saisie dans une cellule Notion : un élément par ligne (Maj+Entrée) ou séparé par « ; ».
 * Puces tapées à la main (« - », « • », « * ») retirées ; lignes vides ou placeholders ignorées.
 */
export function parseList(value: string | null | undefined): string[] {
  if (isPlaceholder(value)) return [];
  return value!
    .split(/[\n;]+/)
    .map((item) => item.replace(/^\s*[-•*]\s*/, "").trim())
    .filter((item) => !isPlaceholder(item));
}

/** "Yves Schweicher" -> "Yves S." ; "Michelle" -> "Michelle" (minimisation des données patient) */
export function formatReviewAuthor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "Patient";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function normalizeSlug(value: string): string | null {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : null;
}

const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Day = (typeof DAY_ORDER)[number];

const DAY_TOKEN = /\b(?:(lun|mar|mer|jeu|ven|sam|dim)[a-z]*|(mo|tu|we|th|fr|sa|su))\b/g;
const DAY_BY_PREFIX: Record<string, Day> = {
  lun: "Mo", mar: "Tu", mer: "We", jeu: "Th", ven: "Fr", sam: "Sa", dim: "Su",
  mo: "Mo", tu: "Tu", we: "We", th: "Th", fr: "Fr", sa: "Sa", su: "Su",
};
/** Ce qui peut séparer deux jours d'une plage : « au », « à », « - », « jusqu'au »… */
const RANGE_CONNECTOR = /^\s*(?:-|–|—|a|au|jusqu'?a|jusqu'?au|to)\s*$/;
const TIME_TOKEN = /\b(\d{1,2})\s*(?::|h)\s*(\d{2})?\b/g;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’‘`]/g, "'");

/** Lignes brutes d'un champ horaires (séparées par « ; » ou un retour à la ligne). */
export function splitOpeningLines(value: string | null | undefined): string[] {
  if (isPlaceholder(value)) return [];
  return value!.split(/[;\n]+/).map((c) => c.trim()).filter(Boolean);
}

/** « lundi au vendredi » -> Mo..Fr ; « lundi, mercredi » -> Mo, We ; null si aucun jour reconnu. */
function parseDays(text: string): Day[] | null {
  const tokens = [...text.matchAll(DAY_TOKEN)];
  if (tokens.length === 0) return null;
  const days: Day[] = [];
  let rangeFromPrevious = false;
  tokens.forEach((token, i) => {
    const day = DAY_BY_PREFIX[token[1] ?? token[2]];
    if (rangeFromPrevious) {
      const from = DAY_ORDER.indexOf(days[days.length - 1]);
      days.push(...DAY_ORDER.slice(from + 1, DAY_ORDER.indexOf(day) + 1));
    } else {
      days.push(day);
    }
    const next = tokens[i + 1];
    rangeFromPrevious = next !== undefined && RANGE_CONNECTOR.test(text.slice(token.index + token[0].length, next.index));
  });
  return [...new Set(days)];
}

/**
 * Lecture tolérante des horaires saisis dans Notion (clé Horaires). Accepte notamment :
 * « Mo-Fr 08:30-19:00; Sa 08:30-12:30 », « Lundi au Vendredi, de 08:30-19:00 ; Samedi de 8h30 à 12h30 »,
 * plusieurs plages par ligne (pause déjeuner). Retourne null si une ligne est incompréhensible :
 * l'affichage utilise alors le texte brut (`splitOpeningLines`) et seul le JSON-LD est omis.
 */
export function parseOpeningHours(value: string | null | undefined): OpeningHoursRange[] | null {
  const ranges: OpeningHoursRange[] = [];
  for (const line of splitOpeningLines(value)) {
    const text = normalize(line);
    const times = [...text.matchAll(TIME_TOKEN)];
    if (times.length < 2 || times.length % 2 !== 0) return null;
    const days = parseDays(text.slice(0, times[0].index));
    if (!days) return null;
    const hhmm = (m: RegExpMatchArray) => {
      const h = Number(m[1]);
      const min = Number(m[2] ?? "0");
      return h > 24 || min > 59 ? null : `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    };
    for (let i = 0; i < times.length; i += 2) {
      const opens = hhmm(times[i]);
      const closes = hhmm(times[i + 1]);
      if (!opens || !closes || closes <= opens) return null;
      ranges.push({ days, opens, closes });
    }
  }
  return ranges.length > 0 ? ranges : null;
}
