import Link from "next/link";
import { COPY, NAV } from "@/content/ui-copy";
import { formatOpeningHours } from "@/lib/content/format";
import type { SiteContent } from "@/lib/content/types";

type Props = { content: SiteContent };

export function SiteFooter({ content }: Props) {
  const { practitioner, contact, about, openingHours, googleBusinessUrl } = content;
  const year = new Date().getFullYear();
  const gtmEnabled = /^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID ?? "");
  return (
    <footer className="bg-sage-900 pb-28 text-sage-100 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-bold text-white">{practitioner.name}</p>
            <p className="text-sm text-sage-100/80">{practitioner.title}</p>
            <p className="mt-4 text-sm leading-relaxed text-sage-100/80">{about.shortBio}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Cabinet</h3>
            <address className="mt-4 not-italic text-sm leading-relaxed text-sage-100/80">
              {contact.street}
              <br />
              {contact.postalCode} {contact.locality}, {contact.countryName}
              <br />
              {COPY.infos.labels.phoneOffice}{" "}
              <a href={`tel:${contact.phoneE164}`} className="whitespace-nowrap hover:underline">
                {contact.phoneDisplay}
              </a>
              {contact.mobilePhone && (
                <>
                  <br />
                  {COPY.infos.labels.phoneMobile}{" "}
                  <a href={`tel:${contact.mobilePhone.e164}`} className="whitespace-nowrap hover:underline">
                    {contact.mobilePhone.display}
                  </a>
                </>
              )}
            </address>
            {openingHours && (
              <ul className="mt-3 space-y-1 text-sm text-sage-100/80">
                {formatOpeningHours(openingHours).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Liens</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-sage-100/80 hover:text-white hover:underline">
                    {item.label}
                  </a>
                </li>
              ))}
              {googleBusinessUrl && (
                <li>
                  <a
                    href={googleBusinessUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-sage-100/80 hover:text-white hover:underline"
                  >
                    Fiche Google <span className="sr-only">(nouvel onglet)</span>
                  </a>
                </li>
              )}
              <li>
                <Link href="/mentions-legales" className="text-sage-100/80 hover:text-white hover:underline">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-sage-100/80 hover:text-white hover:underline">
                  Confidentialité
                </Link>
              </li>
              {gtmEnabled && (
                <li>
                  <a href="#cookies" className="text-sage-100/80 hover:text-white hover:underline">
                    Gérer les cookies
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-sage-100/60">
          © {year} {practitioner.name} – {practitioner.title}
        </p>
      </div>
    </footer>
  );
}
