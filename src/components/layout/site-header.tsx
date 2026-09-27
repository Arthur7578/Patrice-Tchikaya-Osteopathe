import { MapPin } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NAV } from "@/content/ui-copy";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = { content: SiteContent };

export function SiteHeader({ content }: Props) {
  const { practitioner, contact, booking } = content;
  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-bold text-ink">{practitioner.name}</span>
          <span className="text-sm text-slate-500">• {practitioner.title}</span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-sm font-medium text-slate-600 hover:text-sage-700">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/#infos"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-sm font-medium text-sage-800"
          >
            <MapPin aria-hidden="true" className="size-4" />
            {contact.locality}
          </Link>
          <a href={booking.url} className={cn(buttonVariants({ size: "sm" }))}>
            Prendre RDV
          </a>
        </div>
      </div>
    </header>
  );
}
