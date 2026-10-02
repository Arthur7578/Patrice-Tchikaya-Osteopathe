import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Une ligne d'une liste `<dl class="grid grid-cols-[auto_1fr]">` : icône + libellé, puis le contenu. `id` : ancre sur la ligne. */
export function InfoRow({
  icon: Icon,
  label,
  id,
  children,
}: {
  icon: LucideIcon;
  label: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt id={id} className="text-sage-700">
        <Icon aria-hidden="true" className="size-5" />
      </dt>
      <dd>
        <p className="font-semibold text-ink">{label}</p>
        {children}
      </dd>
    </>
  );
}
