// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_META, LOCALES } from "@/config/i18n";

vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));
const { LanguageSwitcher } = await import("./language-switcher");

const OPTIONS = LOCALES.map((l) => ({ locale: l, label: LOCALE_META[l].label, htmlLang: LOCALE_META[l].htmlLang, hreflang: LOCALE_META[l].hreflang }));
const hrefs = () => Object.fromEntries(screen.getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")]));

describe("LanguageSwitcher", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("rendu serveur (sans JS) : chaque langue mène à son accueil, avec lang et hreflang", () => {
    const html = renderToStaticMarkup(<LanguageSwitcher current="fr" options={OPTIONS} label="Langue du site" />);
    expect(html).toContain('<summary aria-label="Langue du site"');
    for (const [href, lang] of [["/", "fr-LU"], ["/de", "de"], ["/en", "en"], ["/lb", "lb"], ["/pt", "pt-PT"]]) {
      expect(html).toContain(`href="${href}" hrefLang="${lang.slice(0, 2)}" lang="${lang}"`);
    }
  });

  it("dans le navigateur : même page dans chaque langue, langue courante marquée", () => {
    window.history.replaceState(null, "", "/en/paiement");
    render(<LanguageSwitcher current="en" options={OPTIONS} label="Site language" />);
    expect(hrefs()).toEqual({ Français: "/paiement", Deutsch: "/de/paiement", English: "/en/paiement", Lëtzebuergesch: "/lb/paiement", Português: "/pt/paiement" });
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Français" })).not.toHaveAttribute("aria-current");
  });

  it("page juridique : même page dans chaque langue", () => {
    window.history.replaceState(null, "", "/mentions-legales");
    render(<LanguageSwitcher current="fr" options={OPTIONS} label="Langue du site" />);
    expect(hrefs()).toEqual({
      Français: "/mentions-legales", Deutsch: "/de/mentions-legales", English: "/en/mentions-legales", Lëtzebuergesch: "/lb/mentions-legales", Português: "/pt/mentions-legales",
    });
  });

  it("variante « inline » (menu mobile) : liste nommée, mêmes liens", () => {
    window.history.replaceState(null, "", "/pt/articles");
    render(<LanguageSwitcher current="pt" options={OPTIONS} label="Língua do site" variant="inline" />);
    expect(screen.getByRole("list", { name: "Língua do site" })).toBeInTheDocument();
    expect(hrefs()).toEqual({ Français: "/articles", Deutsch: "/de/articles", English: "/en/articles", Lëtzebuergesch: "/lb/articles", Português: "/pt/articles" });
  });
});
