"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { UiCopy } from "@/content/ui-copy";

type NavLink = { href: string; label: string };
/** `children` : bloc ajouté sous les liens (sélecteur de langue, trop large pour l'en-tête sur mobile). */
type Props = { home: NavLink; links: NavLink[]; labels: UiCopy["menu"]; children?: ReactNode };

const ITEM_LINK =
  "block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-sage-50 hover:text-sage-700";

/** Menu déroulant du header sous lg (au-dessus, la navigation horizontale prend le relais). */
export function MobileMenu({ home, links, labels, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onResize = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full text-ink hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700"
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
      </button>
      <nav
        id={panelId}
        aria-label={labels.label}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-slate-100 bg-white shadow-md"
      >
        <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <li>
            <Link href={home.href} onClick={() => setOpen(false)} className={ITEM_LINK}>
              {home.label}
            </Link>
          </li>
          {/* Ancres en <a> natif, pas <Link> : avec l'ancre déjà dans l'URL, <Link> ramène en haut de page au lieu de la section. */}
          {links.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)} className={ITEM_LINK}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        {children && <div className="mx-auto max-w-6xl border-t border-slate-100 px-4 sm:px-6">{children}</div>}
      </nav>
    </div>
  );
}
