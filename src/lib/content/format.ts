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
  const order = Object.keys(DAY_FR);
  return ranges.map((r) => {
    const indexes = r.days.map((d) => order.indexOf(d));
    const contiguous = indexes.every((n, i) => i === 0 || n === indexes[i - 1] + 1);
    const days =
      r.days.length === 1
        ? DAY_FR[r.days[0]]
        : contiguous && r.days.length > 2
          ? `${DAY_FR[r.days[0]]} – ${DAY_FR[r.days[r.days.length - 1]]}`
          : r.days.map((d) => DAY_FR[d]).join(", ");
    return `${days} : ${time(r.opens)} – ${time(r.closes)}`;
  });
}

/**
 * Espaces insécables de la typographie française : « guillemets », deux-points, point-virgule, points
 * d'exclamation et d'interrogation ne passent jamais seuls à la ligne. Les textes saisis dans Notion
 * n'en contiennent pas (on ne tape pas d'espace insécable), on les rétablit à l'affichage.
 */
export function frenchNbsp(text: string): string {
  return text
    .replace(/« +/g, "«\u00a0")
    .replace(/ +»/g, "\u00a0»")
    .replace(/ +([:;!?])/g, "\u00a0$1");
}
