/**
 * Contrôle de mutations ciblé : casse volontairement une règle critique du code, puis vérifie que la suite
 * de tests concernée ÉCHOUE (mutant « tué »). Un mutant qui survit = un test manquant ou trop faible.
 *
 * Pourquoi pas Stryker : essayé (voir docs/DECISIONS.md) ; avec vitest 5 le runner vitest tue presque
 * rien à tort, et le runner `command` est trop lent (plusieurs minutes par fichier). Ici la liste est
 * courte, écrite à la main, et ne couvre que ce qui protège les règles du site (sécurité, SEO, RDV, 404).
 *
 * Usage : npm run test:mutants [-- filtre]   (le filtre est cherché dans le nom du mutant)
 * Nécessite que les fichiers mutés n'aient aucune modification non commitée (restauration via git).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

type Mutant = { name: string; file: string; find: string; replace: string; tests: string[] };

const JSONLD = "src/lib/seo/json-ld.test.ts";
const UPLOAD = "src/app/api/admin/upload/route.test.ts";
const REVALIDATE = "src/app/api/revalidate/route.test.ts";
const PAGES = "src/app/pages.test.tsx";
const PAIEMENT = "src/app/paiement/page.test.tsx";
const BOOKING = "src/components/booking/booking-link.test.tsx";
const MENU = "src/components/layout/mobile-menu.test.tsx";
const SECTIONS = "src/components/sections/sections.test.tsx";
const LAYOUT = "src/components/layout/layout-components.test.tsx";

const MUTANTS: Mutant[] = [
  // --- JSON-LD (règles 7 et 10) ---
  { name: "json-ld : le cabinet devient Physician", file: "src/lib/seo/json-ld.ts", find: '["MedicalBusiness", "MedicalOrganization"]', replace: '["MedicalBusiness", "Physician"]', tests: [JSONLD] },
  { name: "json-ld : FAQPage même sans FAQ", file: "src/lib/seo/json-ld.ts", find: "if (c.faq.length > 0) {", replace: "if (true) {", tests: [JSONLD] },
  { name: "json-ld : page motif sans reviewedBy", file: "src/lib/seo/json-ld.ts", find: 'reviewedBy: { "@id": ids.person },', replace: "", tests: [JSONLD] },
  { name: "json-ld : URL de RDV du ReserveAction changée", file: "src/lib/seo/json-ld.ts", find: "target: c.booking.url,", replace: 'target: "https://example.test",', tests: [JSONLD] },
  // --- Métadonnées / indexation ---
  { name: "metadata : rappel local ajouté même au-delà de 160 car.", file: "src/lib/seo/metadata.ts", find: "withLocal.length <= 160 ? withLocal : base", replace: "withLocal", tests: ["src/lib/seo/metadata.test.ts"] },
  { name: "robots : indexation inversée", file: "src/app/robots.ts", find: "if (!ALLOW_INDEXING)", replace: "if (ALLOW_INDEXING)", tests: ["src/app/robots.test.ts"] },
  { name: "sitemap : motifs non publiés listés", file: "src/app/sitemap.ts", find: "m.page ? [", replace: "true ? [", tests: ["src/app/sitemap.test.ts"] },
  { name: "layout : canonical défini dans le layout racine (règle 9)", file: "src/app/layout.tsx", find: "    metadataBase: new URL(SITE_URL),", replace: '    metadataBase: new URL(SITE_URL),\n    alternates: { canonical: "/" },', tests: [PAGES] },
  // --- Routes à secret ---
  { name: "revalidate : garde « secret non configuré » retirée", file: "src/app/api/revalidate/route.ts", find: "!process.env.REVALIDATE_SECRET || ", replace: "", tests: [REVALIDATE] },
  { name: "revalidate : comparaison du secret retirée", file: "src/app/api/revalidate/route.ts", find: "secret !== process.env.REVALIDATE_SECRET", replace: "false", tests: [REVALIDATE] },
  { name: "upload : clé non vérifiée", file: "src/app/api/admin/upload/route.ts", find: "key !== process.env.ADMIN_UPLOAD_SECRET", replace: "false", tests: [UPLOAD] },
  { name: "upload : garde « secret non configuré » retirée", file: "src/app/api/admin/upload/route.ts", find: "!process.env.ADMIN_UPLOAD_SECRET || ", replace: "", tests: [UPLOAD] },
  { name: "upload : type de fichier non contrôlé", file: "src/app/api/admin/upload/route.ts", find: "!ALLOWED_TYPES.has(file.type)", replace: "false", tests: [UPLOAD] },
  { name: "upload : taille non contrôlée", file: "src/app/api/admin/upload/route.ts", find: "file.size > MAX_BYTES", replace: "false", tests: [UPLOAD] },
  { name: "upload : fichier public sans suffixe aléatoire", file: "src/app/api/admin/upload/route.ts", find: "addRandomSuffix: true", replace: "addRandomSuffix: false", tests: [UPLOAD] },
  // --- Contenu Notion / repli ---
  { name: "getSiteContent : repli servi en production", file: "src/lib/content/get-site-content.ts", find: 'process.env.VERCEL_ENV === "production"', replace: "false", tests: ["src/lib/content/get-site-content.test.ts"] },
  { name: "getGoogleRating : appel sans clé", file: "src/lib/google/get-google-rating.ts", find: "if (!apiKey || !placeId) return null;", replace: "", tests: ["src/lib/google/get-google-rating.test.ts"] },
  // --- Pages motifs ---
  { name: "[slug] : motif sans page publiée rendu au lieu d'un 404", file: "src/app/[slug]/page.tsx", find: "if (!found) notFound();", replace: "", tests: [PAGES] },
  { name: "[slug] : slugs réservés générés", file: "src/app/[slug]/page.tsx", find: "!RESERVED_SLUGS.has(m.slug)", replace: "true", tests: [PAGES] },
  { name: "[slug] : lien tel: de l'en-tête cassé", file: "src/app/[slug]/page.tsx", find: "{COPY.cta.book}\n            </BookingLink>\n            <a href={`tel:", replace: "{COPY.cta.book}\n            </BookingLink>\n            <a href={`tel-:", tests: [PAGES] },
  // --- Page /paiement ---
  { name: "paiement : encart affiché même vide", file: "src/app/paiement/page.tsx", find: "{page.caution && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : étapes affichées même sans ligne Notion", file: "src/app/paiement/page.tsx", find: "{page.steps && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : sécurité affichée même sans ligne Notion", file: "src/app/paiement/page.tsx", find: "{page.reassurance && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : tarif affiché même vide", file: "src/app/paiement/page.tsx", find: "{consultation.price && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : « autres moyens » affichés même vides", file: "src/app/paiement/page.tsx", find: "{payment.otherMethods && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : canonical supprimé (règle 9)", file: "src/app/paiement/page.tsx", find: 'alternates: { canonical: "/paiement" },', replace: "", tests: [PAIEMENT, PAGES] },
  { name: "paiement : libellé e-mail/numéro inversé", file: "src/app/paiement/page.tsx", find: '{wero.recipient.kind === "email" ? page.labels.email : page.labels.phone}', replace: '{wero.recipient.kind === "email" ? page.labels.phone : page.labels.email}', tests: [PAIEMENT] },
  { name: "paiement : slug retiré des slugs réservés", file: "src/config/site.ts", find: '"opengraph-image", "paiement",', replace: '"opengraph-image",', tests: ["src/config/site.test.ts"] },
  // --- Composants ---
  { name: "BookingLink : Ctrl+clic intercepté", file: "src/components/booking/booking-link.tsx", find: "event.ctrlKey || ", replace: "", tests: [BOOKING] },
  { name: "BookingLink : clic molette intercepté", file: "src/components/booking/booking-link.tsx", find: "event.button !== 0 || ", replace: "", tests: [BOOKING] },
  { name: "BookingLink : pas de repli si l'embed échoue", file: "src/components/booking/booking-link.tsx", find: "window.location.assign(booking.url);", replace: "", tests: [BOOKING] },
  { name: "BookingLink : prestataire générique traité comme Cal.com", file: "src/components/booking/booking-link.tsx", find: 'booking.provider !== "cal"', replace: "false", tests: [BOOKING] },
  { name: "MobileMenu : Échap sans effet", file: "src/components/layout/mobile-menu.tsx", find: 'e.key === "Escape"', replace: 'e.key === "F13"', tests: [MENU] },
  { name: "MobileMenu : focus non rendu au bouton", file: "src/components/layout/mobile-menu.tsx", find: "buttonRef.current?.focus();", replace: "", tests: [MENU] },
  { name: "MobileMenu : clic extérieur sans effet", file: "src/components/layout/mobile-menu.tsx", find: "!rootRef.current.contains(e.target as Node)", replace: "false", tests: [MENU] },
  { name: "Faq : section affichée sans question", file: "src/components/sections/faq.tsx", find: "if (faq.length === 0) return null;", replace: "", tests: [SECTIONS] },
  { name: "SiteImage : alt Notion non injecté", file: "src/components/ui/site-image.tsx", find: "alt={image.alt}", replace: 'alt=""', tests: ["src/components/ui/site-image.test.tsx"] },
  { name: "Footer : mobile affiché sans numéro", file: "src/components/layout/site-footer.tsx", find: "{contact.mobilePhone && (", replace: "{true && (", tests: [LAYOUT] },
  { name: "PracticalInfo : mobile affiché sans numéro", file: "src/components/sections/practical-info.tsx", find: "{contact.mobilePhone && (", replace: "{true && (", tests: [SECTIONS] },
];

const filter = process.argv[2] ?? "";
const selected = MUTANTS.filter((m) => m.name.includes(filter));

const dirty = execFileSync("git", ["status", "--porcelain", "--", ...new Set(selected.map((m) => m.file))], { encoding: "utf8" });
if (dirty.trim()) {
  console.error(`Fichiers à muter modifiés et non commités (la restauration passe par git) :\n${dirty}`);
  process.exit(2);
}

let current: string | null = null;
const restore = () => {
  if (current) execFileSync("git", ["checkout", "--", current]);
  current = null;
};
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => (restore(), process.exit(130)));
process.on("exit", restore);

// La suite doit d'abord passer sans mutation, sinon « tué » ne veut rien dire.
const baseline = spawnSync("npx", ["vitest", "run", "--reporter=dot", ...new Set(selected.flatMap((m) => m.tests))], { encoding: "utf8" });
if (baseline.status !== 0) {
  console.error(`La suite échoue sans mutation :\n${baseline.stdout}\n${baseline.stderr}`);
  process.exit(2);
}

const survivors: string[] = [];
for (const mutant of selected) {
  const source = readFileSync(mutant.file, "utf8");
  const occurrences = source.split(mutant.find).length - 1;
  if (occurrences !== 1) {
    console.error(`✗ ${mutant.name} : extrait trouvé ${occurrences} fois dans ${mutant.file} (attendu : 1)`);
    process.exit(2);
  }
  current = mutant.file;
  writeFileSync(mutant.file, source.replace(mutant.find, () => mutant.replace));
  const run = spawnSync("npx", ["vitest", "run", "--reporter=dot", ...mutant.tests], { encoding: "utf8" });
  restore();
  const killed = run.status !== 0;
  console.log(`${killed ? "✓ tué    " : "✗ SURVIVANT"} ${mutant.name}`);
  if (!killed) survivors.push(mutant.name);
}

console.log(`\n${selected.length - survivors.length}/${selected.length} mutants tués.`);
if (survivors.length > 0) {
  console.error(`Survivants (tests manquants ou trop faibles) :\n- ${survivors.join("\n- ")}`);
  process.exit(1);
}
