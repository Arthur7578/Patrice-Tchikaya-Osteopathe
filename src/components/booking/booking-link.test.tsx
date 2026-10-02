// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/lib/content/types";

const cal = vi.fn();
const loadCalPopup = vi.fn();
const waitForCalScript = vi.fn();
vi.mock("./cal", () => ({
  CAL_CONFIG: { layout: "month_view", theme: "light" },
  loadCalPopup,
  waitForCalScript,
}));

const { BookingLink } = await import("./booking-link");

const CAL: Booking = { url: "https://cal.eu/cabinet/consultation", provider: "cal", calLink: "cabinet/consultation", calOrigin: "https://app.cal.eu" };
const GENERIC: Booking = { url: "https://www.doctena.lu/rdv", provider: "generic", calLink: null, calOrigin: null };

describe("BookingLink", () => {
  beforeEach(() => {
    cal.mockReset();
    loadCalPopup.mockReset().mockResolvedValue(cal);
    waitForCalScript.mockReset().mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it("rend toujours un vrai <a href> (fonctionne sans JS, règle 6)", () => {
    render(<BookingLink booking={CAL}>Prendre RDV</BookingLink>);
    expect(screen.getByRole("link", { name: "Prendre RDV" })).toHaveAttribute("href", CAL.url);
  });

  it("prestataire générique : lien direct, aucun chargement Cal.com", () => {
    render(<BookingLink booking={GENERIC}>RDV</BookingLink>);
    fireEvent.click(screen.getByRole("link"));
    expect(screen.getByRole("link")).toHaveAttribute("href", GENERIC.url);
    expect(loadCalPopup).not.toHaveBeenCalled();
  });

  it("clic gauche : ouvre la popup Cal.com avec l'origine passée explicitement", async () => {
    render(<BookingLink booking={CAL}>RDV</BookingLink>);
    const notPrevented = fireEvent.click(screen.getByRole("link"));
    expect(notPrevented).toBe(false); // preventDefault appelé
    await waitFor(() =>
      expect(cal).toHaveBeenCalledWith("modal", {
        calLink: "cabinet/consultation",
        calOrigin: "https://app.cal.eu",
        config: { layout: "month_view", theme: "light" },
      }),
    );
  });

  it.each([
    ["Ctrl", { ctrlKey: true }],
    ["Cmd", { metaKey: true }],
    ["Maj", { shiftKey: true }],
    ["Alt", { altKey: true }],
    ["clic molette", { button: 1 }],
  ])("%s + clic : laisse le navigateur suivre le lien (pas de popup)", (_label, init) => {
    render(<BookingLink booking={CAL}>RDV</BookingLink>);
    const notPrevented = fireEvent.click(screen.getByRole("link"), init);
    expect(notPrevented).toBe(true);
    expect(cal).not.toHaveBeenCalled();
  });

  it("respecte un onClick parent qui appelle preventDefault", () => {
    render(
      <BookingLink booking={CAL} onClick={(e) => e.preventDefault()}>
        RDV
      </BookingLink>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(loadCalPopup).not.toHaveBeenCalled();
  });

  it("embed indisponible : bascule sur le lien direct (aucun RDV perdu)", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    waitForCalScript.mockRejectedValue(new Error("Cal.com embed indisponible"));
    render(<BookingLink booking={CAL}>RDV</BookingLink>);
    fireEvent.click(screen.getByRole("link"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith(CAL.url));
    expect(cal).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("préchauffe l'embed au survol et au focus, sans faire échouer le rendu si le chargement échoue", () => {
    loadCalPopup.mockRejectedValue(new Error("réseau"));
    render(<BookingLink booking={CAL}>RDV</BookingLink>);
    fireEvent.pointerEnter(screen.getByRole("link"));
    fireEvent.focus(screen.getByRole("link"));
    expect(loadCalPopup).toHaveBeenCalledTimes(2);
  });
});
