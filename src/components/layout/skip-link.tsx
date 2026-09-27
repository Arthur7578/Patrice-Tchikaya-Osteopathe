import { COPY } from "@/content/ui-copy";

export function SkipLink() {
  return (
    <a
      href="#contenu"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-sage-700 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-sage-900"
    >
      {COPY.skipLink}
    </a>
  );
}
