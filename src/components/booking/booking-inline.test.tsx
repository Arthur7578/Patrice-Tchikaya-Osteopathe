// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/lib/content/types";
import { FakeIntersectionObserver } from "@/test/intersection-observer";

const waitForCalScript = vi.fn<(timeoutMs: number) => Promise<void>>();
vi.mock("./cal", () => ({
  CAL_CONFIG: { layout: "month_view", theme: "light" },
  CAL_INLINE_NAMESPACE: "rdv-inline",
  waitForCalScript,
}));
// L'embed Cal.com réel injecterait un script distant : on vérifie seulement ce qui lui est passé.
vi.mock("@calcom/embed-react", () => ({
  default: (props: Record<string, unknown>) => <div data-testid="cal-embed" data-props={JSON.stringify(props)} />,
}));

const { BookingInline } = await import("./booking-inline");

const CAL: Booking = { url: "https://cal.eu/cabinet/consultation", provider: "cal", calLink: "cabinet/consultation", calOrigin: "https://app.cal.eu" };
const GENERIC: Booking = { url: "https://www.doctena.lu/rdv", provider: "generic", calLink: null, calOrigin: null };

const embed = () => screen.queryByTestId("cal-embed");
const fallbackLink = () => screen.queryByRole("link", { name: "Ouvrir l'agenda de réservation" });
const loading = () => screen.queryByText("Chargement de l'agenda…");

/** Déclenche l'intersection du conteneur observé, et laisse les promesses se résoudre. */
async function enterViewport(isIntersecting = true) {
  const [observer] = FakeIntersectionObserver.instances;
  await act(async () => {
    observer!.trigger([...observer!.observed].map((target) => ({ target, isIntersecting })));
  });
}

describe("BookingInline", () => {
  let observers: FakeIntersectionObserver[];
  beforeEach(() => {
    observers = FakeIntersectionObserver.install();
    waitForCalScript.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("prestataire générique : lien direct vers l'agenda, jamais d'iframe ni d'observateur (règle 6)", () => {
    render(<BookingInline booking={GENERIC} />);
    expect(fallbackLink()).toHaveAttribute("href", GENERIC.url);
    expect(embed()).toBeNull();
    expect(observers).toHaveLength(0);
  });

  it("Cal.com, hors écran : rien n'est chargé (aucun coût au chargement initial)", () => {
    render(<BookingInline booking={CAL} />);
    expect(loading()).toBeInTheDocument();
    expect(embed()).toBeNull();
    expect(waitForCalScript).not.toHaveBeenCalled();
    expect(observers[0]!.options).toEqual({ rootMargin: "600px 0px" });
  });

  it("une entrée « non visible » ne déclenche rien", async () => {
    render(<BookingInline booking={CAL} />);
    await enterViewport(false);
    expect(embed()).toBeNull();
    expect(waitForCalScript).not.toHaveBeenCalled();
    expect(observers[0]!.disconnected).toBe(false);
  });

  it("à l'approche : monte l'embed (namespace inline, origine UE), puis retire le chargement quand le script est prêt", async () => {
    let ready!: () => void;
    waitForCalScript.mockReturnValue(new Promise<void>((resolve) => (ready = resolve)));
    render(<BookingInline booking={CAL} />);
    await enterViewport();

    expect(observers[0]!.disconnected).toBe(true);
    expect(waitForCalScript).toHaveBeenCalledWith(10_000);
    expect(JSON.parse(embed()!.getAttribute("data-props")!)).toMatchObject({
      namespace: "rdv-inline",
      calLink: "cabinet/consultation",
      calOrigin: "https://app.cal.eu",
      config: { layout: "month_view", theme: "light" },
    });
    expect(loading()).toBeInTheDocument();

    await act(async () => ready());
    expect(loading()).toBeNull();
    expect(fallbackLink()).toBeNull();
    expect(embed()).toBeInTheDocument();
  });

  it("script Cal.com indisponible (bloqueur, réseau) : l'embed est retiré et le lien direct affiché", async () => {
    waitForCalScript.mockRejectedValue(new Error("Cal.com embed indisponible"));
    render(<BookingInline booking={CAL} />);
    await enterViewport();
    expect(embed()).toBeNull();
    expect(fallbackLink()).toHaveAttribute("href", CAL.url);
    expect(screen.getByText("L'agenda n'a pas pu se charger ici.")).toBeInTheDocument();
  });

  it("démontage : l'observateur est déconnecté", () => {
    const { unmount } = render(<BookingInline booking={CAL} />);
    unmount();
    expect(observers[0]!.disconnected).toBe(true);
  });
});
