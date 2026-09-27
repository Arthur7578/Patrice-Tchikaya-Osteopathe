import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
};

export function Section({ id, labelledBy, className, children }: Props) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("py-16 md:py-24", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
