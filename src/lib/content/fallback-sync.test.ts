import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT } from "./fallback";
import { recentEdits, serializeFallback, toSnapshot, type RowEdit } from "./fallback-sync";
import type { SiteContent } from "./types";

const NOW = new Date("2026-10-10T12:00:00.000Z");
const row = (lastEdited: string, id = "r"): RowEdit => ({ database: "faq", id, lastEdited });

describe("recentEdits : tampon avant de figer le contenu de Notion", () => {
  it("garde les lignes modifiées depuis moins de N jours, écarte les autres", () => {
    const rows = [row("2026-10-09T12:00:00.000Z", "hier"), row("2026-10-06T12:00:00.000Z", "ancienne")];
    expect(recentEdits(rows, NOW, 3).map((r) => r.id)).toEqual(["hier"]);
  });

  it("exactement N jours : la ligne est assez ancienne ; une seconde de moins : encore récente", () => {
    expect(recentEdits([row("2026-10-07T12:00:00.000Z")], NOW, 3)).toEqual([]);
    expect(recentEdits([row("2026-10-07T12:00:01.000Z")], NOW, 3)).toHaveLength(1);
  });

  it("date illisible : comptée comme récente (dans le doute, on attend)", () => {
    expect(recentEdits([row("pas une date")], NOW, 3)).toHaveLength(1);
  });

  it("aucune ligne : rien à attendre", () => {
    expect(recentEdits([], NOW, 3)).toEqual([]);
  });
});

describe("toSnapshot : ce que le secours garde de Notion", () => {
  const live = structuredClone(FALLBACK_CONTENT) as SiteContent;
  live.images.hero.src = "https://exemple.test/hero.jpg";
  live.motifs[0].notionPageId = "page-id";
  live.guides = structuredClone(live.motifs.slice(0, 1));

  it("retire les URL des photos, les identifiants de page et les pages d'information", () => {
    const snapshot = toSnapshot(live);
    expect(Object.values(snapshot.images).every((image) => image.src === null)).toBe(true);
    expect(snapshot.motifs.every((motif) => motif.notionPageId === null)).toBe(true);
    expect(snapshot.guides).toEqual([]);
  });

  it("garde le reste, dont les textes alternatifs et les pages motifs, sans modifier l'original", () => {
    const snapshot = toSnapshot(live);
    expect(snapshot.images.hero.alt).toBe(live.images.hero.alt);
    expect(snapshot.motifs.map((m) => m.page)).toEqual(live.motifs.map((m) => m.page));
    expect(live.images.hero.src).toBe("https://exemple.test/hero.jpg");
    expect(live.motifs[0].notionPageId).toBe("page-id");
  });
});

describe("serializeFallback", () => {
  const body = (text: string) => text.slice(text.indexOf("= ") + 2).replace(/;\n$/, "");

  it("fallback.ts est exactement la sortie du générateur (aucune modification à la main)", () => {
    expect(readFileSync("src/lib/content/fallback.ts", "utf8")).toBe(serializeFallback(FALLBACK_CONTENT));
  });

  it("le texte généré se relit à l'identique (aller-retour)", () => {
    const parsed = new Function(`return ${body(serializeFallback(FALLBACK_CONTENT))}`)();
    expect(parsed).toEqual(toSnapshot(FALLBACK_CONTENT));
  });

  it("deux contenus qui ne diffèrent que par l'ordre des clés donnent le même fichier", () => {
    const shuffled = Object.fromEntries(Object.entries(FALLBACK_CONTENT).reverse()) as SiteContent;
    expect(serializeFallback(shuffled)).toBe(serializeFallback(FALLBACK_CONTENT));
  });

  it("signale l'en-tête « fichier généré » et le type SiteContent", () => {
    const text = serializeFallback(FALLBACK_CONTENT);
    expect(text.startsWith("// FICHIER GÉNÉRÉ")).toBe(true);
    expect(text).toContain("export const FALLBACK_CONTENT: SiteContent = {");
  });

  it("clés non identifiantes entre guillemets, valeurs `undefined` omises, caractères spéciaux échappés", () => {
    const odd = { ...structuredClone(FALLBACK_CONTENT), extra: { "a-b": 1, ok: undefined, text: 'guillemet " et \\ et \n' } };
    const text = serializeFallback(odd as unknown as SiteContent);
    expect(text).toContain('"a-b": 1,');
    expect(text).not.toContain("ok:");
    const parsed = new Function(`return ${body(text)}`)();
    expect(parsed.extra).toEqual({ "a-b": 1, text: 'guillemet " et \\ et \n' });
  });

  it("refuse un nombre non fini plutôt que d'écrire du code faux", () => {
    const bad = { ...structuredClone(FALLBACK_CONTENT), rating: { value: Number.NaN } };
    expect(() => serializeFallback(bad as unknown as SiteContent)).toThrow(/non sérialisable/);
  });
});
