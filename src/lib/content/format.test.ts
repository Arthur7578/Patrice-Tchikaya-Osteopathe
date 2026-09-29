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
