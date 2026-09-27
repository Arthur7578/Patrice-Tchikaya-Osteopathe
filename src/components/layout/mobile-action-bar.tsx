"use client";

import { CalendarDays, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { BookingLink } from "@/components/booking/booking-link";
import { buttonVariants } from "@/components/ui/button";
import type { Booking } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = { booking: Booking; phoneE164: string; phoneDisplay: string };

/** Barre fixe mobile (< md) : visible quand le déclencheur (CTA hero / h1) ET l'agenda inline sont hors écran. */
export function MobileActionBar({ booking, phoneE164, phoneDisplay }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déclencheur : CTA du hero (accueil) ou, à défaut, le <h1> de la page (pages légales…).
    const trigger = document.getElementById("hero-cta") ?? document.querySelector("main h1");
    const inline = document.getElementById("rendez-vous");
    if (!trigger) return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
      setVisible(!seen.get(trigger) && !(inline && seen.get(inline)));
    });
    io.observe(trigger);
    if (inline) io.observe(inline);
    return () => io.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex gap-3">
        <BookingLink booking={booking} className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
          <CalendarDays aria-hidden="true" /> Prendre rendez-vous
        </BookingLink>
        <a
          href={`tel:${phoneE164}`}
          aria-label={`Appeler le cabinet au ${phoneDisplay}`}
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-13 px-0")}
        >
          <Phone aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
