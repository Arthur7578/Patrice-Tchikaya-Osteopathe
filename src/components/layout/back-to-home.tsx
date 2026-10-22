import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { localePath, type Locale } from "@/config/i18n";
import { getCopy } from "@/content/ui-copy";
import { cn } from "@/lib/utils";

/** Bouton de retour vers l'accueil, en bas des pages autres que l'accueil. */
export function BackToHome({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <div className={cn("flex justify-center", className)}>
      <Link href={localePath(locale, "/")} className={buttonVariants({ variant: "secondary", size: "lg" })}>
        <ArrowLeft aria-hidden="true" />
        {getCopy(locale).backToHome}
      </Link>
    </div>
  );
}
