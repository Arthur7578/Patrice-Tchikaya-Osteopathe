import { Star } from "lucide-react";
import { formatRating } from "@/lib/content/format";
import { cn } from "@/lib/utils";

export function StarRating({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={i < full ? "size-4 fill-amber-400 text-amber-400" : "size-4 fill-slate-200 text-slate-200"}
        />
      ))}
      <span className="sr-only">Note : {formatRating(value)} sur 5</span>
    </span>
  );
}
