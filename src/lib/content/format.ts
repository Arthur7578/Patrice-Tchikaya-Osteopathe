import type { OpeningHoursRange } from "./types";

const LOCALE = "fr-LU";

/** 5 -> "5,0" */
export const formatRating = (value: number) =>
  value.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "2026-09-21" -> "septembre 2026" (date absolue : une page statique ne doit pas dire « il y a 3 jours »). */
export function formatReviewDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

const DAY_FR: Record<OpeningHoursRange["days"][number], string> = {
  Mo: "Lundi", Tu: "Mardi", We: "Mercredi", Th: "Jeudi", Fr: "Vendredi", Sa: "Samedi", Su: "Dimanche",
};

/** [{days:[Mo..Fr],opens:"08:00",closes:"19:00"}] -> ["Lundi – Vendredi : 8h00 – 19h00"] */
export function formatOpeningHours(ranges: OpeningHoursRange[]): string[] {
  const time = (t: string) => t.replace(/^0/, "").replace(":", "h");
  return ranges.map((r) => {
    const first = DAY_FR[r.days[0]];
    const last = DAY_FR[r.days[r.days.length - 1]];
    const days = r.days.length > 1 ? `${first} – ${last}` : first;
    return `${days} : ${time(r.opens)} – ${time(r.closes)}`;
  });
}
