import { Star } from "lucide-react";
import { COPY } from "@/content/ui-copy";
import { formatRating } from "@/lib/content/format";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  showValue,
  className,
}: {
  value: number;
  showValue?: boolean;
  className?: string;
}) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className={i < full ? "size-4 fill-amber-400 text-amber-400" : "size-4 fill-slate-200 text-slate-200"}
          />
        ))}
      </span>
      {showValue && (
        <span aria-hidden="true" className="text-sm font-medium text-slate-500">
          {full}/5
        </span>
      )}
      <span className="sr-only">{COPY.starRating(formatRating(value))}</span>
    </span>
  );
}
