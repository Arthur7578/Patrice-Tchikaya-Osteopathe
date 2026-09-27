import { describe, expect, it } from "vitest";
import { formatOpeningHours, formatRating, formatReviewDate } from "./format";

describe("format", () => {
  it("formate note, date et horaires en français", () => {
    expect(formatRating(5)).toBe("5,0");
    expect(formatReviewDate("2026-09-21")).toBe("septembre 2026");
    expect(formatReviewDate(null)).toBeNull();
    expect(formatOpeningHours([{ days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:00", closes: "19:00" }])).toEqual([
      "Lundi – Vendredi : 8h00 – 19h00",
    ]);
  });
});
