import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Building2, Fingerprint, Info, Landmark, Lock, Phone, Receipt, Smartphone, UserCheck } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { COPY } from "@/content/ui-copy";
import { getSiteContent } from "@/lib/content/get-site-content";

const REASSURANCE_ICONS: LucideIcon[] = [Landmark, Lock, Fingerprint, UserCheck];
const FIRST_TIME_ICONS: LucideIcon[] = [Smartphone, Building2];

// Pas d'`openGraph` ici : la page hérite de celui du layout (image OG, site_name, locale), utile
// quand le lien est partagé aux patients par SMS ou e-mail (fusion superficielle de Next).
export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: COPY.payment.metaTitle,
    description: COPY.payment.metaDescription(c.contact.locality),
    alternates: { canonical: "/paiement" },
  };
}

/**
 * Règlement après la séance : guide Wero pour les patients (page à partager par SMS / e-mail).
 * Coordonnées Wero, autres moyens, conseil sur le message et encart « Bon à savoir » : Notion ;
 * rien n'est affiché s'ils manquent.
 */
export default async function PaiementPage() {
  const { payment, consultation, contact } = await getSiteContent();
  const { wero } = payment;
  const copy = COPY.payment;
  const steps = [
    { title: copy.steps.open.title, text: copy.steps.open.text },
    { title: copy.steps.send.title, text: copy.steps.send.text(wero.recipient) },
    { title: copy.steps.amount.title, text: copy.steps.amount.text(consultation.price, payment.messageTip) },
    { title: copy.steps.confirm.title, text: copy.steps.confirm.text(wero.recipientName) },
  ];

  return (
    <main id="contenu">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="max-w-3xl">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg text-pretty text-slate-600">{payment.info}</p>
          <p className="mt-2 text-lg text-pretty text-slate-600">{copy.intro}</p>
        </div>

        {wero.recipient && (
          <dl className="mt-8 grid max-w-3xl gap-x-8 gap-y-4 rounded-2xl border border-sage-200 bg-sage-50 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-sage-800">
                {wero.recipient.kind === "email" ? copy.recipient.email : copy.recipient.phone}
              </dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight text-ink wrap-anywhere select-all">
                {wero.recipient.value}
              </dd>
            </div>
            {wero.recipientName && (
              <div>
                <dt className="text-sm font-semibold text-sage-800">{copy.recipient.name}</dt>
                <dd className="mt-1 font-semibold text-ink">{wero.recipientName}</dd>
              </div>
            )}
            {consultation.price && (
              <div>
                <dt className="text-sm font-semibold text-sage-800">{copy.recipient.price}</dt>
                <dd className="mt-1 font-semibold text-ink">{consultation.price}</dd>
              </div>
            )}
          </dl>
        )}

        <section aria-labelledby="etapes-title" className="mt-16">
          <h2 id="etapes-title" className="text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl">
            {copy.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full bg-sage-700 font-bold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-600 wrap-anywhere">{step.text}</p>
              </li>
            ))}
          </ol>
          {payment.caution && (
            <p className="mt-6 flex gap-3 rounded-2xl border border-sage-200 bg-sage-50 p-5 text-slate-700">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sage-700" />
              <span>
                <strong className="font-semibold text-ink">{copy.caution.label} :</strong> {payment.caution}
              </span>
            </p>
          )}
        </section>

        <section aria-labelledby="securite-title" className="mt-16 rounded-3xl bg-sage-700 p-8 text-white md:p-12">
          <h2 id="securite-title" className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {copy.reassuranceTitle}
          </h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-2">
            {copy.reassurance.map((item, i) => {
              const Icon = REASSURANCE_ICONS[i % REASSURANCE_ICONS.length];
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 leading-relaxed text-sage-100">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="premiere-fois-title" className="mt-16">
          <h2
            id="premiere-fois-title"
            className="text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl"
          >
            {copy.firstTimeTitle}
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {copy.firstTime.map((item, i) => {
              const Icon = FIRST_TIME_ICONS[i % FIRST_TIME_ICONS.length];
              return (
                <li key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8">
                  <span className="grid size-12 place-items-center rounded-xl bg-sage-100 text-sage-700">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
                  <div className="mt-2 space-y-2 leading-relaxed text-slate-600">
                    {item.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="aide-title"
          className="mt-16 max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8"
        >
          <h2 id="aide-title" className="text-2xl font-bold tracking-tight text-ink">
            {copy.helpTitle}
          </h2>
          {payment.otherMethods && (
            <p className="mt-4 text-slate-600">
              <strong className="font-semibold text-ink">{copy.otherMethods} :</strong> {payment.otherMethods}
            </p>
          )}
          <p className="mt-4 text-slate-600">{copy.help}</p>
          <a
            href={`tel:${contact.phoneE164}`}
            className="mt-2 inline-flex items-center gap-2 font-semibold text-sage-700 underline underline-offset-4"
          >
            <Phone aria-hidden="true" className="size-4 shrink-0" />
            {contact.phoneDisplay}
          </a>
          <p className="mt-6 flex gap-3 border-t border-slate-200/80 pt-6 text-sm text-slate-600">
            <Receipt aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage-700" />
            {consultation.reimbursement}
          </p>
        </section>
      </div>
    </main>
  );
}
