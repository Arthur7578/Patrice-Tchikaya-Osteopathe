/**
 * Contrôle de mutations ciblé : casse volontairement une règle critique du code, puis vérifie qu'au moins une
 * ASSERTION des tests concernés échoue (mutant « tué »). Un mutant qui survit = un test manquant ou trop faible.
 *
 * Complément de Stryker (`npm run test:mutation`, nocturne) : Stryker génère des milliers de mutations
 * automatiques mais ne bloque pas les PR ; cette liste courte, écrite à la main, protège les règles du site
 * (sécurité, SEO, RDV, 404) et bloque la CI de chaque PR.
 *
 * Classement : « tué » si au moins un test échoue ; « erreur » si les tests n'ont pas pu s'exécuter (mutant
 * qui ne compile pas : à corriger dans cette liste, ce n'est pas une détection) ; « délai » au-delà de 3 min.
 *
 * Usage : npm run test:mutants [-- filtre]   (le filtre est cherché dans le nom du mutant)
 * Nécessite que les fichiers mutés n'aient aucune modification non commitée (restauration via git).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Mutant = { name: string; file: string; find: string; replace: string; tests: string[] };

const JSONLD = "src/lib/seo/json-ld.test.ts";
const UPLOAD = "src/app/api/admin/upload/route.test.ts";
const REVALIDATE = "src/app/api/revalidate/route.test.ts";
const PAGES = "src/app/[locale]/pages.test.tsx";
const PAIEMENT = "src/app/[locale]/paiement/page.test.tsx";
const BOOKING = "src/components/booking/booking-link.test.tsx";
const MENU = "src/components/layout/mobile-menu.test.tsx";
const SECTIONS = "src/components/sections/sections.test.tsx";
const LAYOUT = "src/components/layout/layout-components.test.tsx";
const LAYOUT_ROOT = "src/app/[locale]/layout.test.tsx";
const COOKIES = "src/components/analytics/cookie-consent.test.tsx";
const ROUTING = "src/lib/i18n/routing.test.ts";
const TRANSLATE = "src/lib/i18n/translate.test.ts";
const LOCALIZE = "src/lib/i18n/localize-content.test.ts";
const I18N = "src/config/i18n.test.ts";
const LOCALIZED = "src/components/localized.test.tsx";

const MUTANTS: Mutant[] = [
  // --- JSON-LD (règles 7 et 10) ---
  { name: "json-ld : le cabinet devient Physician", file: "src/lib/seo/json-ld.ts", find: '["MedicalBusiness", "MedicalOrganization"]', replace: '["MedicalBusiness", "Physician"]', tests: [JSONLD] },
  { name: "json-ld : FAQPage même sans FAQ", file: "src/lib/seo/json-ld.ts", find: "if (c.faq.length > 0) {", replace: "if (true) {", tests: [JSONLD] },
  { name: "json-ld : page motif sans reviewedBy", file: "src/lib/seo/json-ld.ts", find: 'reviewedBy: { "@id": ids.person },', replace: "", tests: [JSONLD] },
  { name: "json-ld : URL de RDV du ReserveAction changée", file: "src/lib/seo/json-ld.ts", find: "target: c.booking.url,", replace: 'target: "https://example.test",', tests: [JSONLD] },
  // --- Métadonnées / indexation ---
  { name: "metadata : rappel local ajouté même au-delà de 160 car.", file: "src/lib/seo/metadata.ts", find: "withLocal.length <= 160 ? withLocal : base", replace: "withLocal", tests: ["src/lib/seo/metadata.test.ts"] },
  { name: "robots : indexation inversée", file: "src/app/robots.ts", find: "if (!ALLOW_INDEXING)", replace: "if (ALLOW_INDEXING)", tests: ["src/app/robots.test.ts"] },
  { name: "sitemap : motifs non publiés listés", file: "src/lib/content/published.ts", find: ".filter((entry) => entry.page)", replace: "", tests: ["src/app/sitemap.test.ts"] },
  { name: "layout : canonical défini dans le layout racine (règle 9)", file: "src/app/[locale]/layout.tsx", find: "    metadataBase: new URL(SITE_URL),", replace: '    metadataBase: new URL(SITE_URL),\n    alternates: { canonical: "/" },', tests: [PAGES] },
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
  { name: "[slug] : motif sans page publiée rendu au lieu d'un 404", file: "src/app/[locale]/[slug]/page.tsx", find: "if (!found) notFound();", replace: "", tests: [PAGES] },
  { name: "[slug] : slugs réservés générés", file: "src/app/[locale]/[slug]/page.tsx", find: "!RESERVED_SLUGS.has(m.slug)", replace: "true", tests: [PAGES] },
  { name: "[slug] : lien tel: de l'en-tête cassé", file: "src/app/[locale]/[slug]/page.tsx", find: "{copy.cta.book}\n            </BookingLink>\n            <a href={`tel:", replace: "{copy.cta.book}\n            </BookingLink>\n            <a href={`tel-:", tests: [PAGES] },
  // --- Pages d'information (colonne Type de Motifs_Consultation) ---
  { name: "[slug] : pages d'information absentes de generateStaticParams", file: "src/app/[locale]/[slug]/page.tsx", find: "[...motifs, ...guides].filter", replace: "[...motifs].filter", tests: [PAGES] },
  { name: "[slug] : guide rendu comme un motif (h1 + JSON-LD)", file: "src/app/[locale]/[slug]/page.tsx", find: 'kind: motif ? ("motif" as const)', replace: 'kind: true ? ("motif" as const)', tests: [PAGES] },
  { name: "sitemap : pages d'information non listées", file: "src/lib/content/published.ts", find: "[...content.motifs, ...content.guides]", replace: "[...content.motifs]", tests: ["src/app/sitemap.test.ts"] },
  { name: "[slug] : pages d'information absentes des liens « À lire aussi »", file: "src/lib/content/published.ts", find: "[...content.motifs, ...content.guides]", replace: "[...content.motifs]", tests: [PAGES] },
  { name: "[slug] : page courante listée dans « À lire aussi »", file: "src/app/[locale]/[slug]/page.tsx", find: "(entry) => entry.slug !== motif.slug", replace: "() => true", tests: [PAGES] },
  { name: "Notion : page d'information rangée parmi les motifs", file: "src/lib/notion/fetch-content.ts", find: '(item.kind === "motif" ? motifs : guides).push', replace: "motifs.push", tests: ["src/lib/notion/fetch-content.test.ts"] },
  { name: "Notion : deux pages publiées pour le même slug", file: "src/lib/notion/fetch-content.ts", find: "item.entry.page && takenSlugs.has(item.entry.slug)", replace: "false", tests: ["src/lib/notion/fetch-content.test.ts"] },
  { name: "parsePageKind : valeur vide traitée comme page d'information", file: "src/lib/content/parse.ts", find: 'if (v === "" || v === "motif")', replace: 'if (v === "motif")', tests: ["src/lib/content/parse.test.ts", "src/lib/notion/fetch-content.test.ts"] },
  { name: "/articles : pages non publiées listées", file: "src/lib/content/published.ts", find: ".filter((entry) => entry.page)", replace: "", tests: ["src/app/[locale]/articles/page.test.tsx", PAGES] },
  { name: "/articles : rendue même sans page publiée", file: "src/app/[locale]/articles/page.tsx", find: "if (pages.length === 0) notFound();", replace: "", tests: ["src/app/[locale]/articles/page.test.tsx"] },
  { name: "sitemap : /articles daté de la plus ancienne page", file: "src/app/sitemap.ts", find: "Math.max(...edited", replace: "Math.min(...edited", tests: ["src/app/sitemap.test.ts"] },
  { name: "pied de page : lien /articles affiché sans page publiée", file: "src/components/layout/site-footer.tsx", find: "publishedPages(content).length > 0", replace: "true", tests: [LAYOUT] },
  // --- Cache du contenu Notion ---
  { name: "getSiteContent : cache sans étiquette (revalidate ne purge plus)", file: "src/lib/content/get-site-content.ts", find: "{ revalidate: 60, tags: [SITE_CONTENT_TAG] }", replace: "{ revalidate: 60 }", tests: ["src/lib/content/get-site-content.test.ts"] },
  { name: "/api/revalidate : cache du contenu non purgé", file: "src/app/api/revalidate/route.ts", find: "revalidateTag(SITE_CONTENT_TAG, { expire: 0 });", replace: "", tests: [REVALIDATE] },
  // --- Page /paiement ---
  { name: "paiement : encart affiché même vide", file: "src/app/[locale]/paiement/page.tsx", find: "{page.caution && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : étapes affichées même sans ligne Notion", file: "src/app/[locale]/paiement/page.tsx", find: "{page.steps && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : sécurité affichée même sans ligne Notion", file: "src/app/[locale]/paiement/page.tsx", find: "{page.reassurance && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : tarif affiché même vide", file: "src/app/[locale]/paiement/page.tsx", find: "{consultation.price && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : « autres moyens » affichés même vides", file: "src/app/[locale]/paiement/page.tsx", find: "{payment.otherMethods && (", replace: "{true && (", tests: [PAIEMENT] },
  { name: "paiement : canonical supprimé (règle 9)", file: "src/app/[locale]/paiement/page.tsx", find: 'alternates: localeAlternates(locale, "/paiement"),', replace: "", tests: [PAIEMENT, PAGES] },
  { name: "paiement : libellé e-mail/numéro inversé", file: "src/app/[locale]/paiement/page.tsx", find: '{wero.recipient.kind === "email" ? page.labels.email : page.labels.phone}', replace: '{wero.recipient.kind === "email" ? page.labels.phone : page.labels.email}', tests: [PAIEMENT] },
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
  { name: "PracticalInfo : bloc repliable affiché sans aucune ligne (<dl> vide)", file: "src/components/sections/practical-info.tsx", find: "if (filled.length === 0) return null;", replace: "", tests: [SECTIONS] },
  { name: "PracticalInfo : ancre #acces des liens des guides supprimée", file: "src/components/sections/practical-info.tsx", find: 'label={labels.address} id="acces"', replace: "label={labels.address}", tests: [SECTIONS] },
  { name: "SiteHeader : ancres du menu passées à <Link> (retour en haut de page au 2e clic)", file: "src/components/layout/site-header.tsx", find: "<a href={item.href} className={NAV_LINK}>\n                  {item.label}\n                </a>", replace: "<Link href={item.href} className={NAV_LINK}>\n                  {item.label}\n                </Link>", tests: [LAYOUT] },
  { name: "MobileMenu : ancres du menu passées à <Link> (retour en haut de page au 2e clic)", file: "src/components/layout/mobile-menu.tsx", find: "<a href={item.href} onClick={() => setOpen(false)} className={ITEM_LINK}>\n                {item.label}\n              </a>", replace: "<Link href={item.href} onClick={() => setOpen(false)} className={ITEM_LINK}>\n                {item.label}\n              </Link>", tests: [MENU] },
  // --- Consentement cookies (RGPD) ---
  { name: "cookies : GTM chargé sans consentement", file: "src/components/analytics/cookie-consent.tsx", find: '{consent === "accepted" && (', replace: "{true && (", tests: [COOKIES] },
  { name: "cookies : identifiant GTM non filtré (injection dans le script)", file: "src/components/analytics/cookie-consent.tsx", find: "/^GTM-[A-Z0-9]+$/.test(id)", replace: "true", tests: [COOKIES] },
  // --- Sans JavaScript ---
  { name: "layout : <noscript> des animations retiré", file: "src/app/[locale]/layout.tsx", find: "{`[data-reveal]{opacity:1!important;transform:none!important}`}", replace: '{""}', tests: [LAYOUT_ROOT] },
  { name: "BookingInline : pas de repli si Cal.com est indisponible", file: "src/components/booking/booking-inline.tsx", find: '() => setStatus("failed"),', replace: '() => setStatus("loading"),', tests: ["src/components/booking/booking-inline.test.tsx"] },
  // --- Contenu Notion ---
  { name: "parseList : texte d'attente publié par morceaux (filtrage ligne par ligne)", file: "src/lib/content/parse.ts", find: "if (isPlaceholder(value)) return [];\n  return value!\n    .split(/[\\n;]+/)", replace: "if (!value) return [];\n  return value!\n    .split(/[\\n;]+/)", tests: ["src/lib/content/parse.test.ts"] },
  { name: "téléphone : numéro illisible publié dans les liens tel:", file: "src/lib/notion/fetch-content.ts", find: "phoneE164: isE164(phoneE164) ? phoneE164 : F.contact.phoneE164,", replace: "phoneE164,", tests: ["src/lib/notion/fetch-content.general.test.ts"] },
  { name: "téléphone : préfixe 00 non converti (+00352…)", file: "src/lib/content/parse.ts", find: '.replace(/^00/, "+")', replace: "", tests: ["src/lib/content/parse.test.ts"] },
  { name: "horaires : un jour fermé rend tous les horaires illisibles (JSON-LD sans horaires)", file: "src/lib/content/parse.ts", find: "    if (isClosedDayLine(line)) continue;\n", replace: "", tests: ["src/lib/notion/fetch-content.general.test.ts"] },
  { name: "FAQ : question publiée avec une variable inconnue ou sans valeur (« {tarif} » affiché)", file: "src/lib/content/variables.ts", find: "return complete ? filled : null;", replace: "return filled;", tests: ["src/lib/content/variables.test.ts", "src/lib/notion/fetch-content.general.test.ts"] },
  { name: "safeHref : domaine Notion nu accepté comme lien", file: "src/lib/notion/blocks.ts", find: "/(^|\\.)notion\\.(so|site|com)$/", replace: "/\\.notion\\.(so|site|com)$/", tests: ["src/lib/notion/blocks.test.ts"] },
  // --- Règle 2 (textes en dur) ---
  { name: "règle 2 : libellé écrit en dur dans un composant", file: "src/components/layout/site-footer.tsx", find: "{copy.footer.links}", replace: "Liens", tests: ["src/test/architecture.test.ts"] },
  { name: "règle 2 : texte en dur dans une branche conditionnelle", file: "src/components/sections/reviews.tsx", find: "copy.reviews.ratingCount(rating.count)", replace: "`${rating.count} avis`", tests: ["src/test/architecture.test.ts"] },
  // --- Server Components ---
  { name: "admin : gestionnaire d'événement dans un Server Component (erreur 500)", file: "src/app/(admin)/admin/photos/page.tsx", find: 'aria-label="URL publique de la photo"', replace: 'aria-label="URL publique de la photo"\n              onFocus={() => undefined}', tests: ["src/test/architecture.test.ts"] },
  // --- Langues (routage, traduction automatique, SEO multilingue) ---
  { name: "langues : robots redirigés selon la langue (Googlebot n'indexerait que l'anglais)", file: "src/lib/i18n/routing.ts", find: "entering && !BOT.test(ua))", replace: "entering)", tests: [ROUTING] },
  { name: "langues : redirection en navigation interne (impossible de revenir au français)", file: "src/lib/i18n/routing.ts", find: "const entering = !isSameOrigin(req);", replace: "const entering = true;", tests: [ROUTING] },
  { name: "langues : /fr/… servi au lieu d'être redirigé (deux URL par page)", file: "src/lib/i18n/routing.ts", find: 'return { type: "redirect", location: `${rest}${search}`, status: 308 };', replace: 'return { type: "next" };', tests: [ROUTING] },
  { name: "langues : langue non publiée servie (français sous /en)", file: "src/lib/i18n/routing.ts", find: "if (!enabled.includes(locale)) return", replace: "if (false) return", tests: [ROUTING] },
  { name: "langues : cookie d'une langue non publiée suivi", file: "src/lib/i18n/routing.ts", find: "isLocale(req.cookie) && enabled.includes(req.cookie)", replace: "isLocale(req.cookie)", tests: [ROUTING] },
  { name: "langues : mode identity permis en production (faux anglais publié)", file: "src/config/i18n.ts", find: ' && env.VERCEL_ENV !== "production"', replace: "", tests: [I18N] },
  { name: "langues : hreflang sans x-default", file: "src/config/i18n.ts", find: 'languages["x-default"] = localePath(DEFAULT_LOCALE, path);', replace: "", tests: [I18N] },
  { name: "langues : traduction qui présente l'ostéopathe comme médecin acceptée (règle 10)", file: "src/lib/i18n/translate.ts", find: "if (countDoctorMentions(value) > countDoctorMentions(text))", replace: "if (false)", tests: [TRANSLATE] },
  { name: "langues : « Dr Tchikaya » accepté dans une traduction (règle 10)", file: "src/lib/i18n/translate.ts", find: "if (hasTitleBeforeName(value, names))", replace: "if (false)", tests: [TRANSLATE] },
  { name: "langues : adjectif « médico » compté comme un médecin (traduction bloquée)", file: "src/lib/i18n/rules.ts", find: "|(?<=(?<!\\\\p{L})(?:${PT_DETERMINERS})\\\\s+)médic[oa]s?", replace: "|médic[oa]s?", tests: ["src/lib/i18n/rules.test.ts"] },
  { name: "langues : traduction acceptée avec des balises perdues", file: "src/lib/i18n/translate.ts", find: "if (tagsOf(value).join() !== tagsOf(text).join())", replace: "if (false)", tests: [TRANSLATE] },
  { name: "langues : refus de traduction ignoré", file: "src/lib/i18n/translate.ts", find: 'if (message.stop_reason === "refusal") throw', replace: 'if (false) throw', tests: [TRANSLATE] },
  { name: "langues : avis traduit sans la mention « traduit »", file: "src/lib/i18n/localize-content.ts", find: "{ ...r, text, translated: true as const }", replace: "{ ...r, text }", tests: [LOCALIZE] },
  { name: "langues : mention « traduit » absente de l'avis affiché", file: "src/components/sections/reviews.tsx", find: "{review.translated && <> · {copy.reviews.translated}</>}", replace: "", tests: [LOCALIZED] },
  { name: "langues : lien Doctena laissé dans la langue de Notion", file: "src/lib/i18n/localize-content.ts", find: "  parts[1] = lang;", replace: "", tests: [LOCALIZE] },
  { name: "langues : luxembourgeois envoyé vers une page Doctena inexistante", file: "src/config/i18n.ts", find: 'englishName: "Luxembourgish", bookingLang: "fr"', replace: 'englishName: "Luxembourgish", bookingLang: "lb"', tests: [LOCALIZE] },
  { name: "langues : liens internes du corps des pages restés en français", file: "src/lib/i18n/localize-content.ts", find: 'href: localePath(locale, t.href)', replace: "href: t.href", tests: [LOCALIZE] },
  { name: "langues : langue non publiée servie avec le texte français", file: "src/lib/content/get-site-content.ts", find: "if (!ENABLED_LOCALES.includes(locale)) throw", replace: "if (false) throw", tests: ["src/lib/content/get-site-content.test.ts"] },
  { name: "langues : lien des mentions légales resté en français", file: "src/components/layout/site-footer.tsx", find: '<Link href={localePath(locale, "/mentions-legales")}', replace: '<Link href="/mentions-legales"', tests: [LOCALIZED] },
  { name: "langues : pages juridiques sans la mention « la version française fait foi »", file: "src/app/[locale]/mentions-legales/page.tsx", find: "{t.translationNote && <p", replace: "{false && <p", tests: [PAGES] },
  { name: "langues : <html lang> figé en français", file: "src/app/[locale]/layout.tsx", find: "<html lang={LOCALE_META[c.locale].htmlLang}", replace: '<html lang="fr-LU"', tests: [LAYOUT_ROOT] },
  { name: "langues : slug « en » accepté (masqué par la langue)", file: "src/config/site.ts", find: "  ...LOCALES, // préfixes de langue", replace: "  // préfixes de langue", tests: ["src/config/site.test.ts"] },
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

type Outcome = "passed" | "failed" | "error" | "timeout";

/** Lance vitest (rapport JSON) : « failed » seulement si au moins une assertion échoue. */
function runTests(tests: string[]): { outcome: Outcome; detail: string } {
  const dir = mkdtempSync(join(tmpdir(), "mutants-"));
  const report = join(dir, "vitest.json");
  try {
    const run = spawnSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${report}`, ...tests], {
      stdio: "ignore",
      timeout: 180_000,
    });
    if (run.signal || run.error) return { outcome: "timeout", detail: String(run.error ?? run.signal) };
    const result = JSON.parse(readFileSync(report, "utf8")) as {
      numFailedTests: number;
      numFailedTestSuites: number;
      testResults: Array<{ name: string; message?: string }>;
    };
    if (result.numFailedTests > 0) return { outcome: "failed", detail: `${result.numFailedTests} test(s) en échec` };
    if (result.numFailedTestSuites > 0) {
      const messages = result.testResults.filter((r) => r.message).map((r) => `${r.name} : ${r.message!.split("\n")[0]}`);
      return { outcome: "error", detail: messages.join(" ; ") };
    }
    return { outcome: "passed", detail: "" };
  } catch (error) {
    return { outcome: "error", detail: `rapport vitest illisible (${String(error)})` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// La suite doit d'abord passer sans mutation, sinon « tué » ne veut rien dire.
const baseline = runTests([...new Set(selected.flatMap((m) => m.tests))]);
if (baseline.outcome !== "passed") {
  console.error(`La suite échoue sans mutation (${baseline.outcome}) : ${baseline.detail}\nRelancer : npx vitest run`);
  process.exit(2);
}

const survivors: string[] = [];
const invalid: string[] = [];
for (const mutant of selected) {
  const source = readFileSync(mutant.file, "utf8");
  const occurrences = source.split(mutant.find).length - 1;
  if (occurrences !== 1) {
    console.error(`✗ ${mutant.name} : extrait trouvé ${occurrences} fois dans ${mutant.file} (attendu : 1)`);
    process.exit(2);
  }
  current = mutant.file;
  writeFileSync(mutant.file, source.replace(mutant.find, () => mutant.replace));
  const { outcome, detail } = runTests(mutant.tests);
  restore();
  if (outcome === "failed") console.log(`✓ tué      ${mutant.name}`);
  else if (outcome === "passed") {
    console.log(`✗ SURVIVANT ${mutant.name}`);
    survivors.push(mutant.name);
  } else {
    console.log(`! ${outcome === "timeout" ? "DÉLAI" : "ERREUR"}    ${mutant.name} : ${detail}`);
    invalid.push(mutant.name);
  }
}

const killed = selected.length - survivors.length - invalid.length;
console.log(`\n${killed}/${selected.length} mutants tués.`);
if (invalid.length > 0) {
  console.error(`Mutants invalides (les tests n'ont pas pu s'exécuter : corriger la mutation) :\n- ${invalid.join("\n- ")}`);
}
if (survivors.length > 0) {
  console.error(`Survivants (tests manquants ou trop faibles) :\n- ${survivors.join("\n- ")}`);
}
if (invalid.length > 0 || survivors.length > 0) process.exit(1);
