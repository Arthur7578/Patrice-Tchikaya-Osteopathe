// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(html).not.toContain("<details open");
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

  it("page détaillée aux slugs traduits : chaque langue mène au slug de sa langue", () => {
    const pages = [{ fr: "osteopathie-du-sport", de: "sportosteopathie", en: "sports-osteopathy", lb: "osteopathie-du-sport", pt: "osteopatia-desportiva" }];
    window.history.replaceState(null, "", "/de/sportosteopathie");
    render(<LanguageSwitcher current="de" options={OPTIONS} label="Sprache" pages={pages} />);
    expect(hrefs()).toEqual({
      Français: "/osteopathie-du-sport", Deutsch: "/de/sportosteopathie", English: "/en/sports-osteopathy",
      Lëtzebuergesch: "/lb/osteopathie-du-sport", Português: "/pt/osteopatia-desportiva",
    });
  });

  it("déclencheur : globe et code de la langue, nom accessible qui contient le texte visible", () => {
    const { container } = render(<LanguageSwitcher current="fr" options={OPTIONS} label="Langue du site" />);
    const summary = container.querySelector("summary")!;
    expect(summary).toHaveAccessibleName(/^Langue du site, ?fr$/);
    expect(summary.querySelector("svg.lucide-globe")).not.toBeNull();
    expect(summary.querySelector("svg.lucide-languages")).toBeNull(); // « 文A » : peu compris
    expect(screen.getByRole("list", { name: "Langue du site" })).toBeInTheDocument();
  });

  it("seule la langue courante est cochée", () => {
    window.history.replaceState(null, "", "/de");
    render(<LanguageSwitcher current="de" options={OPTIONS} label="Sprache der Website" />);
    const checked = screen.getAllByRole("link").filter((a) => a.querySelector("svg.lucide-check"));
    expect(checked.map((a) => a.textContent)).toEqual(["Deutsch"]);
  });

  it("se ferme au clic extérieur et avec Échap (focus rendu au déclencheur)", () => {
    const { container } = render(<LanguageSwitcher current="fr" options={OPTIONS} label="Langue du site" />);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent.click(details.querySelector("li")!);
    expect(details.open).toBe(true); // clic dans la liste : reste ouvert (la navigation s'en charge)
    fireEvent.click(document.body);
    expect(details.open).toBe(false);
    details.open = true;
    fireEvent.keyDown(document, { key: "Enter" });
    expect(details.open).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(details.querySelector("summary"));
  });

  it("variante « inline » (menu mobile) : liste nommée, mêmes liens", () => {
    window.history.replaceState(null, "", "/pt/articles");
    render(<LanguageSwitcher current="pt" options={OPTIONS} label="Língua do site" variant="inline" />);
    expect(screen.getByRole("list", { name: "Língua do site" })).toBeInTheDocument();
    expect(screen.getByText("Língua do site")).toBeVisible(); // titre visible, pas seulement pour les lecteurs d'écran
    expect(hrefs()).toEqual({ Français: "/articles", Deutsch: "/de/articles", English: "/en/articles", Lëtzebuergesch: "/lb/articles", Português: "/pt/articles" });
  });
});
