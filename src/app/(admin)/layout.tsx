import type { Metadata } from "next";
import type { ReactNode } from "react";
import { jakarta } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Layout racine de l'outil d'administration (hors langues du site : le site a son propre layout, app/[locale]). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
