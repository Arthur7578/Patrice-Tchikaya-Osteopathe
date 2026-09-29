import type { Booking, Geo, OpeningHoursRange } from "./types";

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
  const m = (value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 0 && n <= 5 ? n : null;
}

export function parseInteger(value: string | null | undefined): number | null {
  const m = (value ?? "").match(/\d+/);
  return m ? Number(m[0]) : null;
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

/**
 * Format attendu dans Notion (clé Horaires) : "Mo-Fr 08:00-19:00; Sa 08:00-12:00"
 * (format schema.org openingHours). Retourne null si vide ou invalide.
 */
export function parseOpeningHours(value: string | null | undefined): OpeningHoursRange[] | null {
  if (isPlaceholder(value)) return null;
  return parseSchemaOrgHours(value!) ?? parseFrenchHours(value!);
}

const DAY_BY_FR_NAME: Record<string, Day> = {
  lundi: "Mo", mardi: "Tu", mercredi: "We", jeudi: "Th", vendredi: "Fr", samedi: "Sa", dimanche: "Su",
};

/**
 * Format libre français : "Lundi : 08:30–19:00 ; Mardi : 07:00–16:45 ; Dimanche : fermé".
 * Les jours fermés sont ignorés ; les jours consécutifs aux horaires identiques sont fusionnés.
 */
function parseFrenchHours(value: string): OpeningHoursRange[] | null {
  const perDay: { day: Day; opens: string; closes: string }[] = [];
  for (const chunk of value.split(/[;\n]+/).map((c) => c.trim()).filter(Boolean)) {
    const m = chunk.match(/^([\p{L}]+)\s*:\s*(?:(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})|(ferm[ée]e?))$/iu);
    const day = m && DAY_BY_FR_NAME[m[1].toLowerCase()];
    if (!m || !day) return null;
    if (m[6]) continue;
    perDay.push({ day, opens: `${m[2].padStart(2, "0")}:${m[3]}`, closes: `${m[4].padStart(2, "0")}:${m[5]}` });
  }
  const ranges: OpeningHoursRange[] = [];
  for (const d of perDay) {
    const last = ranges[ranges.length - 1];
    const consecutive = last && DAY_ORDER.indexOf(last.days[last.days.length - 1]) + 1 === DAY_ORDER.indexOf(d.day);
    if (last && consecutive && last.opens === d.opens && last.closes === d.closes) last.days.push(d.day);
    else ranges.push({ days: [d.day], opens: d.opens, closes: d.closes });
  }
  return ranges.length > 0 ? ranges : null;
}

function parseSchemaOrgHours(value: string): OpeningHoursRange[] | null {
  const ranges: OpeningHoursRange[] = [];
  for (const chunk of value.split(/[;\n]+/).map((c) => c.trim()).filter(Boolean)) {
    const m = chunk.match(/^([A-Z][a-z](?:-[A-Z][a-z])?(?:,[A-Z][a-z](?:-[A-Z][a-z])?)*)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!m) return null;
    const days: Day[] = [];
    for (const part of m[1].split(",")) {
      const [from, to] = part.split("-") as [Day, Day | undefined];
      const a = DAY_ORDER.indexOf(from);
      const b = to ? DAY_ORDER.indexOf(to) : a;
      if (a < 0 || b < 0 || b < a) return null;
      days.push(...DAY_ORDER.slice(a, b + 1));
    }
    ranges.push({ days, opens: m[2], closes: m[3] });
  }
  return ranges.length > 0 ? ranges : null;
}
