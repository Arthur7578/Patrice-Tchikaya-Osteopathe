import { describe, expect, it } from "vitest";
import { formatOpeningHours, formatRating, formatReviewDate, frenchNbsp } from "./format";

describe("format", () => {
  it("formate note, date et horaires en français", () => {
    expect(formatRating(5)).toBe("5,0");
    expect(formatReviewDate("2026-09-21")).toBe("septembre 2026");
    expect(formatReviewDate(null)).toBeNull();
    expect(formatOpeningHours([{ days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:00", closes: "19:00" }])).toEqual([
      "Lundi – Vendredi : 8h00 – 19h00",
    ]);
  });

  it("rétablit les espaces insécables de la typographie française", () => {
    expect(frenchNbsp("cherchez « Wero » dans ses menus : vite ; bien ! Vraiment ?")).toBe(
      "cherchez «\u00a0Wero\u00a0» dans ses menus\u00a0: vite\u00a0; bien\u00a0! Vraiment\u00a0?",
    );
    expect(frenchNbsp("Déjà «\u00a0propre\u00a0».")).toBe("Déjà «\u00a0propre\u00a0».");
    expect(frenchNbsp("Sans changement.\nLigne suivante")).toBe("Sans changement.\nLigne suivante");
  });
});

describe("format : cas limites", () => {
  it("date d'avis : date-heure complète acceptée, date illisible => null", () => {
    expect(formatReviewDate("2026-03-01T10:15:00.000Z")).toBe("mars 2026");
    expect(formatReviewDate("pas une date")).toBeNull();
    expect(formatReviewDate("")).toBeNull();
  });

  it("chaque jour a son nom français", () => {
    const names = (["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const).map(
      (day) => formatOpeningHours([{ days: [day], opens: "09:00", closes: "10:00" }])[0]!.split(" : ")[0],
    );
    expect(names).toEqual(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]);
  });

  it("plage « A – B » seulement pour 3 jours consécutifs ou plus ; sinon liste", () => {
    const line = (days: Array<"Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su">) =>
      formatOpeningHours([{ days, opens: "09:00", closes: "12:30" }])[0];
    expect(line(["Mo", "Tu"])).toBe("Lundi, Mardi : 9h00 – 12h30");
    expect(line(["Mo", "We", "Fr"])).toBe("Lundi, Mercredi, Vendredi : 9h00 – 12h30");
    expect(line(["Tu", "We", "Th"])).toBe("Mardi – Jeudi : 9h00 – 12h30");
    expect(line(["Sa"])).toBe("Samedi : 9h00 – 12h30");
  });

  it("heures : zéro initial retiré seulement devant l'heure (« 10h05 » inchangé)", () => {
    expect(formatOpeningHours([{ days: ["Mo"], opens: "10:05", closes: "20:00" }])).toEqual(["Lundi : 10h05 – 20h00"]);
  });

  it("espaces insécables : plusieurs espaces saisis deviennent une seule insécable", () => {
    expect(frenchNbsp("«  Wero  »  :  oui")).toBe("« Wero » :  oui");
  });
});
