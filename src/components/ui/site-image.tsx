import Image from "next/image";
import type { ReactNode } from "react";
import type { SiteImage as SiteImageData } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = {
  image: SiteImageData;
  sizes: string;
  /** true uniquement pour l'image LCP (hero). Remplace `priority`, déprécié en Next 16. */
  preload?: boolean;
  className?: string;
  /** Rendu si aucune URL publique n'est renseignée dans Notion. */
  placeholder: ReactNode;
};

/** Seul point d'entrée pour les images Notion : alt Notion toujours injecté, jamais d'image cassée. */
export function SiteImage({ image, sizes, preload = false, className, placeholder }: Props) {
  if (!image.src) return <>{placeholder}</>;
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      preload={preload}
      fetchPriority={preload ? "high" : undefined}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
