import { describe, expect, it, vi } from "vitest";
import { countBlobOp } from "./blob-ops";

describe("countBlobOp", () => {
  it("journalise chaque opération avec le total du processus (lu dans les logs de build)", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    countBlobOp("list", "i18n/translations/");
    countBlobOp("put", "i18n/slugs/a", 2);
    countBlobOp("put", "rien", 0);
    expect(info.mock.calls.map((c) => String(c[0]).replace(/pid \d+/, "pid N"))).toEqual([
      "[blob] list i18n/translations/ (total de ce processus : 1, pid N)",
      "[blob] put i18n/slugs/a ×2 (total de ce processus : 3, pid N)",
    ]);
    info.mockRestore();
  });
});
