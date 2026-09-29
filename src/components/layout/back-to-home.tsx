import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { COPY } from "@/content/ui-copy";
import { cn } from "@/lib/utils";

/** Bouton de retour vers l'accueil, en bas des pages autres que l'accueil. */
export function BackToHome({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center", className)}>
      <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
        <ArrowLeft aria-hidden="true" />
        {COPY.backToHome}
      </Link>
    </div>
  );
}
