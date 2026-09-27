import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content/get-site-content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: "Confidentialité",
    description: `Politique de confidentialité du site de ${c.practitioner.name}, ${c.practitioner.title} à ${c.contact.locality}.`,
    alternates: { canonical: "/confidentialite" },
  };
}

export default async function ConfidentialitePage() {
  const c = await getSiteContent();
  const gtmEnabled = /^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID ?? "");

  return (
    <main id="contenu">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">Confidentialité</h1>

        <div className="mt-8 space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="text-xl font-semibold text-ink">Données collectées par ce site</h2>
            <p className="mt-2">
              Ce site ne comporte aucun formulaire. Il ne dépose aucun cookie sans votre accord explicite.
            </p>
          </section>

          {gtmEnabled && (
            <section id="cookies">
              <h2 className="text-xl font-semibold text-ink">Google Tag Manager (avec votre accord)</h2>
              <p className="mt-2">
                Ce site utilise Google Tag Manager, chargé uniquement si vous l&apos;acceptez via la bannière
                affichée lors de votre première visite. Tant que vous n&apos;avez pas donné votre accord (ou si vous
                le refusez), aucun cookie lié à cet outil n&apos;est déposé et aucun script correspondant
                n&apos;est chargé.
              </p>
              <p className="mt-2">
                Vous pouvez revenir sur votre choix à tout moment via le lien « Gérer les cookies » en pied de page,
                qui rouvre la bannière de consentement.
              </p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold text-ink">Prise de rendez-vous en ligne</h2>
            <p className="mt-2">
              La prise de rendez-vous est assurée par un service tiers de réservation en ligne, chargé uniquement à
              votre initiative (survol, clic ou approche de l&apos;agenda). Les données que vous saisissez pour
              réserver un créneau (nom, e-mail, téléphone) sont traitées directement par ce service, selon sa propre
              politique de confidentialité. Ce site n&apos;a accès à aucune de ces données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Mesure d&apos;audience sans cookie</h2>
            <p className="mt-2">
              Si une mesure d&apos;audience Vercel est activée en complément, elle fonctionne sans cookie et sans
              donnée personnelle identifiable, à des fins statistiques uniquement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Vos droits</h2>
            <p className="mt-2">
              Conformément au Règlement général sur la protection des données (RGPD), vous disposez d&apos;un droit
              d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition sur vos données personnelles.
              Pour toute question, vous pouvez contacter {c.practitioner.name} au {c.contact.phoneDisplay}.
            </p>
            <p className="mt-2">
              Autorité de contrôle compétente au Luxembourg : Commission nationale pour la protection des données
              (CNPD).
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
