import type { Metadata } from "next";
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
              E-mail : [À COMPLÉTER : adresse e-mail professionnelle]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Profession réglementée</h2>
            <p className="mt-2">
              L&apos;ostéopathie est une profession de santé réglementée au Grand-Duché de Luxembourg. Son exercice
              est encadré par la loi modifiée du 26 mars 1992 sur l&apos;exercice et la revalorisation de certaines
              professions de santé. {c.practitioner.name} exerce sous autorisation d&apos;exercer délivrée par le
              ministre de la Santé du Luxembourg.
            </p>
            <p className="mt-2">
              Numéro d&apos;autorisation d&apos;exercer : [À COMPLÉTER]
              <br />
              École et année du diplôme : [À COMPLÉTER]
              <br />
              Numéro de TVA / matricule (si applicable) : [À COMPLÉTER]
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
      </div>
    </main>
  );
}
