import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FORBIDDEN_TITLES } from "./render";

/** Code applicatif (hors tests). */
const sources = globSync("src/**/*.{ts,tsx}")
  .filter((file) => !/\.test\.tsx?$/.test(file) && !file.startsWith("src/test/"))
  .sort();
const read = (file: string) => readFileSync(file, "utf8");

/** Directive "use client" : première instruction du fichier (commentaires éventuels avant). */
const isClient = (code: string) => /^(?:\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/)*\s*["']use client["']/.test(code);

/** Règle 1 : les seuls composants client autorisés. */
const CLIENT_COMPONENTS = [
  "src/components/booking/booking-inline.tsx",
  "src/components/booking/booking-link.tsx",
  "src/components/layout/mobile-action-bar.tsx",
  "src/components/layout/mobile-menu.tsx",
  "src/components/ui/reveal.tsx",
  // Bannière de consentement GTM : écart assumé à la règle 5, voir docs/DECISIONS.md (2026-09-27).
  "src/components/analytics/cookie-consent.tsx",
].sort();

describe("architecture (règles non négociables vérifiables sur le code)", () => {
  it("le code applicatif est bien trouvé", () => {
    expect(sources.length).toBeGreaterThan(40);
  });

  it("règle 1 : \"use client\" uniquement dans les composants autorisés", () => {
    expect(sources.filter((file) => isClient(read(file)))).toEqual(CLIENT_COMPONENTS);
  });

  it("Server Components : aucun gestionnaire d'événement (onClick, onFocus…) — React le refuse côté serveur (erreur 500)", () => {
    const offenders = sources
      .filter((file) => file.endsWith(".tsx") && !isClient(read(file)))
      .flatMap((file) => [...read(file).matchAll(/\son[A-Z][A-Za-z]*=\{/g)].map((m) => `${file} : ${m[0].trim()}`));
    expect(offenders).toEqual([]);
  });

  it("règle 10 : ni « médecin » ni « Dr » dans les textes du site (ui-copy.ts, fallback.ts)", () => {
    for (const file of ["src/content/ui-copy.ts", "src/lib/content/fallback.ts"]) {
      const lines = read(file)
        .split("\n")
        .map((line, i) => `${file}:${i + 1} ${line.trim()}`)
        .filter((line) => FORBIDDEN_TITLES.test(line));
      expect(lines).toEqual([]);
    }
  });
});
