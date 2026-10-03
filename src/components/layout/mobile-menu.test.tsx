// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY, HOME_LINK, NAV } from "@/content/ui-copy";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-next-link="" {...rest}>
      {children}
    </a>
  ),
}));

const { MobileMenu } = await import("./mobile-menu");

let mqListener: (() => void) | undefined;
let mqMatches = false;
let mqQuery = "";

describe("MobileMenu", () => {
  beforeEach(() => {
    mqMatches = false;
    mqListener = undefined;
    vi.stubGlobal("matchMedia", (query: string) => {
      mqQuery = query;
      return {
        get matches() {
          return mqMatches;
        },
        addEventListener: (type: string, l: () => void) => type === "change" && (mqListener = l),
        removeEventListener: (type: string, l: () => void) => type === "change" && l === mqListener && (mqListener = undefined),
      };
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const toggle = () => screen.getByRole("button", { name: COPY.menu.open });

  it("est fermé au départ (panneau hidden, aria-expanded=false)", () => {
    render(<MobileMenu />);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: COPY.menu.label })).toBeNull(); // hidden => hors arbre a11y
  });

  it("s'ouvre au clic et liste l'accueil + toute la navigation", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    const nav = screen.getByRole("navigation", { name: COPY.menu.label });
    expect(screen.getByRole("button", { name: COPY.menu.close })).toHaveAttribute("aria-expanded", "true");
    expect(nav.querySelectorAll("a")).toHaveLength(1 + NAV.length);
    expect(screen.getByRole("link", { name: HOME_LINK.label })).toHaveAttribute("href", HOME_LINK.href);
  });

  it("les liens d'ancre sont des <a> natifs : <Link> ramène en haut de page quand l'ancre est déjà dans l'URL", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    for (const item of NAV) expect(screen.getByRole("link", { name: item.label }), item.href).not.toHaveAttribute("data-next-link");
    expect(screen.getByRole("link", { name: HOME_LINK.label }), "« Accueil » reste un <Link>").toHaveAttribute("data-next-link");
  });

  it("Échap ferme le menu et rend le focus au bouton", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus();
  });

  it("un clic à l'extérieur ferme le menu", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    fireEvent.pointerDown(document.body);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("choisir un lien ferme le menu", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    fireEvent.click(screen.getByRole("link", { name: HOME_LINK.label }));
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("passer en largeur desktop (≥ 1024 px) ferme le menu", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    mqMatches = true;
    act(() => mqListener?.());
    expect(screen.getByRole("button", { name: COPY.menu.open })).toHaveAttribute("aria-expanded", "false");
  });

  it("une autre touche qu'Échap, ou un clic dans le menu, le laissent ouvert", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.pointerDown(screen.getByRole("navigation", { name: COPY.menu.label }));
    expect(screen.getByRole("button", { name: COPY.menu.close })).toHaveAttribute("aria-expanded", "true");
  });

  it("repasser sous 1024 px ne ferme pas le menu ; fermé, il ne réagit plus à Échap", () => {
    render(<MobileMenu />);
    fireEvent.click(toggle());
    act(() => mqListener?.()); // mqMatches reste false
    expect(screen.getByRole("button", { name: COPY.menu.close })).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    const button = toggle();
    button.blur();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).not.toHaveFocus(); // plus d'écouteur : le focus n'est pas repris
  });

  it("seuil desktop : (min-width: 1024px) ; à la fermeture, tous les écouteurs sont retirés", () => {
    const remove = vi.spyOn(document, "removeEventListener");
    render(<MobileMenu />);
    fireEvent.click(toggle());
    expect(mqQuery).toBe("(min-width: 1024px)");
    expect(mqListener).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mqListener).toBeUndefined();
    expect(remove).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
    remove.mockRestore();
  });
});
