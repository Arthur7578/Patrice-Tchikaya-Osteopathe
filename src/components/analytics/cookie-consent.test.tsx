// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// next/script ne s'exécute pas hors de Next : on rend un marqueur inerte qui expose l'id et le code.
vi.mock("next/script", () => ({
  default: ({ id, strategy, children }: { id: string; strategy: string; children: ReactNode }) => (
    <div data-testid="next-script" data-id={id} data-strategy={strategy}>
      {children}
    </div>
  ),
}));

/** NEXT_PUBLIC_GTM_ID est lu à l'import du module : on le recharge pour chaque valeur. */
async function loadWithGtmId(id: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GTM_ID", id ?? "");
  return (await import("./cookie-consent")).CookieConsent;
}

const banner = () => screen.queryByRole("dialog", { name: "Consentement aux cookies" });
const gtmScript = () => screen.queryByTestId("next-script");

describe("CookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it.each([
    ["absent", undefined],
    ["mal formé", "UA-12345"],
    ["tentative d'injection dans le script inline", "GTM-ABC');alert(1);//"],
    ["minuscules", "GTM-abc123"],
  ])("identifiant GTM %s : rien n'est rendu (ni bannière, ni script)", async (_label, id) => {
    const CookieConsent = await loadWithGtmId(id);
    const { container } = render(<CookieConsent />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sans choix enregistré : bannière affichée, GTM NON chargé (règle 5)", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    render(<CookieConsent />);
    expect(banner()).toBeInTheDocument();
    expect(gtmScript()).toBeNull();
  });

  it("« Accepter » : choix mémorisé, bannière fermée, GTM chargé avec cet identifiant", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: "Accepter" }));
    expect(window.localStorage.getItem("cookie-consent")).toBe("accepted");
    expect(banner()).toBeNull();
    expect(gtmScript()).toHaveAttribute("data-id", "gtm-init");
    expect(gtmScript()).toHaveAttribute("data-strategy", "afterInteractive");
    expect(gtmScript()?.textContent).toContain("'dataLayer','GTM-ABC123'");
    expect(gtmScript()?.textContent).toContain("https://www.googletagmanager.com/gtm.js?id=");
  });

  it("« Refuser » : choix mémorisé, bannière fermée, GTM jamais chargé", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
    expect(window.localStorage.getItem("cookie-consent")).toBe("refused");
    expect(banner()).toBeNull();
    expect(gtmScript()).toBeNull();
  });

  it("choix déjà enregistré : pas de bannière ; GTM seulement si accepté", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    window.localStorage.setItem("cookie-consent", "refused");
    const refused = render(<CookieConsent />);
    expect(banner()).toBeNull();
    expect(gtmScript()).toBeNull();
    refused.unmount();

    window.localStorage.setItem("cookie-consent", "accepted");
    render(<CookieConsent />);
    expect(banner()).toBeNull();
    expect(gtmScript()).not.toBeNull();
  });

  it("valeur inconnue en stockage : traitée comme « pas encore choisi »", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    window.localStorage.setItem("cookie-consent", "peut-être");
    render(<CookieConsent />);
    expect(banner()).toBeInTheDocument();
    expect(gtmScript()).toBeNull();
  });

  it("lien « Gérer les cookies » (#cookies) : rouvre la bannière ; un nouveau choix retire le #cookies de l'URL", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    window.localStorage.setItem("cookie-consent", "accepted");
    window.history.replaceState(null, "", "/confidentialite?x=1");
    render(<CookieConsent />);
    expect(banner()).toBeNull();

    act(() => {
      window.location.hash = "#cookies";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(banner()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/confidentialite?x=1");
    expect(window.localStorage.getItem("cookie-consent")).toBe("refused");
    expect(gtmScript()).toBeNull();
  });

  it("choix fait dans un autre onglet (événement storage) : pris en compte sans recharger", async () => {
    const CookieConsent = await loadWithGtmId("GTM-ABC123");
    render(<CookieConsent />);
    expect(banner()).toBeInTheDocument();
    act(() => {
      window.localStorage.setItem("cookie-consent", "accepted");
      window.dispatchEvent(new StorageEvent("storage", { key: "cookie-consent" }));
    });
    expect(banner()).toBeNull();
    expect(gtmScript()).not.toBeNull();
  });
});
