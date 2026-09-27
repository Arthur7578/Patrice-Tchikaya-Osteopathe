import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm font-semibold uppercase tracking-[0.14em] text-sage-700", className)}>
      {children}
    </p>
  );
}
