// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("@vercel/analytics", () => ({ track }));

const { BOOKING_CLICK_EVENT, trackBookingClick } = await import("./track");

type WithDataLayer = { dataLayer?: unknown };

describe("trackBookingClick", () => {
  // Accolades obligatoires : une fonction renvoyée par beforeEach est rappelée par vitest comme nettoyage.
  beforeEach(() => {
    track.mockReset();
  });
  afterEach(() => {
    delete (window as WithDataLayer).dataLayer;
  });

  it("envoie l'événement à Vercel Web Analytics avec l'emplacement et le prestataire, rien d'autre", () => {
    trackBookingClick("hero", "generic");
    expect(track).toHaveBeenCalledExactlyOnceWith(BOOKING_CLICK_EVENT, { placement: "hero", provider: "generic" });
    expect(BOOKING_CLICK_EVENT).toBe("booking_click");
  });

  it("sans consentement (aucun dataLayer) : n'en crée pas", () => {
    trackBookingClick("faq", "cal");
    expect((window as WithDataLayer).dataLayer).toBeUndefined();
  });

  it("avec GTM accepté (dataLayer présent) : y pousse l'événement", () => {
    const dataLayer: unknown[] = [];
    (window as WithDataLayer).dataLayer = dataLayer;
    trackBookingClick("infos", "generic");
    expect(dataLayer).toEqual([{ event: "booking_click", booking_placement: "infos", booking_provider: "generic" }]);
  });

  it("une erreur de mesure n'empêche jamais le RDV (et le dataLayer reçoit quand même l'événement)", () => {
    track.mockImplementation(() => {
      throw new Error("analytics");
    });
    const dataLayer: unknown[] = [];
    (window as WithDataLayer).dataLayer = dataLayer;
    trackBookingClick("header", "cal"); // ne lève pas : sinon le test échouerait ici
    expect(track).toHaveBeenCalledOnce();
    expect(dataLayer).toHaveLength(1);
  });
});
