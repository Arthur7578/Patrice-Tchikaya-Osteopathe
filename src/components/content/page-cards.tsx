import Link from "next/link";
import { MOTIF_ICONS, type MotifIconName } from "@/lib/icons";
import type { Motif } from "@/lib/content/types";

/** Grille de cartes vers des pages détaillées (motifs et pages d'information) : icône, titre, description. */
export function PageCards({ entries }: { entries: Motif[] }) {
  return (
    <ul className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => {
        const Icon = MOTIF_ICONS[entry.icon as MotifIconName];
        return (
          <li key={entry.slug} className="flex">
            <Link
              href={`/${entry.slug}`}
              className="group flex w-full items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-sage-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="font-semibold text-ink group-hover:text-sage-700">{entry.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{entry.description}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
