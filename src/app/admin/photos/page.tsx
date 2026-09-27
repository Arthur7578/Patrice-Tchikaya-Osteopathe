import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { robots: { index: false, follow: false } };

const SLOTS = [
  { key: "Url_Photo_Hero", label: "Photo hero (portrait, format vertical)" },
  { key: "Url_Photo_Portrait", label: "Portrait de Patrice" },
  { key: "Url_Photo_Cabinet", label: "Photo du cabinet / salle de consultation" },
] as const;

/**
 * Outil temporaire, non listé dans le plan (PLAN §5.1) : upload de photo vers Vercel Blob
 * sans terminal ni code, pour combler l'absence de vraies photos (§18 #3). Protégé par
 * ADMIN_UPLOAD_SECRET. À supprimer (dossier + variable d'environnement) une fois les 3
 * photos définitives collées dans Notion.
 */
export default async function AdminPhotosPage({ searchParams }: PageProps<"/admin/photos">) {
  const { key, uploaded } = await searchParams;
  if (!process.env.ADMIN_UPLOAD_SECRET || key !== process.env.ADMIN_UPLOAD_SECRET) {
    notFound();
  }

  return (
    <main id="contenu">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Upload de photo (outil temporaire)</h1>
        <p className="mt-2 text-slate-600">
          Choisissez un fichier, envoyez-le : vous obtenez une URL publique permanente à coller dans la colonne{" "}
          <strong>URL</strong> de la ligne correspondante, dans la base Notion <em>Medias_Images</em> (jamais dans la
          colonne « Image »).
        </p>

        {typeof uploaded === "string" && (
          <div className="mt-6 rounded-2xl border border-sage-300 bg-sage-50 p-4">
            <p className="font-semibold text-ink">Envoyé ✓ — copiez cette URL dans Notion :</p>
            <input
              readOnly
              value={uploaded}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
        )}

        <form
          action="/api/admin/upload"
          method="post"
          encType="multipart/form-data"
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 p-6"
        >
          <input type="hidden" name="key" value={key} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink">Cette photo correspond à :</span>
            <select name="slot" className="rounded-lg border border-slate-200 px-3 py-2" defaultValue={SLOTS[0].key}>
              {SLOTS.map((slot) => (
                <option key={slot.key} value={slot.key}>
                  {slot.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              Information pour vous seulement : dites-vous « je colle cette URL sur la ligne {"<"}nom choisi{">"} ».
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink">Fichier (JPEG, PNG ou WebP, 8 Mo max)</span>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <button type="submit" className={buttonVariants({ size: "lg" })}>
            Envoyer et obtenir l&apos;URL
          </button>
        </form>
      </div>
    </main>
  );
}
