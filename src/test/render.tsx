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

/** Texte visible, espaces normalisés, sans le contenu des <script> (JSON-LD) ni des <style>. Ne modifie pas `root`. */
export function visibleText(root: HTMLElement): string {
  const copy = parse(root.outerHTML);
  for (const node of copy.querySelectorAll("script, style")) node.remove();
  return copy.text.replace(/\s+/g, " ");
}

/** Nœuds JSON-LD (@graph) d'un HTML rendu. */
export function jsonLdNodes(root: HTMLElement): Array<Record<string, unknown>> {
  return root
    .querySelectorAll('script[type="application/ld+json"]')
    .flatMap((s) => (JSON.parse(s.textContent) as { "@graph"?: Array<Record<string, unknown>> })["@graph"] ?? []);
}

/** Règle 10 : l'ostéopathe n'est ni « médecin » ni « Dr ». */
export const FORBIDDEN_TITLES = /médecin|\bDr\b/i;

/** Attributs lus par les utilisateurs (lecteurs d'écran, infobulles) ou les moteurs : soumis aux mêmes règles que le texte. */
const TEXT_ATTRIBUTES = ["alt", "title", "aria-label", "content", "placeholder", "value"];

/**
 * Règles non négociables de CLAUDE.md vérifiables sur du HTML rendu :
 * règle 10 (jamais « médecin » ni « Dr », texte ET attributs lisibles), règle 3 (toute <img> a un alt non vide),
 * règle 5 (ni script externe ni iframe), règle 7 (jamais Physician / AggregateRating / Review dans le JSON-LD).
 */
export function expectSiteRules(root: HTMLElement) {
  expect(visibleText(root), "règle 10 : « médecin » / « Dr » interdits").not.toMatch(FORBIDDEN_TITLES);
  for (const el of root.querySelectorAll("*")) {
    for (const name of TEXT_ATTRIBUTES) {
      const value = el.getAttribute(name);
      if (value) expect(value, `règle 10 : attribut ${name} de <${el.tagName.toLowerCase()}>`).not.toMatch(FORBIDDEN_TITLES);
    }
  }
  for (const img of root.querySelectorAll("img")) {
    expect((img.getAttribute("alt") ?? "").trim(), `alt manquant : ${img.getAttribute("src")}`).not.toBe("");
  }
  expect(root.querySelectorAll("iframe"), "règle 5 : pas d'iframe").toHaveLength(0);
  const external = root.querySelectorAll("script[src]").map((s) => s.getAttribute("src"));
  expect(external, "règle 5 : pas de script externe").toEqual([]);
  const ld = root.querySelectorAll('script[type="application/ld+json"]').map((s) => s.textContent).join("");
  expect(ld, "règle 7 : types JSON-LD interdits").not.toMatch(/"Physician"|AggregateRating|"Review"/);
  expect(ld, "règle 10 dans le JSON-LD").not.toMatch(FORBIDDEN_TITLES);
}

/** Liens de rendez-vous (règle 6) : de vrais <a href> vers l'URL configurée. */
export const bookingAnchors = (root: HTMLElement, bookingUrl: string) =>
  root.querySelectorAll("a").filter((a) => a.getAttribute("href") === bookingUrl);
