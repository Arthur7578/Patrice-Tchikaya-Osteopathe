import { globSync, readFileSync } from "node:fs";
import ts from "typescript";
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

/** Règle 2 : attributs lus par l'utilisateur (lecteur d'écran, infobulle, texte alternatif). */
const USER_FACING_ATTRIBUTES = new Set(["aria-label", "aria-description", "title", "alt", "placeholder", "label"]);
/** Éléments dont le contenu est du code, pas du texte. */
const CODE_ELEMENTS = new Set(["style", "script", "Script"]);
/** Règle 2 : fichiers autorisés à contenir du texte en dur, avec la raison. */
const HARDCODED_TEXT_ALLOWED = [
  "src/app/admin/photos/page.tsx", // outil interne temporaire, jamais vu des patients
  "src/app/apple-icon.tsx", // monogramme « PT » de l'icône, comme icon.svg
  "src/app/confidentialite/page.tsx", // texte juridique propre à la page (PLAN §J), données du cabinet via Notion
  "src/app/mentions-legales/page.tsx", // idem
];

const hasWords = (text: string) => /\p{L}{2,}/u.test(text);

/** Textes littéraux d'une expression JSX, y compris dans ses branches (`a ? "x" : "y"`, `a && "x"`, `a ?? "x"`). */
function literalTexts(e: ts.Expression): string[] {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return [e.text];
  if (ts.isTemplateExpression(e)) return [e.head.text + e.templateSpans.map((span) => span.literal.text).join("")];
  if (ts.isParenthesizedExpression(e)) return literalTexts(e.expression);
  if (ts.isConditionalExpression(e)) return [...literalTexts(e.whenTrue), ...literalTexts(e.whenFalse)];
  const logical = [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken];
  if (ts.isBinaryExpression(e) && logical.includes(e.operatorToken.kind)) return [...literalTexts(e.left), ...literalTexts(e.right)];
  return [];
}

/**
 * Règle 2 : textes visibles écrits dans le JSX (texte, `{"…"}`, gabarits, branches conditionnelles) ou dans un
 * attribut lu par l'utilisateur. Ils doivent venir de getSiteContent() (Notion) ou de src/content/ui-copy.ts.
 */
function hardcodedTexts(file: string, code = read(file)): string[] {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const report = (node: ts.Node, text: string) =>
    found.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${text.replace(/\s+/g, " ").trim()}`);
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) && CODE_ELEMENTS.has(node.openingElement.tagName.getText())) return;
    if (ts.isJsxText(node) && hasWords(node.text)) report(node, node.text);
    if (ts.isJsxAttribute(node) && USER_FACING_ATTRIBUTES.has(node.name.getText()) && node.initializer) {
      const init = node.initializer;
      const texts = ts.isStringLiteral(init) ? [init.text] : ts.isJsxExpression(init) && init.expression ? literalTexts(init.expression) : [];
      for (const text of texts.filter(hasWords)) report(node, `${node.name.getText()}="${text}"`);
    }
    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent))
      for (const text of literalTexts(node.expression).filter(hasWords)) report(node, text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

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

  it("règle 2 : le détecteur repère texte, attributs lus et branches conditionnelles, pas le code ni les classes", () => {
    const code = `export const A = ({ ok, n }) => (
      <div className="flex gap-2 text-sm" aria-label="Libellé en dur" aria-hidden="true" title={ok ? COPY.a : "Infobulle"}>
        Texte en dur {"littéral"} {ok ? "oui" : COPY.b} {n && \`Séance de \${n}\`} {n ?? "à défaut"} · {COPY.c} {\`\${n} €\`}
        <style>{".a{color:red}"}</style>
        <Script id="gtm">{\`window.dataLayer = window.dataLayer || []\`}</Script>
      </div>
    );`;
    expect(hardcodedTexts("exemple.tsx", code)).toEqual([
      'exemple.tsx:2 aria-label="Libellé en dur"',
      'exemple.tsx:2 title="Infobulle"',
      "exemple.tsx:3 Texte en dur",
      "exemple.tsx:3 littéral",
      "exemple.tsx:3 oui",
      "exemple.tsx:3 Séance de",
      "exemple.tsx:3 à défaut",
    ]);
  });

  it("règle 2 : aucun texte visible en dur dans les composants et les pages (tout vient de ui-copy.ts ou de Notion)", () => {
    const offenders = sources
      .filter((file) => file.endsWith(".tsx") && !HARDCODED_TEXT_ALLOWED.includes(file))
      .flatMap((file) => hardcodedTexts(file));
    expect(offenders).toEqual([]);
  });

  it("règle 2 : chaque exception existe et contient bien du texte en dur (liste tenue à jour)", () => {
    for (const file of HARDCODED_TEXT_ALLOWED) expect(hardcodedTexts(file).length, file).toBeGreaterThan(0);
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
