import { cn } from "@/lib/utils";

/**
 * Fond visuel affiché tant qu'aucune URL publique n'est renseignée dans Notion (règle 3).
 * Doit paraître intentionnel (motif de cercles concentriques + monogramme), jamais « image manquante ».
 */
export function ImagePlaceholder({ monogram = "PT", className }: { monogram?: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-sage-100 via-sage-50 to-white",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="60" stroke="var(--color-sage-300)" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="110" stroke="var(--color-sage-300)" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="160" stroke="var(--color-sage-300)" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="210" stroke="var(--color-sage-300)" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="260" stroke="var(--color-sage-300)" strokeWidth="1.5" />
      </svg>
      <span className="relative text-6xl font-extrabold text-sage-700/80">{monogram}</span>
    </div>
  );
}
