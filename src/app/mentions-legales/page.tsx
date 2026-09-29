import type { Metadata } from "next";
import { BackToHome } from "@/components/layout/back-to-home";
import { getSiteContent } from "@/lib/content/get-site-content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: "Mentions légales",
    description: `Mentions légales du site de ${c.practitioner.name}, ${c.practitioner.title} à ${c.contact.locality}.`,
    alternates: { canonical: "/mentions-legales" },
  };
}

export default async function MentionsLegalesPage() {
  const c = await getSiteContent();

  return (
    <main id="contenu">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">Mentions légales</h1>

        <div className="prose-content mt-8 space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="text-xl font-semibold text-ink">Éditeur du site</h2>
            <p className="mt-2">
              {c.practitioner.name} — {c.practitioner.title}
              <br />
              {c.contact.street}, {c.contact.postalCode} {c.contact.locality}, {c.contact.countryName}
              <br />
              Téléphone : {c.contact.phoneDisplay}
              <br />
              E-mail : {c.contact.email ?? "[À COMPLÉTER : adresse e-mail professionnelle — champ Notion Email_Contact]"}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Profession réglementée</h2>
            <p className="mt-2">
              L&apos;ostéopathie est une profession de santé réglementée au Grand-Duché de Luxembourg, inscrite sur
              la liste des professions de santé fixée par la loi modifiée du 26 mars 1992 sur l&apos;exercice et la
              revalorisation de certaines professions de santé (ajout opéré par la loi du 21 août 2018). {c.practitioner.name}{" "}
              exerce sous autorisation d&apos;exercer délivrée par le ministre de la Santé du Luxembourg et figure au
              registre professionnel tenu par ce ministère.
            </p>
            <p className="mt-2">
              Numéro d&apos;autorisation d&apos;exercer :{" "}
              {c.legal.authorizationNumber ??
                "[À COMPLÉTER — champ Notion Numero_Autorisation_Exercer ; délivré par le ministère de la Santé]"}
              <br />
              École et année du diplôme :{" "}
              {c.about.education ?? "[À COMPLÉTER — champ Notion Formation, base Section A_Propos]"}
              <br />
              Numéro de TVA / immatriculation :{" "}
              {c.legal.vatStatus ??
                "[À COMPLÉTER — champ Notion Statut_TVA ; les soins de santé sont en général exonérés de TVA (art. 44 de la loi TVA), à confirmer avec votre comptable]"}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Hébergement</h2>
            <p className="mt-2">
              Ce site est hébergé par Vercel Inc. — adresse et informations légales disponibles sur{" "}
              <a
                href="https://vercel.com/legal"
                target="_blank"
                rel="noopener"
                className="font-semibold text-sage-700 underline underline-offset-4"
              >
                vercel.com/legal
                <span className="sr-only">(nouvel onglet)</span>
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Crédits</h2>
            <p className="mt-2">
              Conception et développement : {c.practitioner.name}. Photographies : droits réservés — [À COMPLÉTER si
              une source externe est utilisée].
            </p>
          </section>
        </div>
        <BackToHome className="mt-12" />
      </div>
    </main>
  );
}
