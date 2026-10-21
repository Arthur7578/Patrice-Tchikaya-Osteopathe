"use client";

import type { ComponentProps, MouseEvent } from "react";
import type { Booking } from "@/lib/content/types";
import { CAL_CONFIG, loadCalPopup, waitForCalScript } from "./cal";
import { type BookingPlacement, trackBookingClick } from "./track";

type BookingLinkProps = Omit<ComponentProps<"a">, "href"> & { booking: Booking; placement: BookingPlacement };

/**
 * Vrai lien <a href="…"> vers la prise de RDV, amélioré progressivement et générique par
 * construction (§ voir docs/DECISIONS.md) :
 * - `provider === "generic"` (tout prestataire hors Cal.com, ex. Doctena) : lien direct,
 *   aucune tentative d'intégration — changer de prestataire ne demande aucun changement ici ;
 * - `provider === "cal"` : popup Cal.com (origine passée explicitement à chaque ouverture),
 *   avec repli vers le lien direct sans JS, clic molette/Ctrl, ou si l'embed est indisponible
 *   (aucune perte de RDV, règle 6).
 * Chaque clic (sauf annulé par un `onClick` parent) est compté avec son emplacement (`trackBookingClick`).
 */
export function BookingLink({ booking, placement, onClick, children, ...props }: BookingLinkProps) {
  function trackClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) trackBookingClick(placement, booking.provider);
  }

  if (booking.provider !== "cal") {
    return (
      <a href={booking.url} onClick={trackClick} {...props}>
        {children}
      </a>
    );
  }
  const calLink = booking.calLink;
  const calOrigin = booking.calOrigin;

  const warm = () => void loadCalPopup().catch(() => {});

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackClick(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      const cal = await loadCalPopup();
      await waitForCalScript(5000);
      cal("modal", { calLink: calLink!, calOrigin: calOrigin!, config: { ...CAL_CONFIG } });
    } catch {
      window.location.assign(booking.url);
    }
  }

  return (
    <a href={booking.url} onClick={handleClick} onPointerEnter={warm} onFocus={warm} onTouchStart={warm} {...props}>
      {children}
    </a>
  );
}
