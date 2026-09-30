import { parse, type HTMLElement } from "node-html-parser";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect } from "vitest";

/** Rend un élément React (composant serveur ou client) en HTML statique, puis l'analyse. */
export function render(element: ReactElement): HTMLElement {
  return parse(renderToStaticMarkup(element));
}

/** Rend une page async (Server Component) : on l'appelle comme une fonction, puis on rend son résultat. */
export async function renderPage(page: () => Promise<ReactElement>): Promise<HTMLElement> {
  return render(await page());
}

/** Texte visible, sans balises (les <script> JSON-LD n'en font pas partie). */
export const visibleText = (root: HTMLElement) =>
  root.querySelectorAll("script, style").reduce((acc, s) => (s.remove(), acc), root).text.replace(/\s+/g, " ");

/** Nœuds JSON-LD (@graph) d'un HTML rendu. */
export function jsonLdNodes(root: HTMLElement): Array<Record<string, unknown>> {
  return root
    .querySelectorAll('script[type="application/ld+json"]')
    .flatMap((s) => (JSON.parse(s.textContent) as { "@graph"?: Array<Record<string, unknown>> })["@graph"] ?? []);
}

/**
 * Règles non négociables de CLAUDE.md vérifiables sur du HTML rendu :
 * règle 10 (jamais « médecin » ni « Dr »), toute <img> avec un alt non vide, règle 5 (aucun script
 * ni iframe tiers), règle 7 (jamais Physician / AggregateRating / Review dans le JSON-LD).
 */
export function expectSiteRules(root: HTMLElement) {
  const text = visibleText(parse(root.outerHTML));
  expect(text, "règle 10 : « médecin » / « Dr » interdits").not.toMatch(/médecin|\bDr\b\.?/i);
  for (const img of root.querySelectorAll("img")) {
    expect((img.getAttribute("alt") ?? "").trim(), `alt manquant : ${img.getAttribute("src")}`).not.toBe("");
  }
  expect(root.querySelectorAll("iframe"), "règle 5 : pas d'iframe").toHaveLength(0);
  const external = root.querySelectorAll("script[src]").map((s) => s.getAttribute("src"));
  expect(external, "règle 5 : pas de script tiers").toEqual([]);
  const ld = root.querySelectorAll('script[type="application/ld+json"]').map((s) => s.textContent).join("");
  expect(ld, "règle 7 : types JSON-LD interdits").not.toMatch(/"Physician"|AggregateRating|"Review"/);
}

/** Liens de rendez-vous (règle 6) : de vrais <a href> vers l'URL configurée. */
export const bookingAnchors = (root: HTMLElement, bookingUrl: string) =>
  root.querySelectorAll("a").filter((a) => a.getAttribute("href") === bookingUrl);
