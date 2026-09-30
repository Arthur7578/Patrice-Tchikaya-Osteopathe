"use client";

import Cal from "@calcom/embed-react";
import { useEffect, useRef, useState } from "react";
import { COPY } from "@/content/ui-copy";
import type { Booking } from "@/lib/content/types";
import { CAL_CONFIG, CAL_INLINE_NAMESPACE, waitForCalScript } from "./cal";

type Status = "idle" | "loading" | "ready" | "failed";

/**
 * Agenda inline, générique par construction : seul `provider === "cal"` monte un embed
 * Cal.com (à l'approche de la section, aucun coût au chargement initial). Pour tout autre
 * prestataire (ex. Doctena), on n'essaie jamais d'intégrer un iframe non prévu pour ça —
 * un vrai lien vers l'agenda est affiché directement (règle 6).
 */
export function BookingInline({ booking }: { booking: Booking }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(booking.provider === "cal" ? "idle" : "failed");

  useEffect(() => {
    if (booking.provider !== "cal") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setStatus("loading");
        waitForCalScript(10_000).then(
          () => setStatus("ready"),
          () => setStatus("failed"),
        );
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [booking.provider]);

  return (
    <div ref={ref} className="relative min-h-[720px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {booking.provider === "cal" && status !== "idle" && status !== "failed" && (
        <Cal
          namespace={CAL_INLINE_NAMESPACE}
          calLink={booking.calLink!}
          calOrigin={booking.calOrigin!}
          config={{ ...CAL_CONFIG }}
          style={{ width: "100%", height: "100%", minHeight: 720, overflow: "auto" }}
        />
      )}
      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-600">
          {status === "failed" ? (
            <>
              <p>{COPY.bookingInline.failed}</p>
              <a href={booking.url} className="font-semibold text-sage-700 underline underline-offset-4">
                {COPY.bookingInline.open}
              </a>
            </>
          ) : (
            <>
              <div className="size-10 animate-pulse rounded-full bg-sage-100" aria-hidden="true" />
              <p className="text-sm">{COPY.bookingInline.loading}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
