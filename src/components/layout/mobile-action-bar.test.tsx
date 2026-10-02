// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import { FakeIntersectionObserver } from "@/test/intersection-observer";

vi.mock("@/components/booking/booking-link", () => ({
  BookingLink: ({ booking, children, className }: { booking: { url: string }; children: React.ReactNode; className?: string }) => (
    <a href={booking.url} className={className}>
      {children}
    </a>
  ),
}));

const { MobileActionBar } = await import("./mobile-action-bar");

/** Éléments que la barre surveille, posés dans la page avant le rendu (comme dans le vrai layout). */
function page(html: string) {
  document.body.innerHTML = html;
  return {
    trigger: document.querySelector("#hero-cta, main h1")!,
    inline: document.querySelector("#rendez-vous"),
  };
}

const renderBar = () =>
  render(<MobileActionBar booking={C.booking} phoneE164={C.contact.phoneE164} phoneDisplay={C.contact.phoneDisplay} />, {
    container: document.body.appendChild(document.createElement("div")),
  });

const bar = () => screen.getByRole("link", { name: /Appeler le cabinet/ }).closest("div.fixed")!;

describe("MobileActionBar", () => {
  let observers: FakeIntersectionObserver[];
  beforeEach(() => {
    observers = FakeIntersectionObserver.install();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("contient un vrai lien de RDV et un lien d'appel (règle 6)", () => {
    page(`<div id="hero-cta"></div>`);
    renderBar();
    expect(screen.getByRole("link", { name: /Prendre rendez-vous/ })).toHaveAttribute("href", C.booking.url);
    expect(screen.getByRole("link", { name: `Appeler le cabinet au ${C.contact.phoneDisplay}` })).toHaveAttribute(
      "href",
      `tel:${C.contact.phoneE164}`,
    );
  });

  it("masquée (inert, hors écran) au départ", () => {
    page(`<div id="hero-cta"></div>`);
    renderBar();
    expect(bar()).toHaveAttribute("inert");
    expect(bar()).toHaveClass("translate-y-full");
  });

  it("visible quand le CTA du hero est sorti de l'écran, masquée quand il revient", () => {
    const { trigger } = page(`<div id="hero-cta"></div><div id="rendez-vous"></div>`);
    renderBar();
    const [observer] = observers;
    act(() => observer!.trigger([{ target: trigger, isIntersecting: false }]));
    expect(bar()).not.toHaveAttribute("inert");
    expect(bar()).toHaveClass("translate-y-0");
    act(() => observer!.trigger([{ target: trigger, isIntersecting: true }]));
    expect(bar()).toHaveAttribute("inert");
  });

  it("masquée quand l'agenda intégré est visible (pas de doublon avec lui)", () => {
    const { trigger, inline } = page(`<div id="hero-cta"></div><div id="rendez-vous"></div>`);
    renderBar();
    const [observer] = observers;
    expect([...observer!.observed]).toEqual([trigger, inline]);
    act(() => observer!.trigger([{ target: trigger, isIntersecting: false }, { target: inline!, isIntersecting: true }]));
    expect(bar()).toHaveAttribute("inert");
    act(() => observer!.trigger([{ target: inline!, isIntersecting: false }]));
    expect(bar()).not.toHaveAttribute("inert");
  });

  it("pages sans CTA de hero : le <h1> de la page sert de repère", () => {
    const { trigger } = page(`<main><h1>Mentions légales</h1></main>`);
    renderBar();
    expect([...observers[0]!.observed]).toEqual([trigger]);
    act(() => observers[0]!.trigger([{ target: trigger, isIntersecting: false }]));
    expect(bar()).not.toHaveAttribute("inert");
  });

  it("aucun repère dans la page : reste masquée, sans observateur", () => {
    page(`<p>rien</p>`);
    renderBar();
    expect(observers).toHaveLength(0);
    expect(bar()).toHaveAttribute("inert");
  });

  it("démontage : l'observateur est déconnecté", () => {
    page(`<div id="hero-cta"></div>`);
    const { unmount } = renderBar();
    unmount();
    expect(observers[0]!.disconnected).toBe(true);
  });
});
