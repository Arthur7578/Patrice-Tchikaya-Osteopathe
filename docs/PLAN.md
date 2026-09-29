# Plan de développement — Site de Patrice Tchikaya, Ostéopathe D.O. à Dudelange

> **Destinataires :** l'agent de code (Claude Sonnet) qui implémente, et Arthur pour relecture.
> **Statut :** prêt à implémenter — rédigé le 27/09/2026. Versions vérifiées sur npm ce jour-là.
> **Source de vérité :** ce document. S'il est muet sur un point, choisir l'option la plus simple qui respecte
> les règles non négociables (§2.3), puis la consigner dans `docs/DECISIONS.md`.

---

## 0. Mode d'emploi pour l'agent

1. Lire `CLAUDE.md` puis ce plan en entier une fois. Ensuite, avant chaque phase, relire la section concernée.
2. Implémenter **phase par phase** (§14). Ne pas anticiper la phase 9 (pages motifs).
3. Le code de la §6 a été **validé** dans un prototype jetable (Next.js 16.3.6 : `tsc` ✓, ESLint ✓, `next build` ✓,
   7 tests unitaires ✓, Lighthouse ✓, comportements vérifiés dans Chromium 141). Le recopier tel quel, puis l'adapter
   uniquement si nécessaire (et noter pourquoi dans `docs/DECISIONS.md`).
4. Les sections de la page (§8) sont **spécifiées**, pas codées : c'est ton travail.
5. Avant d'utiliser une API Next.js, lire la doc embarquée `node_modules/next/dist/docs/` (Next 16 diffère de tes
   données d'entraînement ; voir aussi `AGENTS.md` généré par create-next-app).
6. À la fin de chaque phase : `npm run lint && npm run typecheck && npm test && npm run build` doivent être verts,
   puis commit (un commit par phase minimum, messages conventionnels : `feat:`, `fix:`, `chore:`, `docs:`).

**Limites de l'environnement cloud actuel (vérifiées) :** `api.notion.com`, `cal.eu`, `app.cal.eu`, `app.cal.com`,
`ui.shadcn.com`, `schema.org` et `developers.google.com` sont bloqués par la politique réseau. Conséquences :
le build tourne avec le contenu de secours (`fallback.ts`), la CLI shadcn est inutilisable, et Notion/Cal.com se
testent sur une **preview Vercel** (ou après autorisation de ces domaines dans les réglages réseau de l'environnement).
`registry.npmjs.org` et Google Fonts sont accessibles.

---

## 1. Résumé

- **Produit :** landing page (one-page) SEO local + conversion pour un ostéopathe à Dudelange (Luxembourg),
  prise de RDV via Cal.com (compte **UE** : `cal.eu`), contenu éditable dans Notion.
- **Stack :** Next.js 16.3.6 (App Router, Turbopack) · React 19.2 · TypeScript 5.9 · Tailwind CSS 4.3 ·
  Notion SDK 5.26 (API `2025-09-03`, « data sources ») · `@calcom/embed-react` 1.5.3 · Motion 13 · Lucide 1.48.
- **Rendu :** 100 % statique + ISR (régénération ≤ 1 h) + route `/api/revalidate` pour publier immédiatement.
- **Sections :** header sticky · hero · à propos (E-E-A-T) · motifs (4 cartes) · avis · FAQ · infos pratiques +
  agenda inline · footer · barre d'action mobile. Pages : mentions légales, confidentialité, 404.
- **SEO :** métadonnées par page, JSON-LD (WebSite + MedicalBusiness + Person + WebPage + FAQPage), sitemap,
  robots, image OG générée, NAP identique à la fiche Google, pas d'indexation des previews.
- **Performance mesurée sur le prototype** (Lighthouse 13.5, `next start` local) : mobile 96–99 (médiane 98),
  desktop 100 ; Accessibilité / Bonnes pratiques / SEO : 100 / 100 / 100.
- **Avant la mise en ligne, il manque des données** (tarif, photos, domaine, GPS, mentions légales…) : voir §18.

---

## 2. Décisions

### 2.1 Écarts assumés par rapport au brief (avec justification vérifiée)

| # | Brief | Ce plan | Pourquoi |
|---|---|---|---|
| 1 | `<Image priority>` sur la photo hero | `<Image preload>` | `priority` est **déprécié depuis Next 16** au profit de `preload` (doc embarquée `03-api-reference/02-components/image.md`). |
| 2 | JSON-LD `"@type": "Physician"`, `"medicalSpecialty": "Osteopathic"` | `["MedicalBusiness", "MedicalOrganization"]` + `medicalSpecialty: Musculoskeletal` + nœud `Person` (`jobTitle: "Ostéopathe D.O."`) | (a) `Osteopathic` **n'existe pas** dans l'énumération `MedicalSpecialty` : c'est une valeur de `MedicineSystem` (vérifié dans `schema-dts` 2.0.0, généré depuis schema.org). (b) schema.org définit `Physician` comme « un médecin ou un cabinet de médecin » ; au Luxembourg, l'ostéopathe est une profession de santé réglementée distincte de la médecine. Déclarer « médecin » dans des données lisibles par les machines est inexact et risqué (titre protégé). `MedicalBusiness` reste un sous-type de `LocalBusiness` (SEO local identique). |
| 3 | URLs `"[https://schema.org](https://schema.org)"` dans le JSON-LD | `"https://schema.org"` | Artefacts de copier-coller Markdown : JSON-LD invalide sinon. |
| 4 | FAQ en Radix/shadcn Accordion | `<details name="faq">` natif, stylé comme shadcn, animé en CSS | Radix Collapsible (v1.1.20, utilisé par Accordion) **ne rend pas le contenu fermé** (`children: isOpen && children`, vérifié dans le code source) → les réponses fermées sont absentes du HTML. Le natif garde toutes les réponses dans le HTML (indexables), coûte 0 Ko de JS, est accessible au clavier. Vérifié dans Chromium : ouverture exclusive, contenu fermé présent dans le DOM. |
| 5 | Framer Motion | Paquet `motion` (même bibliothèque, renommée ; `framer-motion` est publié en miroir, même version 13.4.4) | Import `motion/react`. Chargé via `LazyMotion` asynchrone, seulement sous la ligne de flottaison. Mesuré : +34 Ko de JS transféré, sans effet mesurable sur le score (98–99). |
| 6 | Composants shadcn/ui | Style et conventions shadcn, **écrits à la main** (Button via `cva` + `@radix-ui/react-slot`) | La CLI shadcn a besoin de `ui.shadcn.com` (bloqué ici) et la v4 installe Base UI par défaut. On n'a besoin que de 1 ou 2 primitives. |
| 7 | Note 5/5 affichée | Affichage visuel uniquement, **sans** `AggregateRating`/`Review` en JSON-LD | Google n'affiche pas d'étoiles pour des avis qu'une entreprise publie sur son propre site à propos d'elle-même (LocalBusiness/Organization, règle « self-serving » en vigueur depuis 2019). Aucun gain, risque inutile. |
| 8 | FAQPage JSON-LD | Conservé, **sans attente de résultat enrichi** | Plusieurs sources SEO indiquent que Google a retiré les résultats enrichis FAQ (notice de dépréciation datée du 7 mai 2026). Je n'ai pas pu ouvrir la page Google depuis cet environnement. Le balisage reste valide et lisible par les moteurs et les IA. |
| 9 | Emoji « 📍 » et « ⭐ » | Icônes Lucide `MapPin` / `Star` | Rendu identique sur tous les systèmes, contrôle des couleurs, `aria-hidden`. |
| 10 | JSON-LD « dans le `<head>` » | Graphe global dans le `<head>` du layout racine ; graphe de page (WebPage + FAQPage) dans la page | Recommandation Next.js ; Google lit le JSON-LD où qu'il soit dans le HTML servi. |
| 11 | Avis : nom du patient | « Prénom + initiale » (« Yves S. ») | Minimisation RGPD : être patient d'un ostéopathe est une donnée de santé. |
| 12 | Tarif affiché | Masqué tant que Notion contient le placeholder `[Mettre le tarif ex: 90 €]` | Ne jamais publier un placeholder. |

### 2.2 Hypothèses (à confirmer, voir §18)

- Domaine `osteopathe-tchikaya.lu` : il **ne résout pas en DNS** au 27/09/2026 (non acheté ou non configuré).
- Hébergement Vercel : aucun projet pour ce site n'existe encore dans l'équipe Vercel connectée.
- Coordonnées GPS du brief (49.4808, 6.0841) : **non vérifiées** (géocodage impossible depuis cet environnement).

### 2.3 Règles non négociables

1. **Server Components par défaut.** `"use client"` uniquement pour : `BookingLink`, `BookingInline`,
   `MobileActionBar`, `MobileMenu`, `Reveal`.
2. **Aucun contenu éditorial en dur**, hors `src/lib/content/fallback.ts` (instantané Notion pour le dev) et
   `src/content/ui-copy.ts` (micro-copie d'interface : titres de section, libellés de boutons).
3. **Images Notion :** uniquement la colonne `URL` (jamais les fichiers téléversés dans Notion : URL S3 temporaire
   d'environ 1 h). Toujours l'`alt` Notion (`Alt_description`) injecté dans `<Image alt>`. Jamais d'image cassée :
   placeholder si pas d'URL.
4. **Aucune animation sur le hero / l'élément LCP.** `prefers-reduced-motion` respecté partout.
5. **Aucun script tiers au chargement initial** (pas de GA/GTM/Pixel, pas d'iframe Google Maps). Cal.com se charge
   sur intention (survol/focus/toucher/clic) ou à l'approche de la section agenda.
6. **Chaque CTA de RDV est un vrai `<a href="https://cal.eu/…">`** : il fonctionne sans JS et sert de repli.
7. **Pas de `Physician`, pas d'`AggregateRating`/`Review`** en JSON-LD.
8. **Un seul `<h1>` par page.**
9. **`alternates.canonical` est défini page par page**, jamais dans le layout racine (sinon toutes les pages
   hériteraient du canonical `/`).
10. Les 4 commandes de contrôle (§0.6) vertes avant chaque commit.

---

## 3. Stack & versions (vérifiées sur npm le 27/09/2026)

| Paquet | Version | Rôle / remarque |
|---|---|---|
| `next` | **16.3.6** (latest) | App Router, Turbopack par défaut. Node ≥ 20.9. |
| `react`, `react-dom` | **19.2.8** | Versions installées par `create-next-app@16.3.6` : ne pas monter en 19.3. |
| `typescript` | **^5** (5.9.3) | **Ne pas passer à TypeScript 7.x** (latest npm = 7.0.2, portage natif) : compatibilité Next 16 non vérifiée. |
| `tailwindcss`, `@tailwindcss/postcss` | **^4** (4.3.3) | Config CSS-first (`@theme` dans `globals.css`), pas de `tailwind.config.js`. |
| `eslint`, `eslint-config-next` | ^9 / 16.3.6 | Config « flat » générée. `next lint` n'existe plus : `npm run lint` = `eslint`. |
| `@types/node` | **^22** | Remplacer le `^20` généré : `vitest@5` exige `@types/node` ^22 (conflit de peer sinon). |
| `@notionhq/client` | **5.26.0** | API `2025-09-03` : `dataSources.query` (il n'y a plus de `databases.query`). |
| `@calcom/embed-react` | **1.5.3** | Compatible React 19. Composant `Cal` (inline) + `getCalApi` (popup). |
| `motion` | **13.4.4** | Ex-Framer Motion. Imports `motion/react` et `motion/react-m`. |
| `lucide-react` | **1.48.0** | Icônes (toutes celles citées ici existent, vérifié). |
| `@radix-ui/react-slot` | 1.3.3 | Pour `Button asChild` (convention shadcn). |
| `class-variance-authority` · `clsx` · `tailwind-merge` | 0.7.1 · 2.1.1 · 3.7.0 | Utilitaires shadcn (`cn`, variantes). |
| `server-only` | 0.0.1 | Empêche l'import du token Notion côté client. |
| **dev** `schema-dts` | 2.0.0 | Typage JSON-LD (types uniquement → devDependency). |
| **dev** `vitest` | 5.0.2 | Tests unitaires (Node ≥ 22.12). |
| **dev** `tsx` | 4.23.15 | Scripts `notion:check` et `seo:smoke`. |
| **dev** `node-html-parser` | 9.0.4 | Utilisé par `seo:smoke`. |
| (option phase 8) `@vercel/analytics`, `@vercel/speed-insights` | 2.0.1 / 2.0.0 | Sans cookies. À n'activer qu'après activation dans le dashboard Vercel (sinon 404 + erreur console). |

**Ne pas installer :** `radix-ui` (méta-paquet qui tire toutes les primitives), `@radix-ui/react-accordion`,
`framer-motion` (doublon), `@fontsource/*` (`next/font` suffit), `date-fns`/`dayjs` (`Intl` suffit), `lodash`,
GA/GTM, `react-markdown`.

---

## 4. Contenu Notion : état réel et mapping

### 4.1 Emplacement et schéma (lu via le connecteur Notion le 27/09/2026)

Page « **Site web Ostéopathie Dudelange** » → sous-page « **Data utilisée pour le siteweb** » → 6 bases :

| Base | ID de la base (dans l'URL) | Propriétés (nom exact → type) | Forme |
|---|---|---|---|
| Informations_generales | `3e84bf3fc728807289c3d8fd65392419` | `Variable` (title), `Valeur` (text) | clé/valeur |
| Medias_Images | `3e84bf3fc728802d8c71e4430540f4a6` | `Variable` (title), `URL` (url), `Alt_description` (text), `Image` (files → **ignoré**) | clé/valeur |
| Section A_Propos | `3e84bf3fc72880b697fde52ac9061d49` | `Variable` (title), `Valeur` (text) | clé/valeur |
| Motifs_Consultation | `3e84bf3fc72880f89f2cf61ae9b23382` | `Motif` (title), `slug URL` (text), `Description_Courte` (text), `Icone_Lucide` (text) | liste |
| Avis_Patients | `3e84bf3fc7288023beb4d2739a387a17` | `Nom_Patient` (title), `Note` (text, ex. « 5 / 5 »), `Avis_Texte` (text), `Date` (date) | liste |
| FAQ_SEO | `3e84bf3fc7288062883dc5d447128b28` | `Name` (title), `Reponse` (text) | liste |

**Septième base (29/09/2026) :** `Page_Paiement` (`Name` title, `Type` select, `Texte` text, `Ordre` number) — textes de la page `/paiement` ; ID dans `NOTION_DATABASES.payment` (voir `docs/DECISIONS.md`).

Le code ne stocke que les **IDs de base** (certains) et résout la « data source » via `databases.retrieve`.
Pour information, IDs de data source vus par le connecteur (non utilisés par le code) : general
`3e84bf3f-c728-8068-bc91-000b207fab12`, images `…-8086-8378-000bb12c49ee`, about `…-80e8-a9df-000b9df439c0`,
motifs `…-8075-adca-000bc8c6c371`, reviews `…-80a4-a5de-000bcf52090a`, faq `…-80cc-8d76-000b421015d6`.

### 4.2 Clés existantes → champs du code

**Informations_generales**

| Variable | Valeur actuelle | Champ `SiteContent` | Obligatoire | Traitement |
|---|---|---|---|---|
| `Nom_Praticien` | Patrice Tchikaya | `practitioner.name` | oui | — |
| `Metier_Titre` | Ostéopathe D.O. | `practitioner.title` | oui | — |
| `Titre_SEO_H1` | Ostéopathe à Dudelange – Patrice Tchikaya | `seo.h1` | oui | texte du `<h1>` |
| `Sous_Titre_Hero` | Prise en charge globale des douleurs… | `seo.heroSubtitle` | oui | — |
| `Adresse_Rue` | 46 Avenue Grande-Duchesse Charlotte | `contact.street` | oui | — |
| `Code_Postal_Ville` | 3440 Dudelange, Luxembourg | `contact.postalCode` / `locality` / `countryName` | oui | analysé (`parsePostalLine`) |
| `Telephone_Display` | +352 51 92 92 | `contact.phoneDisplay` | oui | affichage |
| `Telephone_RAW` | +352519292 | `contact.phoneE164` | oui | normalisé (`toE164`) → `tel:` |
| `Url_CalCom` | https://cal.eu/patrice-tchikaya-pro/consultation (lien) | `booking.url` / `calLink` / `calOrigin` | oui | `parseCalUrl` → origine `https://app.cal.eu` |
| `Url_Google_My_Business` | https://g.page/r/CY0QxWkj7WfJEBM | `googleBusinessUrl`, `sameAs` | non | lien « tous les avis » ; `/review` pour « laisser un avis » |
| `Duree_Consultation` | 45 minutes | `consultation.durationLabel` / `durationMinutes` | oui | — |
| `Tarif_Consultation` | **« [Mettre le tarif ex: 90 €] » (placeholder)** | `consultation.price` | non | placeholder → `null` → ligne masquée |
| `Info_Remboursement` | Consultations prises en charge par les mutuelles… | `consultation.reimbursement` | oui | — |

**Section A_Propos** : `Titre` → `about.title` ; `Bio_Courte` → `about.shortBio` ; `Bio_Detaillee` → `about.longBio`.

**Medias_Images — correspondance image ↔ alt demandée dans le brief :**

| Image (brief) | Alt (brief) | Où c'est dans Notion | Champ code | Rendu |
|---|---|---|---|---|
| `Url_Photo_Hero` | `Alt_Photo_Hero` | ligne `Url_Photo_Hero` → colonnes `URL` + `Alt_description` | `images.hero.{src,alt}` | `<Image alt={images.hero.alt} preload …>` |
| `Url_Photo_Portrait` | `Alt_Photo_Portrait` | ligne `Url_Photo_Portrait` → `URL` + `Alt_description` | `images.portrait.{src,alt}` | section À propos |
| `Url_Photo_Cabinet` | `Alt_Photo_Cabinet` | ligne `Url_Photo_Cabinet` → `URL` + `Alt_description` | `images.cabinet.{src,alt}` | section Infos pratiques |

Il n'existe pas de lignes séparées `Alt_Photo_*` : l'alt est dans la même ligne que l'image. Le composant
`SiteImage` (§6.14) injecte toujours `image.alt` ; si l'alt Notion est vide, un alt de secours explicite est utilisé
et un avertissement est journalisé.

État actuel : les 3 lignes ont un `Alt_description` correct mais **aucune URL**. Le portrait a été **téléversé
comme fichier** dans la colonne `Image` (`Patrice_Tchikaya_Osteopathe.jpeg`) : il sera ignoré (règle 3) tant que son
URL publique n'est pas collée dans la colonne `URL`.

**Motifs_Consultation (4 lignes)** : Ostéopathie du Sport (`Activity`, `osteopathie-du-sport-dudelange`) ·
Posture & Vie Pro (TMS) (`Briefcase`, `tms-ergonomie-bureau`) · Traumatologie & Douleurs (`Zap`,
`traitement-lumbago-sciatique-dudelange`) · Bilan Préventif (`ShieldCheck`, `bilan-osteopathique-annuel`).
Notion fait foi (le brief disait « Traumatologie & Aigu »).

**Avis_Patients (3 lignes, toutes « 5 / 5 »)** : Yves Schweicher (21/09/2026), Jeff Dax (13/09/2026),
Michelle You (05/07/2026 — texte terminé par « (translated) »).

**FAQ_SEO (3 lignes)** : déroulé d'une séance · remboursement au Luxembourg · ordonnance.

### 4.3 Anomalies à corriger dans Notion (action humaine)

1. `Tarif_Consultation` : remplacer le placeholder par le vrai tarif (ex. « 90 € »).
2. Photos : héberger chaque image (Vercel Blob, Cloudinary ou Unsplash) et coller l'URL publique **https** dans la
   colonne `URL` (le fichier déjà téléversé dans `Image` ne sera pas utilisé).
3. Avis de Michelle You : décider de retirer ou non le suffixe « (translated) » (traduction automatique Google).
4. `Info_Remboursement` / FAQ remboursement : nuancer si nécessaire. D'après switchr.lu, la CNS ne rembourse pas
   l'ostéopathie ; seules des assurances complémentaires (CMCM, DKV, Foyer, AXA…) la prennent en charge
   partiellement, selon le contrat. **À faire confirmer par Patrice.**

### 4.4 Champs optionnels recommandés (le code les gère déjà ; absents = masqués)

| Base | Nouvelle entrée | Exemple | Effet |
|---|---|---|---|
| Informations_generales | `Note_Google` | `5,0` | badge hero + résumé avis (sinon badge sans note) |
| Informations_generales | `Nombre_Avis_Google` | `12` | « (12 avis) » |
| Informations_generales | `Horaires` | `Mo-Fr 08:00-19:00; Sa 08:00-12:00` (format imposé) | infos pratiques, footer, JSON-LD `openingHoursSpecification` |
| Informations_generales | `Meta_Title` / `Meta_Description` | — | surcharge du `<title>` / de la meta description |
| Informations_generales | `Acces_Info` | « Parking gratuit à 50 m, bus ligne … » | ligne « Accès » |
| Informations_generales | `Langues_Parlees` | `Français, Anglais` | ligne « Langues » + JSON-LD `knowsLanguage` |
| Informations_generales | `Url_Profil_LinkedIn` (et tout `Url_Profil_*`) | URL | JSON-LD `sameAs` |
| Section A_Propos | `Formation` | « Diplômé de … (année) » | ligne E-E-A-T sous la bio |
| Section A_Propos | `Expertise_1_Titre` / `Expertise_1_Texte` … jusqu'à 4 | — | remplace les 3 cartes par défaut (textes du brief) |
| Motifs, FAQ | colonne `Ordre` (Number) | 1, 2, 3… | ordre d'affichage (sinon date de création) |
| Motifs, FAQ, Avis | colonne `Publié` (Checkbox) | — | décoché = masqué (absente = tout est publié) |

### 4.5 Règles de lecture (implémentées dans le code de référence §6)

- Texte enrichi → concaténation des `plain_text`, `trim`.
- URL : `href` du premier lien s'il existe, sinon texte brut ; validée par `new URL()`.
- Placeholder (vide, `[…]`, « Mettre le… », « à compléter », « TODO ») → valeur absente.
- Champ **obligatoire** absent → valeur de secours + avertissement ; champ **optionnel** absent → `null` → masqué.
- Ordre : `Ordre` croissant, sinon date de création croissante. Avis : date décroissante.
- Images : colonne `URL` uniquement, hôte obligatoirement dans la liste blanche (`src/config/images.ts`), sinon
  placeholder + avertissement (une URL hors liste ferait planter `next/image`).
- Icônes : liste blanche `MOTIF_ICONS` ; nom inconnu → `Sparkles` + avertissement.
- Erreur de l'API Notion → **exception** (en ISR, Next garde la dernière page valide ; au build, l'échec est visible).
  Pas de NOTION_TOKEN → instantané (`fallback.ts`), **interdit en production** Vercel.

### 4.6 Mise en place de l'intégration Notion (action humaine)

1. https://www.notion.so/profile/integrations → « Nouvelle intégration » interne, nom « Site Tchikaya »,
   capacités : **lire le contenu uniquement**.
2. Copier le secret → variable `NOTION_TOKEN` (Vercel : Production + Preview ; en local : `.env.local`).
3. Ouvrir la page « Site web Ostéopathie Dudelange » → `•••` → Connexions → ajouter l'intégration
   (les 6 bases héritent de l'accès).
4. En local : `npm run notion:check` doit afficher ✓ et la liste des avertissements.

### 4.7 Publier une modification Notion

- Automatique : au plus 1 h après la modification (ISR).
- Immédiat : ouvrir `https://<domaine>/api/revalidate?secret=<REVALIDATE_SECRET>` (à mettre en favori), puis
  recharger le site. Optionnel : si le plan Notion propose l'action « Envoyer un webhook » dans les automatisations
  de base, la pointer vers cette même URL.

---

## 5. Architecture

### 5.1 Arborescence cible

```
.
├── AGENTS.md                     # généré par create-next-app (règles Next.js pour agents)
├── CLAUDE.md                     # règles du projet (importe AGENTS.md)
├── docs/PLAN.md                  # ce document
├── docs/DECISIONS.md             # journal des décisions prises pendant l'implémentation
├── .env.example
├── next.config.ts
├── vitest.config.ts
├── scripts/
│   ├── notion-check.ts           # diagnostic Notion  → npm run notion:check
│   └── seo-smoke.ts              # contrôles SEO sur le HTML servi → npm run seo:smoke
└── src/
    ├── app/
    │   ├── layout.tsx            # <html lang>, police, metadata par défaut, JSON-LD global, barre mobile
    │   ├── page.tsx              # landing : composition des sections + metadata + JSON-LD de page
    │   ├── globals.css           # Tailwind v4 + tokens + CSS de la FAQ
    │   ├── not-found.tsx
    │   ├── icon.svg · apple-icon.tsx · opengraph-image.tsx · manifest.ts
    │   ├── robots.ts · sitemap.ts
    │   ├── mentions-legales/page.tsx
    │   ├── confidentialite/page.tsx
    │   ├── api/revalidate/route.ts
    │   └── [slug]/page.tsx       # PHASE 9 uniquement (pages motifs)
    ├── components/
    │   ├── booking/   cal.ts · booking-link.tsx · booking-inline.tsx
    │   ├── layout/    site-header.tsx · site-footer.tsx · mobile-action-bar.tsx · skip-link.tsx
    │   ├── sections/  hero.tsx · about.tsx · motifs.tsx · reviews.tsx · faq.tsx · practical-info.tsx
    │   ├── seo/       json-ld.tsx
    │   └── ui/        button.tsx · section.tsx · eyebrow.tsx · star-rating.tsx · site-image.tsx
    │                  image-placeholder.tsx · reveal.tsx · motion-features.ts
    ├── config/        site.ts · images.ts
    ├── content/       ui-copy.ts     # micro-copie d'interface (pas de contenu métier)
    └── lib/
        ├── content/   types.ts · fallback.ts · parse.ts · format.ts · get-site-content.ts (+ *.test.ts)
        ├── notion/    client.ts · properties.ts · fetch-content.ts
        ├── seo/       json-ld.ts · metadata.ts
        └── icons.ts · maps.ts · utils.ts
```

### 5.2 Flux de données

```
Notion (6 bases) ──fetchSiteContent()──► SiteContent validé + avertissements
                                              │
                              getSiteContent() : React cache() + politique de repli
                                              │
      layout (JSON-LD global, header/footer) · page (sections, metadata, JSON-LD page) · sitemap · OG
                                              │
                         HTML statique (ISR : revalidate = 3600 s) servi par le CDN Vercel
/api/revalidate?secret=… ──► revalidatePath("/", "layout") ──► régénération à la visite suivante
```

Critère de build : la sortie de `next build` doit afficher `○ /  1h  1y` (statique, revalidation 1 h).
Aucune page ne doit utiliser `cookies()`, `headers()` ou `searchParams` (cela la rendrait dynamique).

---

## 6. Code de référence validé

> Chaque fichier ci-dessous a compilé (`tsc --noEmit`), passé ESLint et `next build` avec Next 16.3.6.
> Chemin du fichier en première ligne de chaque bloc.

### 6.1 Configuration

```ts
// src/config/site.ts
/**
 * Configuration technique (non éditoriale). Le contenu éditorial vient de Notion.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://osteopathe-tchikaya.lu"
).replace(/\/+$/, "");

/** Indexation autorisée uniquement sur la production Vercel (ou si forcé). */
export const ALLOW_INDEXING =
  process.env.VERCEL_ENV === "production" || process.env.ALLOW_INDEXING === "true";

/** Coordonnées GPS du cabinet — À VÉRIFIER sur Google Maps (clic droit sur le bâtiment). */
export const GEO = { latitude: 49.4808, longitude: 6.0841 } as const;

/** IDs des bases Notion (visibles dans l'URL de chaque base). */
export const NOTION_DATABASES = {
  general: "3e84bf3fc728807289c3d8fd65392419", // Informations_generales
  images: "3e84bf3fc728802d8c71e4430540f4a6", // Medias_Images
  about: "3e84bf3fc72880b697fde52ac9061d49", // Section A_Propos
  motifs: "3e84bf3fc72880f89f2cf61ae9b23382", // Motifs_Consultation
  reviews: "3e84bf3fc7288023beb4d2739a387a17", // Avis_Patients
  faq: "3e84bf3fc7288062883dc5d447128b28", // FAQ_SEO
} as const;

export type NotionDatabaseKey = keyof typeof NOTION_DATABASES;
```

```ts
// src/config/images.ts
/**
 * Hôtes d'images autorisés. Source unique partagée par next.config.ts (remotePatterns)
 * et par la validation des URLs Notion (une URL hors liste => placeholder, jamais de crash).
 */
export const IMAGE_REMOTE_PATTERNS = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }, // TODO: restreindre à /<cloud_name>/**
  { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
] as const;

export function isAllowedImageUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return IMAGE_REMOTE_PATTERNS.some(({ hostname }) =>
    hostname.startsWith("*.")
      ? url.hostname.endsWith(hostname.slice(1))
      : url.hostname === hostname,
  );
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";
import { IMAGE_REMOTE_PATTERNS } from "./src/config/images";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: IMAGE_REMOTE_PATTERNS.map((p) => ({ ...p })),
    formats: ["image/avif", "image/webp"],
    qualities: [75], // obligatoire depuis Next 16
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
```

Testé et **non retenu** : `experimental.inlineCss` (aucun gain mesuré : 98 sur 3 runs).

```ts
// vitest.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

`package.json` → scripts à ajouter (et `"engines": { "node": "22.x" }`) :

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "next typegen && tsc --noEmit",
  "test": "vitest run",
  "notion:check": "tsx --env-file=.env.local scripts/notion-check.ts",
  "seo:smoke": "tsx scripts/seo-smoke.ts"
}
```

### 6.2 Types du contenu

```ts
// src/lib/content/types.ts
export type ImageSlot = "hero" | "portrait" | "cabinet";

/** Image prête pour next/image. `src === null` => afficher le placeholder de la zone. */
export type SiteImage = {
  src: string | null;
  alt: string; // toujours non vide (Alt_description Notion, sinon alt de secours)
  width: number;
  height: number;
};

export type OpeningHoursRange = {
  days: Array<"Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su">;
  opens: string; // "08:00"
  closes: string; // "19:00"
};

export type Expertise = { title: string; text: string };

export type Motif = {
  title: string;
  slug: string;
  description: string;
  icon: string; // nom Lucide validé (voir MOTIF_ICONS)
  notionPageId: string | null; // pour les pages motifs (phase 9)
};

export type Review = {
  author: string; // déjà formaté "Prénom N."
  rating: number | null; // 0..5
  text: string;
  date: string | null; // ISO "2026-09-21"
};

export type FaqItem = { question: string; answer: string };

export type SiteContent = {
  practitioner: { name: string; title: string };
  seo: { h1: string; heroSubtitle: string; metaTitle: string | null; metaDescription: string | null };
  contact: {
    street: string;
    postalCode: string;
    locality: string;
    countryName: string;
    countryCode: "LU";
    phoneDisplay: string;
    phoneE164: string;
  };
  booking: { url: string; calLink: string; calOrigin: string };
  googleBusinessUrl: string | null;
  consultation: {
    durationLabel: string;
    durationMinutes: number | null;
    price: string | null; // null si placeholder "[Mettre le tarif…]"
    reimbursement: string;
  };
  rating: { value: number; count: number | null } | null;
  openingHours: OpeningHoursRange[] | null;
  access: string | null; // Acces_Info (parking, bus…)
  languages: string[]; // Langues_Parlees "Français, Anglais"
  about: {
    title: string;
    shortBio: string;
    longBio: string;
    education: string | null; // Formation (E-E-A-T)
    expertises: Expertise[];
  };
  motifs: Motif[];
  reviews: Review[];
  faq: FaqItem[];
  images: Record<ImageSlot, SiteImage>;
  sameAs: string[];
};
```

### 6.3 Instantané de secours (contenu Notion au 27/09/2026)

```ts
// src/lib/content/fallback.ts
import type { SiteContent } from "./types";

/**
 * Snapshot du contenu Notion au 27/09/2026 (+ valeurs du brief).
 * Utilisé : (1) sans NOTION_TOKEN (dev, CI, sandbox) ; (2) champ par champ si un champ
 * OBLIGATOIRE est vide dans Notion. Ne jamais l'utiliser pour masquer une panne Notion en prod.
 */
export const FALLBACK_CONTENT: SiteContent = {
  practitioner: { name: "Patrice Tchikaya", title: "Ostéopathe D.O." },
  seo: {
    h1: "Ostéopathe à Dudelange – Patrice Tchikaya",
    heroSubtitle:
      "Prise en charge globale des douleurs articulaires et musculaires. Expertise dédiée aux sportifs, actifs et accompagnement sur-mesure.",
    metaTitle: null,
    metaDescription: null,
  },
  contact: {
    street: "46 Avenue Grande-Duchesse Charlotte",
    postalCode: "3440",
    locality: "Dudelange",
    countryName: "Luxembourg",
    countryCode: "LU",
    phoneDisplay: "+352 51 92 92",
    phoneE164: "+352519292",
  },
  booking: {
    url: "https://cal.eu/patrice-tchikaya-pro/consultation",
    calLink: "patrice-tchikaya-pro/consultation",
    calOrigin: "https://app.cal.eu",
  },
  googleBusinessUrl: "https://g.page/r/CY0QxWkj7WfJEBM",
  consultation: {
    durationLabel: "45 minutes",
    durationMinutes: 45,
    price: null,
    reimbursement:
      "Consultations prises en charge par les mutuelles et assurances complémentaires de santé.",
  },
  rating: { value: 5, count: null },
  openingHours: null,
  access: null,
  languages: [],
  about: {
    education: null,
    title: "Un parcours unique au service de votre santé",
    shortBio:
      "Ostéopathe installé au sein du cabinet de Dudelange, Patrice Tchikaya propose une prise en charge globale et personnalisée de la douleur.",
    longBio:
      "Ancien sportif de haut niveau en handball et ancien cadre supérieur d'entreprise, Patrice Tchikaya dispose d'une compréhension fine des contraintes physiques et psychiques du corps humain. Son double parcours lui permet de traiter avec une précision particulière les traumatismes liés au sport, ainsi que les troubles musculo-squelettiques (TMS), le stress et les mauvaises postures générés par le monde professionnel.",
    expertises: [
      {
        title: "Ancien sportif de haut niveau en handball",
        text: "Maîtrise des pathologies mécaniques, des traumatismes sportifs, de la récupération et de la prévention.",
      },
      {
        title: "Ancien cadre supérieur d'entreprise",
        text: "Compréhension directe du stress, des troubles musculo-squelettiques (TMS) et des mauvaises postures liées au travail sur écran.",
      },
      {
        title: "Ostéopathe D.O.",
        text: "Une approche systémique, douce et globale du patient.",
      },
    ],
  },
  motifs: [
    {
      title: "Ostéopathie du Sport",
      slug: "osteopathie-du-sport-dudelange",
      description:
        "Entorses, tendinites, préparation physique, récupération et suivi des athlètes de tous niveaux.",
      icon: "Activity",
      notionPageId: null,
    },
    {
      title: "Posture & Vie Pro (TMS)",
      slug: "tms-ergonomie-bureau",
      description:
        "Mal de dos, cervicalgies, tensions sur écran, canal carpien et gestion du stress corporel.",
      icon: "Briefcase",
      notionPageId: null,
    },
    {
      title: "Traumatologie & Douleurs",
      slug: "traitement-lumbago-sciatique-dudelange",
      description: "Lumbagos, sciatiques, blocages articulaires aigus ou chroniques.",
      icon: "Zap",
      notionPageId: null,
    },
    {
      title: "Bilan Préventif",
      slug: "bilan-osteopathique-annuel",
      description: "Bilan postural global, ajustements préventifs et rééquilibrage du corps.",
      icon: "ShieldCheck",
      notionPageId: null,
    },
  ],
  reviews: [
    {
      author: "Yves S.",
      rating: 5,
      text: "Après pas mal d'années de soins auprès de Leiner Daniel ( parti à la retraite ) me voici entre les mains de Patrice Tchikaya ( son successeur ) que je recommande vivement , extrêmement à l'écoute , lors de ma première séance pour bien cerner ma douleur. après des manipulations ( bien ciblées et douces ) qui m'ont soulagées rapidement . Ce qui est très appréciable sont ses conseils afin d'éviter des faux mouvements et douleurs répétitives . Très bon accueil au cabinet . A recommander .",
      date: "2026-09-21",
    },
    {
      author: "Jeff D.",
      rating: 5,
      text: "Excellent ostéopathe ! Il travaille avec beaucoup de professionnalisme et prend vraiment le temps nécessaire avec ses patients. On se sent écouté et très bien pris en charge. En plus d’être très compétent, il a beaucoup d’humour, ce qui rend les séances vraiment agréables. Je le recommande vivement",
      date: "2026-09-13",
    },
    {
      author: "Michelle Y.",
      rating: 5,
      text: "On m'a recommandé Patrice lorsque j'étais enceinte et que j'avais mal au dos. Après une seule séance, la douleur avait complètement disparu ! Il a un souci du détail incroyable et m'a donné des exercices à faire pour s'assurer que la douleur ne revienne pas. (translated)",
      date: "2026-07-05",
    },
  ],
  faq: [
    {
      question: "Comment se déroule une séance d'ostéopathie ?",
      answer:
        "La séance dure 45 minutes. Elle débute par une anamnèse précise (questionnaire médical), suivie d'un examen clinique, du traitement manuel adapté et de conseils personnalisés.",
    },
    {
      question: "Les consultations sont-elles remboursées au Luxembourg ?",
      answer:
        "L'ostéopathie est prise en charge par la majorité des mutuelles et assurances complémentaires de santé. Une facture vous est remise à l'issue de la séance.",
    },
    {
      question: "Faut-il une ordonnance médicale pour consulter ?",
      answer:
        "Non, l'ostéopathe est un praticien de première intention. Vous pouvez prendre rendez-vous directement sans ordonnance préalable.",
    },
  ],
  images: {
    hero: { src: null, alt: "Cabinet d'ostéopathie Patrice Tchikaya à Dudelange", width: 960, height: 1200 },
    portrait: { src: null, alt: "Patrice Tchikaya, ostéopathe D.O. à Dudelange", width: 800, height: 1000 },
    cabinet: {
      src: null,
      alt: "Cabinet d'ostéopathie et salle de consultation Patrice Tchikaya à Dudelange",
      width: 1200,
      height: 800,
    },
  },
  sameAs: ["https://g.page/r/CY0QxWkj7WfJEBM"],
};
```

### 6.4 Fonctions d'analyse (pures, testées)

```ts
// src/lib/content/parse.ts
import type { OpeningHoursRange } from "./types";

/** "[Mettre le tarif ex: 90 €]" ou vide => valeur non renseignée. */
export function isPlaceholder(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return v === "" || /^\[.*\]$/.test(v) || /mettre le|à compléter|a completer|todo/i.test(v);
}

export function cleanOptional(value: string | null | undefined): string | null {
  return isPlaceholder(value) ? null : (value ?? "").trim();
}

/** "3440 Dudelange, Luxembourg" | "L-3440 Dudelange" -> { postalCode, locality, countryName } */
export function parsePostalLine(value: string) {
  const m = value.trim().match(/^(?:L-)?(\d{4})\s+([^,]+?)(?:,\s*(.+))?$/i);
  if (!m) return null;
  return { postalCode: m[1], locality: m[2].trim(), countryName: (m[3] ?? "Luxembourg").trim() };
}

/** Garde uniquement "+" et les chiffres : "+352 51 92 92" -> "+352519292" */
export function toE164(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/**
 * "https://cal.eu/patrice-tchikaya-pro/consultation"
 *  -> { url, calLink: "patrice-tchikaya-pro/consultation", calOrigin: "https://app.cal.eu" }
 * Compte Cal.com UE : l'iframe doit pointer vers app.cal.eu (sinon 404 "Cal Link seems to be wrong").
 */
export function parseCalUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const calLink = url.pathname.replace(/^\/+|\/+$/g, "");
  if (!calLink) return null;
  const host = url.hostname.replace(/^www\./, "");
  const calOrigin =
    host === "cal.eu" || host === "app.cal.eu"
      ? "https://app.cal.eu"
      : host === "cal.com" || host === "app.cal.com"
        ? "https://app.cal.com"
        : `${url.protocol}//${url.host}`; // instance auto-hébergée
  return { url: url.toString(), calLink, calOrigin };
}

/** "5 / 5" | "4,5" | "5" -> 5 | 4.5 ; hors [0,5] ou illisible -> null */
export function parseRating(value: string | null | undefined): number | null {
  const m = (value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 0 && n <= 5 ? n : null;
}

export function parseInteger(value: string | null | undefined): number | null {
  const m = (value ?? "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** "Yves Schweicher" -> "Yves S." ; "Michelle" -> "Michelle" (minimisation des données patient) */
export function formatReviewAuthor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "Patient";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function normalizeSlug(value: string): string | null {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : null;
}

const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Day = (typeof DAY_ORDER)[number];

/**
 * Format attendu dans Notion (clé Horaires) : "Mo-Fr 08:00-19:00; Sa 08:00-12:00"
 * (format schema.org openingHours). Retourne null si vide ou invalide.
 */
export function parseOpeningHours(value: string | null | undefined): OpeningHoursRange[] | null {
  if (isPlaceholder(value)) return null;
  const ranges: OpeningHoursRange[] = [];
  for (const chunk of value!.split(/[;\n]+/).map((c) => c.trim()).filter(Boolean)) {
    const m = chunk.match(/^([A-Z][a-z](?:-[A-Z][a-z])?(?:,[A-Z][a-z](?:-[A-Z][a-z])?)*)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!m) return null;
    const days: Day[] = [];
    for (const part of m[1].split(",")) {
      const [from, to] = part.split("-") as [Day, Day | undefined];
      const a = DAY_ORDER.indexOf(from);
      const b = to ? DAY_ORDER.indexOf(to) : a;
      if (a < 0 || b < 0 || b < a) return null;
      days.push(...DAY_ORDER.slice(a, b + 1));
    }
    ranges.push({ days, opens: m[2], closes: m[3] });
  }
  return ranges.length > 0 ? ranges : null;
}
```

```ts
// src/lib/content/format.ts
import type { OpeningHoursRange } from "./types";

const LOCALE = "fr-LU";

/** 5 -> "5,0" */
export const formatRating = (value: number) =>
  value.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "2026-09-21" -> "septembre 2026" (date absolue : une page statique ne doit pas dire « il y a 3 jours »). */
export function formatReviewDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

const DAY_FR: Record<OpeningHoursRange["days"][number], string> = {
  Mo: "Lundi", Tu: "Mardi", We: "Mercredi", Th: "Jeudi", Fr: "Vendredi", Sa: "Samedi", Su: "Dimanche",
};

/** [{days:[Mo..Fr],opens:"08:00",closes:"19:00"}] -> ["Lundi – Vendredi : 8h00 – 19h00"] */
export function formatOpeningHours(ranges: OpeningHoursRange[]): string[] {
  const time = (t: string) => t.replace(/^0/, "").replace(":", "h");
  return ranges.map((r) => {
    const first = DAY_FR[r.days[0]];
    const last = DAY_FR[r.days[r.days.length - 1]];
    const days = r.days.length > 1 ? `${first} – ${last}` : first;
    return `${days} : ${time(r.opens)} – ${time(r.closes)}`;
  });
}
```

```ts
// src/lib/content/parse.test.ts
import { describe, expect, it } from "vitest";
import { isAllowedImageUrl } from "@/config/images";
import {
  formatReviewAuthor, isPlaceholder, normalizeSlug, parseCalUrl, parseOpeningHours,
  parsePostalLine, parseRating, toE164,
} from "./parse";

describe("parse", () => {
  it("détecte les placeholders Notion", () => {
    expect(isPlaceholder("[Mettre le tarif ex: 90 €]")).toBe(true);
    expect(isPlaceholder("")).toBe(true);
    expect(isPlaceholder("90 €")).toBe(false);
  });
  it("parse l'URL Cal.com UE", () => {
    expect(parseCalUrl("https://cal.eu/patrice-tchikaya-pro/consultation")).toEqual({
      url: "https://cal.eu/patrice-tchikaya-pro/consultation",
      calLink: "patrice-tchikaya-pro/consultation",
      calOrigin: "https://app.cal.eu",
    });
    expect(parseCalUrl("pas une url")).toBeNull();
  });
  it("parse code postal / ville", () => {
    expect(parsePostalLine("3440 Dudelange, Luxembourg")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
    expect(parsePostalLine("L-3440 Dudelange")).toEqual({ postalCode: "3440", locality: "Dudelange", countryName: "Luxembourg" });
  });
  it("normalise téléphone, note, auteur, slug", () => {
    expect(toE164("+352 51 92 92")).toBe("+352519292");
    expect(parseRating("5 / 5")).toBe(5);
    expect(parseRating("4,5")).toBe(4.5);
    expect(parseRating("12")).toBeNull();
    expect(formatReviewAuthor("Yves Schweicher")).toBe("Yves S.");
    expect(normalizeSlug("Ostéopathie du Sport")).toBe("osteopathie-du-sport");
  });
  it("parse les horaires schema.org", () => {
    expect(parseOpeningHours("Mo-Fr 08:00-19:00; Sa 08:00-12:00")).toEqual([
      { days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:00", closes: "19:00" },
      { days: ["Sa"], opens: "08:00", closes: "12:00" },
    ]);
    expect(parseOpeningHours("lundi 8h")).toBeNull();
  });
  it("valide les hôtes d'images", () => {
    expect(isAllowedImageUrl("https://abc123.public.blob.vercel-storage.com/portrait.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://prod-files-secure.s3.us-west-2.amazonaws.com/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("http://images.unsplash.com/x.jpg")).toBe(false);
  });
});
```

```ts
// src/lib/content/format.test.ts
import { describe, expect, it } from "vitest";
import { formatOpeningHours, formatRating, formatReviewDate } from "./format";

describe("format", () => {
  it("formate note, date et horaires en français", () => {
    expect(formatRating(5)).toBe("5,0");
    expect(formatReviewDate("2026-09-21")).toBe("septembre 2026");
    expect(formatReviewDate(null)).toBeNull();
    expect(formatOpeningHours([{ days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:00", closes: "19:00" }])).toEqual([
      "Lundi – Vendredi : 8h00 – 19h00",
    ]);
  });
});
```

### 6.5 Client et propriétés Notion

```ts
// src/lib/notion/client.ts
import { Client } from "@notionhq/client";

/** Version d'API épinglée (data sources). Ne pas changer sans relire le guide de migration Notion. */
export const NOTION_API_VERSION = "2025-09-03";

export function createNotionClient(token: string) {
  return new Client({ auth: token, notionVersion: NOTION_API_VERSION, timeoutMs: 15_000 });
}
export type NotionClient = ReturnType<typeof createNotionClient>;
```

```ts
// src/lib/notion/properties.ts
import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client";

type Properties = PageObjectResponse["properties"];

export function richTextToPlain(items: RichTextItemResponse[]): string {
  return items.map((t) => t.plain_text).join("").trim();
}

/** Texte brut d'une propriété (title, rich_text, url, number, select, email, phone). "" si absente. */
export function getText(props: Properties, name: string): string {
  const p = props[name];
  if (!p) return "";
  switch (p.type) {
    case "title":
      return richTextToPlain(p.title);
    case "rich_text":
      return richTextToPlain(p.rich_text);
    case "url":
      return p.url ?? "";
    case "number":
      return p.number === null ? "" : String(p.number);
    case "select":
      return p.select?.name ?? "";
    case "email":
      return p.email ?? "";
    case "phone_number":
      return p.phone_number ?? "";
    default:
      return "";
  }
}

/** URL portée par un lien dans un texte enrichi (href) ou par une propriété URL. */
export function getUrl(props: Properties, name: string): string | null {
  const p = props[name];
  if (!p) return null;
  if (p.type === "url") return p.url;
  if (p.type === "rich_text" || p.type === "title") {
    const items = p.type === "rich_text" ? p.rich_text : p.title;
    const href = items.find((t) => t.href)?.href;
    const candidate = (href ?? richTextToPlain(items)).trim();
    try {
      return new URL(candidate).toString();
    } catch {
      return null;
    }
  }
  return null;
}

export function getNumber(props: Properties, name: string): number | null {
  const p = props[name];
  return p?.type === "number" ? p.number : null;
}

/** null si la propriété n'existe pas (=> ne pas filtrer). */
export function getCheckbox(props: Properties, name: string): boolean | null {
  const p = props[name];
  return p?.type === "checkbox" ? p.checkbox : null;
}

export function getDateStart(props: Properties, name: string): string | null {
  const p = props[name];
  return p?.type === "date" ? (p.date?.start ?? null) : null;
}
```

```ts
// src/lib/icons.ts
import {
  Activity, Baby, Bone, Brain, Briefcase, Dumbbell, Footprints, Hand, HandHeart, HeartPulse,
  Laptop, Leaf, PersonStanding, ShieldCheck, Sparkles, Stethoscope, Wind, Zap,
  type LucideIcon,
} from "lucide-react";

/** Icônes autorisées pour la colonne Notion « Icone_Lucide » (nom exact, sensible à la casse). */
export const MOTIF_ICONS = {
  Activity, Baby, Bone, Brain, Briefcase, Dumbbell, Footprints, Hand, HandHeart, HeartPulse,
  Laptop, Leaf, PersonStanding, ShieldCheck, Sparkles, Stethoscope, Wind, Zap,
} satisfies Record<string, LucideIcon>;

export type MotifIconName = keyof typeof MOTIF_ICONS;
export const DEFAULT_MOTIF_ICON: MotifIconName = "Sparkles";

export function resolveIconName(raw: string, onUnknown?: (raw: string) => void): MotifIconName {
  const name = raw.trim();
  if (name in MOTIF_ICONS) return name as MotifIconName;
  if (name) onUnknown?.(name);
  return DEFAULT_MOTIF_ICON;
}
```

### 6.6 Lecture et normalisation du contenu

```ts
// src/lib/notion/fetch-content.ts
import { collectPaginatedAPI, isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { NOTION_DATABASES, type NotionDatabaseKey } from "@/config/site";
import { isAllowedImageUrl } from "@/config/images";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import {
  cleanOptional,
  formatReviewAuthor,
  isPlaceholder,
  normalizeSlug,
  parseCalUrl,
  parseInteger,
  parseOpeningHours,
  parsePostalLine,
  parseRating,
  toE164,
} from "@/lib/content/parse";
import type { ImageSlot, Motif, SiteContent, SiteImage } from "@/lib/content/types";
import { resolveIconName } from "@/lib/icons";
import type { NotionClient } from "./client";
import { getCheckbox, getDateStart, getNumber, getText, getUrl } from "./properties";

type Rows = PageObjectResponse[];

/** Base Notion -> data source (API 2025-09-03) -> toutes les lignes (pages). */
async function queryDatabase(notion: NotionClient, databaseId: string): Promise<Rows> {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  if (!isFullDatabase(db) || db.data_sources.length === 0) {
    throw new Error(`Base Notion ${databaseId} inaccessible (intégration non connectée ?)`);
  }
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: db.data_sources[0].id,
    page_size: 100,
  });
  return results.filter(isFullPage).filter((row) => !row.in_trash);
}

/** Tri : propriété "Ordre" (number) si présente, sinon date de création croissante. */
function sortRows(rows: Rows): Rows {
  return [...rows].sort((a, b) => {
    const oa = getNumber(a.properties, "Ordre");
    const ob = getNumber(b.properties, "Ordre");
    if (oa !== null && ob !== null && oa !== ob) return oa - ob;
    if (oa !== null && ob === null) return -1;
    if (oa === null && ob !== null) return 1;
    return a.created_time.localeCompare(b.created_time);
  });
}

/** Ligne masquée si une case "Publié" existe et est décochée. */
const isPublished = (row: PageObjectResponse) => getCheckbox(row.properties, "Publié") !== false;

/** Bases clé/valeur (Variable -> Valeur). */
function toKeyValue(rows: Rows, valueProp = "Valeur") {
  const map = new Map<string, PageObjectResponse>();
  for (const row of rows) {
    const key = getText(row.properties, "Variable");
    if (key) map.set(key, row);
  }
  return {
    text: (key: string) => {
      const row = map.get(key);
      return row ? getText(row.properties, valueProp) : "";
    },
    url: (key: string) => {
      const row = map.get(key);
      return row ? getUrl(row.properties, valueProp) : null;
    },
    row: (key: string) => map.get(key),
    keys: () => [...map.keys()],
  };
}

const IMAGE_SIZES: Record<ImageSlot, { width: number; height: number; key: string }> = {
  hero: { width: 960, height: 1200, key: "Url_Photo_Hero" },
  portrait: { width: 800, height: 1000, key: "Url_Photo_Portrait" },
  cabinet: { width: 1200, height: 800, key: "Url_Photo_Cabinet" },
};

export type ContentResult = { content: SiteContent; warnings: string[] };

export async function fetchSiteContent(notion: NotionClient): Promise<ContentResult> {
  const warnings: string[] = [];
  const entries = await Promise.all(
    (Object.keys(NOTION_DATABASES) as NotionDatabaseKey[]).map(
      async (key) => [key, await queryDatabase(notion, NOTION_DATABASES[key])] as const,
    ),
  );
  const db = Object.fromEntries(entries) as Record<NotionDatabaseKey, Rows>;
  const F = FALLBACK_CONTENT;

  /** Champ obligatoire : valeur Notion, sinon snapshot + avertissement. */
  const required = (value: string, fallback: string, label: string) => {
    if (!isPlaceholder(value)) return value.trim();
    warnings.push(`Champ obligatoire vide dans Notion : ${label} (valeur de secours utilisée)`);
    return fallback;
  };

  // --- Informations_generales
  const g = toKeyValue(db.general);
  const postal = parsePostalLine(g.text("Code_Postal_Ville"));
  if (!postal) warnings.push("Code_Postal_Ville illisible (attendu : « 3440 Dudelange, Luxembourg »)");
  const cal = parseCalUrl(g.url("Url_CalCom") ?? "");
  if (!cal) warnings.push("Url_CalCom manquante ou invalide (valeur de secours utilisée)");
  const price = cleanOptional(g.text("Tarif_Consultation"));
  if (!price) warnings.push("Tarif_Consultation non renseigné : la ligne « Tarif » sera masquée");
  const ratingValue = parseRating(g.text("Note_Google"));
  const openingRaw = g.text("Horaires");
  const openingHours = parseOpeningHours(openingRaw);
  if (openingRaw && !openingHours) warnings.push(`Horaires illisibles : « ${openingRaw} »`);
  const phoneDisplay = required(g.text("Telephone_Display"), F.contact.phoneDisplay, "Telephone_Display");
  const durationLabel = required(g.text("Duree_Consultation"), F.consultation.durationLabel, "Duree_Consultation");

  // --- Section A_Propos (+ expertises optionnelles Expertise_1_Titre / Expertise_1_Texte …)
  const a = toKeyValue(db.about);
  const expertises = [1, 2, 3, 4]
    .map((i) => ({ title: a.text(`Expertise_${i}_Titre`), text: a.text(`Expertise_${i}_Texte`) }))
    .filter((e) => !isPlaceholder(e.title) && !isPlaceholder(e.text));

  // --- Medias_Images : colonne URL uniquement (jamais le fichier Notion : URL S3 temporaire ~1 h)
  const m = toKeyValue(db.images);
  const images = Object.fromEntries(
    (Object.keys(IMAGE_SIZES) as ImageSlot[]).map((slot) => {
      const { key, width, height } = IMAGE_SIZES[slot];
      const row = m.row(key);
      const url = row ? getUrl(row.properties, "URL") : null;
      const alt = row ? getText(row.properties, "Alt_description") : "";
      let src: string | null = null;
      if (url && isAllowedImageUrl(url)) src = url;
      else if (url) warnings.push(`${key} : hôte d'image non autorisé (${url}) — voir src/config/images.ts`);
      else if (row?.properties["Image"]?.type === "files" && row.properties["Image"].files.length > 0)
        warnings.push(`${key} : fichier téléversé dans Notion ignoré (URL temporaire). Coller une URL publique dans la colonne URL.`);
      if (!alt) warnings.push(`${key} : Alt_description vide (alt de secours utilisé)`);
      const image: SiteImage = { src, alt: alt || F.images[slot].alt, width, height };
      return [slot, image];
    }),
  ) as Record<ImageSlot, SiteImage>;

  // --- Motifs_Consultation
  const motifs: Motif[] = sortRows(db.motifs.filter(isPublished)).flatMap((row) => {
    const title = getText(row.properties, "Motif");
    const slug = normalizeSlug(getText(row.properties, "slug URL") || title);
    if (!title || !slug) return [];
    return [{
      title,
      slug,
      description: getText(row.properties, "Description_Courte"),
      icon: resolveIconName(getText(row.properties, "Icone_Lucide"), (bad) =>
        warnings.push(`Icône Lucide inconnue « ${bad} » pour « ${title} » (icône par défaut)`),
      ),
      notionPageId: row.id,
    }];
  });

  // --- Avis_Patients (du plus récent au plus ancien)
  const reviews = db.reviews
    .filter(isPublished)
    .map((row) => ({
      author: formatReviewAuthor(getText(row.properties, "Nom_Patient")),
      rating: parseRating(getText(row.properties, "Note")),
      text: getText(row.properties, "Avis_Texte"),
      date: getDateStart(row.properties, "Date"),
    }))
    .filter((r) => r.text.length > 0)
    .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));

  // --- FAQ_SEO
  const faq = sortRows(db.faq.filter(isPublished))
    .map((row) => ({ question: getText(row.properties, "Name"), answer: getText(row.properties, "Reponse") }))
    .filter((f) => f.question && f.answer);

  const gbp = g.url("Url_Google_My_Business");
  const profiles = g
    .keys()
    .filter((k) => k.startsWith("Url_Profil_"))
    .map((k) => g.url(k))
    .filter((u): u is string => Boolean(u));
  const languages = (cleanOptional(g.text("Langues_Parlees")) ?? "")
    .split(/[,;]/)
    .map((l) => l.trim())
    .filter(Boolean);
  const content: SiteContent = {
    practitioner: {
      name: required(g.text("Nom_Praticien"), F.practitioner.name, "Nom_Praticien"),
      title: required(g.text("Metier_Titre"), F.practitioner.title, "Metier_Titre"),
    },
    seo: {
      h1: required(g.text("Titre_SEO_H1"), F.seo.h1, "Titre_SEO_H1"),
      heroSubtitle: required(g.text("Sous_Titre_Hero"), F.seo.heroSubtitle, "Sous_Titre_Hero"),
      metaTitle: cleanOptional(g.text("Meta_Title")),
      metaDescription: cleanOptional(g.text("Meta_Description")),
    },
    contact: {
      street: required(g.text("Adresse_Rue"), F.contact.street, "Adresse_Rue"),
      postalCode: postal?.postalCode ?? F.contact.postalCode,
      locality: postal?.locality ?? F.contact.locality,
      countryName: postal?.countryName ?? F.contact.countryName,
      countryCode: "LU",
      phoneDisplay,
      phoneE164: toE164(g.text("Telephone_RAW") || phoneDisplay),
    },
    booking: cal ?? F.booking,
    googleBusinessUrl: gbp,
    consultation: {
      durationLabel,
      durationMinutes: parseInteger(durationLabel),
      price,
      reimbursement: required(g.text("Info_Remboursement"), F.consultation.reimbursement, "Info_Remboursement"),
    },
    rating: ratingValue === null ? null : { value: ratingValue, count: parseInteger(g.text("Nombre_Avis_Google")) },
    openingHours,
    access: cleanOptional(g.text("Acces_Info")),
    languages,
    about: {
      education: cleanOptional(a.text("Formation")),
      title: required(a.text("Titre"), F.about.title, "A_Propos.Titre"),
      shortBio: required(a.text("Bio_Courte"), F.about.shortBio, "A_Propos.Bio_Courte"),
      longBio: required(a.text("Bio_Detaillee"), F.about.longBio, "A_Propos.Bio_Detaillee"),
      expertises: expertises.length > 0 ? expertises : F.about.expertises,
    },
    motifs: motifs.length > 0 ? motifs : F.motifs,
    reviews,
    faq,
    images,
    sameAs: [gbp, ...profiles].filter((u): u is string => Boolean(u)),
  };
  return { content, warnings };
}
```

> ⚠ `rating` : la valeur 5,0 du brief est dans le fallback. Avec Notion, la note n'apparaît que si `Note_Google`
> est renseignée (règle : ne jamais afficher « 5,0/5 sur Google » sans source).

```ts
// src/lib/content/get-site-content.ts
import "server-only";
import { cache } from "react";
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent } from "@/lib/notion/fetch-content";
import { FALLBACK_CONTENT } from "./fallback";
import type { SiteContent } from "./types";

/**
 * Point d'entrée UNIQUE du contenu, dédoublonné par rendu (React cache).
 * - Pas de NOTION_TOKEN : snapshot (dev/CI) ; interdit en production Vercel.
 * - Erreur API Notion : on LÈVE l'erreur. En ISR, Next conserve la dernière page valide ;
 *   au build, l'échec est visible. Jamais de retour silencieux au snapshot en prod.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    if (process.env.VERCEL_ENV === "production") {
      throw new Error("NOTION_TOKEN manquant en production : contenu Notion indisponible.");
    }
    console.warn("[content] NOTION_TOKEN absent → contenu de secours (src/lib/content/fallback.ts)");
    return FALLBACK_CONTENT;
  }
  const { content, warnings } = await fetchSiteContent(createNotionClient(token));
  for (const w of warnings) console.warn(`[notion] ${w}`);
  return content;
});
```

`fetch-content.ts` n'importe **pas** `server-only` : le script `notion-check` (hors Next) l'utilise. Seul
`get-site-content.ts` est réservé au serveur.

### 6.7 Script de diagnostic Notion

```ts
// scripts/notion-check.ts
/**
 * Vérifie l'accès Notion + la qualité du contenu, sans lancer Next.
 * Usage : npm run notion:check   (lit NOTION_TOKEN depuis .env.local)
 */
import { createNotionClient } from "@/lib/notion/client";
import { fetchSiteContent } from "@/lib/notion/fetch-content";

async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error("✗ NOTION_TOKEN absent (.env.local).");
    process.exit(1);
  }
  try {
    const { content, warnings } = await fetchSiteContent(createNotionClient(token));
    console.log(`✓ Notion OK — ${content.motifs.length} motifs, ${content.reviews.length} avis, ${content.faq.length} questions FAQ`);
    for (const [slot, img] of Object.entries(content.images)) {
      console.log(`  image ${slot}: ${img.src ? "OK" : "placeholder"} — alt « ${img.alt} »`);
    }
    if (warnings.length === 0) console.log("✓ Aucun avertissement");
    for (const w of warnings) console.warn(`⚠ ${w}`);
  } catch (error) {
    console.error("✗ Échec de lecture Notion :", error instanceof Error ? error.message : error);
    console.error("  → L'intégration est-elle connectée à la page « Site web Ostéopathie Dudelange » ?");
    process.exit(1);
  }
}

void main();
```

Attendu aujourd'hui avec un vrai token : ✓ + avertissements « Tarif_Consultation non renseigné » et
« Url_Photo_Portrait : fichier téléversé dans Notion ignoré ». (Dans cet environnement cloud, l'appel échoue en 403 :
proxy réseau, comportement normal.)

### 6.8 Utilitaires

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```ts
// src/lib/maps.ts
import type { SiteContent } from "@/lib/content/types";

const fullAddress = (c: SiteContent) =>
  `${c.contact.street}, ${c.contact.postalCode} ${c.contact.locality}, ${c.contact.countryName}`;

/** Lien « voir sur la carte » (Maps URLs officielles, sans clé API). */
export const googleMapsSearchUrl = (c: SiteContent) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.practitioner.name} ostéopathe, ${fullAddress(c)}`)}`;

/** Lien « itinéraire ». */
export const googleMapsDirectionsUrl = (c: SiteContent) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(c))}`;
```

### 6.9 SEO : métadonnées et JSON-LD

```ts
// src/lib/seo/metadata.ts
import type { SiteContent } from "@/lib/content/types";

export function homeMeta(c: SiteContent) {
  const title = c.seo.metaTitle ?? `Ostéopathe à ${c.contact.locality} – ${c.practitioner.name}, D.O.`;
  const description =
    c.seo.metaDescription ??
    `Cabinet d'ostéopathie à ${c.contact.locality} (Luxembourg) : dos, cou, articulations, sport et TMS. Séance de ${c.consultation.durationLabel}. Prise de rendez-vous en ligne.`;
  return { title, description };
}
```

Résultat avec les données actuelles : `<title>` = « Ostéopathe à Dudelange – Patrice Tchikaya, D.O. » (47 car.),
description de 140 caractères.

```ts
// src/lib/seo/json-ld.ts
import type { FAQPage, Graph, MedicalBusiness, OpeningHoursSpecification, Person, WebPage, WebSite } from "schema-dts";
import { GEO, SITE_URL } from "@/config/site";
import type { SiteContent } from "@/lib/content/types";
import { googleMapsSearchUrl } from "@/lib/maps";

export const ids = {
  website: `${SITE_URL}/#website`,
  organization: `${SITE_URL}/#organization`,
  person: `${SITE_URL}/#person`,
  webpage: (path = "/") => `${SITE_URL}${path}#webpage`,
  faq: `${SITE_URL}/#faq`,
};

const DAY_URI = {
  Mo: "https://schema.org/Monday", Tu: "https://schema.org/Tuesday", We: "https://schema.org/Wednesday",
  Th: "https://schema.org/Thursday", Fr: "https://schema.org/Friday", Sa: "https://schema.org/Saturday",
  Su: "https://schema.org/Sunday",
} as const;

/** Graphe global (layout) : WebSite + cabinet (MedicalBusiness) + praticien (Person). */
export function buildSiteGraph(c: SiteContent): Graph {
  const images = [c.images.hero.src, c.images.cabinet.src, c.images.portrait.src].filter(
    (s): s is string => Boolean(s),
  );
  const openingHoursSpecification: OpeningHoursSpecification[] | undefined = c.openingHours?.map((r) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: r.days.map((d) => DAY_URI[d]),
    opens: r.opens,
    closes: r.closes,
  }));

  // "Physician" = médecin au sens schema.org : titre protégé -> on ne l'affirme pas.
  // MedicalBusiness (LocalBusiness) + MedicalOrganization (autorise medicalSpecialty / isAcceptingNewPatients).
  const organization = {
    "@type": ["MedicalBusiness", "MedicalOrganization"],
    "@id": ids.organization,
    name: `${c.practitioner.name} – ${c.practitioner.title}`,
    description: c.about.shortBio,
    url: SITE_URL,
    telephone: c.contact.phoneE164,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    image: images.length > 0 ? images : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.contact.street,
      postalCode: c.contact.postalCode,
      addressLocality: c.contact.locality,
      addressCountry: c.contact.countryCode,
    },
    geo: { "@type": "GeoCoordinates", latitude: GEO.latitude, longitude: GEO.longitude },
    hasMap: googleMapsSearchUrl(c),
    areaServed: [
      { "@type": "City", name: c.contact.locality },
      { "@type": "Country", name: "Luxembourg" },
    ],
    medicalSpecialty: "https://schema.org/Musculoskeletal",
    isAcceptingNewPatients: true,
    openingHoursSpecification,
    sameAs: c.sameAs.length > 0 ? c.sameAs : undefined,
    potentialAction: {
      "@type": "ReserveAction",
      name: "Prendre rendez-vous en ligne",
      target: c.booking.url,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Motifs de consultation",
      itemListElement: c.motifs.map((m) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: m.title, description: m.description },
      })),
    },
  } as unknown as MedicalBusiness; // multi-type : schema-dts ne type pas les tableaux de @type

  const person: Person = {
    "@type": "Person",
    "@id": ids.person,
    name: c.practitioner.name,
    jobTitle: c.practitioner.title,
    description: c.about.longBio,
    image: c.images.portrait.src ?? undefined,
    worksFor: { "@id": ids.organization },
    workLocation: { "@id": ids.organization },
    knowsAbout: ["Ostéopathie", ...c.motifs.map((m) => m.title), "Troubles musculo-squelettiques", "Handball"],
    knowsLanguage: c.languages.length > 0 ? c.languages : undefined,
    sameAs: c.sameAs.filter((u) => u !== c.googleBusinessUrl),
  };

  const website: WebSite = {
    "@type": "WebSite",
    "@id": ids.website,
    url: SITE_URL,
    name: `${c.practitioner.name} – Ostéopathe à ${c.contact.locality}`,
    inLanguage: "fr-LU",
    publisher: { "@id": ids.organization },
  };

  return { "@context": "https://schema.org", "@graph": [website, organization, person] };
}

/** Graphe de la page d'accueil : WebPage + FAQPage (FAQ = contenu visible uniquement). */
export function buildHomeGraph(c: SiteContent, meta: { title: string; description: string }): Graph {
  const webpage: WebPage = {
    "@type": "WebPage",
    "@id": ids.webpage("/"),
    url: `${SITE_URL}/`,
    name: meta.title,
    description: meta.description,
    inLanguage: "fr-LU",
    isPartOf: { "@id": ids.website },
    about: { "@id": ids.organization },
    primaryImageOfPage: c.images.hero.src ? { "@type": "ImageObject", url: c.images.hero.src } : undefined,
  };
  const graph: Array<WebPage | FAQPage> = [webpage];
  if (c.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": ids.faq,
      isPartOf: { "@id": ids.webpage("/") },
      mainEntity: c.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
```

```tsx
// src/components/seo/json-ld.tsx
import type { Graph, Thing, WithContext } from "schema-dts";

/** Balise JSON-LD rendue côté serveur. Échappe "<" (anti-XSS, recommandation Next.js). */
export function JsonLd({ data }: { data: Graph | WithContext<Thing> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
```

### 6.10 Layout racine

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { JsonLd } from "@/components/seo/json-ld";
import { ALLOW_INDEXING, SITE_URL } from "@/config/site";
import { getSiteContent } from "@/lib/content/get-site-content";
import { buildSiteGraph } from "@/lib/seo/json-ld";
import { homeMeta } from "@/lib/seo/metadata";
import "./globals.css";

/** ISR : régénération au plus toutes les heures (+ /api/revalidate pour publier tout de suite). */
export const revalidate = 3600;

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-jakarta" });

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  const { title, description } = homeMeta(c);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${c.practitioner.name}, ostéopathe à ${c.contact.locality}` },
    description,
    applicationName: `${c.practitioner.name} – ${c.practitioner.title}`,
    robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", locale: "fr_LU", siteName: `${c.practitioner.name} – ${c.practitioner.title}` },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false }, // numéros gérés via liens tel: explicites
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#2d5a4c", colorScheme: "light", viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const c = await getSiteContent();
  return (
    <html lang="fr-LU" className={jakarta.variable}>
      <head>
        <JsonLd data={buildSiteGraph(c)} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        {children}
        <MobileActionBar booking={c.booking} phoneE164={c.contact.phoneE164} phoneDisplay={c.contact.phoneDisplay} />
      </body>
    </html>
  );
}
```

En phase 2, écrire ce layout **sans** `MobileActionBar` (le composant arrive en phase 4) et ajouter :
`SkipLink` en premier enfant de `<body>`, `SiteHeader` avant `{children}`, `SiteFooter` après.
**Pas de `alternates.canonical` ici** (règle 9).

### 6.11 Métadonnées de la page d'accueil (extrait de `src/app/page.tsx`)

```tsx
// src/app/page.tsx (en-tête)
import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content/get-site-content";
import { homeMeta } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  const { title, description } = homeMeta(c);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { url: "/", title, description },
    twitter: { title, description },
  };
}
// Le composant de page rend <JsonLd data={buildHomeGraph(c, homeMeta(c))} /> puis les sections (§8).
```

### 6.12 Routes SEO et revalidation

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";
import { ALLOW_INDEXING, SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now },
    { url: `${SITE_URL}/confidentialite`, lastModified: now },
    // Phase 9 : ajouter les pages motifs publiées (lastModified = last_edited_time Notion).
  ];
}
```

```ts
// src/app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

/** Publication immédiate après une modif Notion : GET /api/revalidate?secret=… */
async function handle(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ revalidated: false, message: "Secret invalide" }, { status: 401 });
  }
  revalidatePath("/", "layout"); // toutes les pages (layout racine)
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}

export const GET = handle;
export const POST = handle;
```

```tsx
// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content/get-site-content";

export const alt = "Patrice Tchikaya, ostéopathe D.O. à Dudelange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const c = await getSiteContent();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#2d5a4c", color: "#fdfdfc" }}>
        <div style={{ fontSize: 32, opacity: 0.85 }}>{`${c.practitioner.title} • ${c.contact.locality}, Luxembourg`}</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 16 }}>{c.practitioner.name}</div>
        <div style={{ fontSize: 34, marginTop: 24, maxWidth: 900, opacity: 0.9 }}>{`Ostéopathe à ${c.contact.locality} – prise de rendez-vous en ligne`}</div>
      </div>
    ),
    size,
  );
}
```

Vérifié : image 1200×630, accents correctement rendus (police par défaut de `next/og`). La graisse 700 n'a pas
d'effet avec la police par défaut ; pour la marque exacte, charger un fichier **TTF** de Plus Jakarta Sans
(satori ne lit pas le woff2) — optionnel.

`src/app/icon.svg` (favicon, monogramme) :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2d5a4c"/><text x="32" y="41" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#fdfdfc" text-anchor="middle">PT</text></svg>
```

À ajouter sur le même modèle : `apple-icon.tsx` (ImageResponse 180×180, même monogramme) et `manifest.ts`
(`name`, `short_name`, `start_url: "/"`, `display: "browser"`, `background_color: "#fdfdfc"`,
`theme_color: "#2d5a4c"`, icône `/icon.svg`). Supprimer `src/app/favicon.ico`.

### 6.13 Script de contrôle SEO

```ts
// scripts/seo-smoke.ts
/**
 * Vérifications SEO/accessibilité de base sur le HTML réellement servi.
 * Usage : npm run build && npm start   puis   npm run seo:smoke [-- http://localhost:3000]
 */
import { parse } from "node-html-parser";

const base = (process.argv[2] ?? process.env.SMOKE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const failures: string[] = [];
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures.push(label);
};

async function main() {
  const res = await fetch(`${base}/`);
  check(res.status === 200, `GET / → ${res.status}`);
  const html = await res.text();
  const root = parse(html);

  check(root.querySelector("html")?.getAttribute("lang") === "fr-LU", `<html lang="fr-LU">`);
  const h1s = root.querySelectorAll("h1");
  check(h1s.length === 1, `un seul <h1> (trouvé : ${h1s.length})`);
  check(/Dudelange/i.test(h1s[0]?.text ?? ""), `le <h1> contient « Dudelange »`);

  const title = root.querySelector("title")?.text ?? "";
  check(title.length >= 30 && title.length <= 65, `<title> 30–65 car. (${title.length}) : ${title}`);
  const desc = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  check(desc.length >= 70 && desc.length <= 160, `meta description 70–160 car. (${desc.length})`);
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
  check(/^https:\/\//.test(canonical), `canonical absolue : ${canonical}`);
  check(Boolean(root.querySelector('meta[property="og:image"]')), "og:image présent");

  const imgs = root.querySelectorAll("img");
  check(imgs.every((i) => (i.getAttribute("alt") ?? "").trim().length > 0), `toutes les <img> ont un alt (${imgs.length})`);

  const graphs = root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => JSON.parse(s.textContent) as { "@graph"?: Array<Record<string, unknown>> });
  const types = graphs.flatMap((g) => g["@graph"] ?? []).flatMap((n) => [n["@type"]].flat() as string[]);
  for (const t of ["WebSite", "MedicalBusiness", "Person", "WebPage", "FAQPage"]) check(types.includes(t), `JSON-LD contient ${t}`);
  check(!types.includes("Physician") && !html.includes("AggregateRating"), "pas de Physician ni d'AggregateRating");
  const faq = graphs.flatMap((g) => g["@graph"] ?? []).find((n) => n["@type"] === "FAQPage") as
    | { mainEntity: Array<{ acceptedAnswer: { text: string } }> }
    | undefined;
  const visibleText = root.querySelector("main")?.text ?? "";
  check(Boolean(faq) && faq!.mainEntity.every((q) => visibleText.includes(q.acceptedAnswer.text.slice(0, 40))), "réponses FAQ visibles dans le HTML");

  const bookingLinks = root.querySelectorAll("a").filter((a) => /cal\.(eu|com)\//.test(a.getAttribute("href") ?? ""));
  check(bookingLinks.length >= 2, `liens RDV Cal.com présents dans le HTML (${bookingLinks.length})`);
  check(root.querySelectorAll('a[href^="tel:+352"]').length >= 1, "lien tel:+352… présent");

  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const r = await fetch(`${base}${path}`);
    check(r.status === 200, `GET ${path} → ${r.status}`);
  }
  const robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "(absente)";
  console.log(`ℹ meta robots : ${robotsMeta} (noindex attendu hors production)`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} échec(s).`);
    process.exit(1);
  }
  console.log("\nTout est vert.");
}

void main();
```

### 6.14 Composants UI de base

```tsx
// src/components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-sage-700 text-white shadow-sm hover:bg-sage-800",
        secondary: "border border-slate-200 bg-white text-ink hover:border-sage-300 hover:bg-sage-50",
        ghost: "text-ink hover:bg-sage-50",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

Les liens stylés en bouton utilisent `className={buttonVariants({ … })}` directement sur `<a>` / `BookingLink`.

```tsx
// src/components/ui/site-image.tsx
import Image from "next/image";
import type { SiteImage as SiteImageData } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = {
  image: SiteImageData;
  sizes: string;
  /** true uniquement pour l'image LCP (hero). Remplace `priority`, déprécié en Next 16. */
  preload?: boolean;
  className?: string;
  /** Rendu si aucune URL publique n'est renseignée dans Notion. */
  placeholder: React.ReactNode;
};

/** Seul point d'entrée pour les images Notion : alt Notion toujours injecté, jamais d'image cassée. */
export function SiteImage({ image, sizes, preload = false, className, placeholder }: Props) {
  if (!image.src) return <>{placeholder}</>;
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      preload={preload}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
```

```tsx
// src/components/sections/faq.tsx — ce fichier exporte FaqList (ci-dessous) ET la section Faq (spécifiée en §8.F)
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/content/types";

/**
 * Accordéon natif <details name> : réponses présentes dans le HTML (indexables),
 * 0 Ko de JS, accessible clavier. (Radix Accordion retire du DOM le contenu fermé.)
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {items.map((item, i) => (
        <details key={item.question} name="faq" className="faq-item group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sage-700 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold text-ink">{item.question}</h3>
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-sage-700 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="faq-answer px-6 pb-6 leading-relaxed text-slate-600">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
```

Vérifié dans Chromium 141 : au clic sur la question 2, la 1 se ferme (attribut `name`) ; la réponse fermée reste
dans le DOM ; `::details-content` et `interpolate-size` sont supportés (animation de hauteur). Ailleurs : ouverture
instantanée + fondu (amélioration progressive).

```tsx
// src/components/ui/reveal.tsx
"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Apparition au scroll — UNIQUEMENT sous la ligne de flottaison (jamais hero/LCP).
 * `data-reveal` + <noscript> du layout : contenu visible même sans JS.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          data-reveal=""
          className={className}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay }}
        >
          {children}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
```

```ts
// src/components/ui/motion-features.ts
import { domAnimation } from "motion/react";
export default domAnimation;
```

Règle d'usage : `Reveal` enveloppe des **cartes** (motifs, avis, expertises), jamais un `<h2>`, un paragraphe
d'introduction ou le hero.

---

## 7. Design system

### 7.1 Direction artistique

Premium, calme, médical sans froideur : fond blanc cassé, vert sauge profond (confiance), beaucoup d'air, coins
très arrondis, photos réelles du cabinet et du praticien (dès qu'elles existent), micro-animations discrètes.
Le site doit inspirer « praticien sérieux et humain », pas « clinique » ni « spa ».

**Inspirations Mobbin (à suivre pour la composition, pas pour copier) :**

| Zone | Référence | Ce qu'on reprend |
|---|---|---|
| Hero | [Ease — hero](https://mobbin.com/sites/sections/6695790f-7142-4e99-86a9-2632963b795d) | Palette vert profond + crème très proche de la nôtre, CTA pilule vert foncé, grille visuelle « carte menthe à motif de cercles concentriques + photo arrondie ». |
| Hero (carte flottante) | [Amigo — hero](https://mobbin.com/sites/sections/dcd77131-0901-4971-929e-00773c34a5f3) | Grande photo arrondie avec cartes d'information posées dessus. |
| À propos | [Kalstore — Meet the founder](https://mobbin.com/sites/sections/5e1e6047-eef1-417c-b42b-c7ab44205e35) | Bloc vert sauge avec texte blanc à côté du portrait, même hauteur. |
| Motifs | [Fibery — cartes](https://mobbin.com/sites/sections/8354be46-ea56-48e0-9057-617a0caff0db) | Icône dans une pastille colorée, titre, texte court, cartes blanches aérées. |
| Avis | [Analogue Agency — Google reviews](https://mobbin.com/sites/sections/180dbf78-b891-48df-a7d7-c0e5265481bc) · [Contractbook](https://mobbin.com/sites/sections/80979b66-6621-418c-8c32-c04371cfc94d) · [Glide](https://mobbin.com/sites/sections/cd91f921-bd4d-4055-af4b-5a5e3b4cdbc1) | En-tête « avis » + lien « tous les avis → », rangée de cartes (étoiles, texte, nom, date), résumé « ★ 5,0 ». |
| FAQ | [Wix — FAQ](https://mobbin.com/sites/sections/18fba4cd-6780-4dcc-9194-9c489635759c) · [Lattice — FAQ](https://mobbin.com/sites/sections/1c9412fe-a762-483c-9993-125a46164b6b) | Titre + « une autre question ? » à gauche, accordéon à droite ; items doux arrondis. |
| Agenda inline | [Shade — Book a demo](https://mobbin.com/sites/sections/ab7d0b16-d140-4c85-ae4f-788e1946e591) | Agenda de type Cal.com intégré dans une carte, contexte à côté. |
| Barre mobile | [Fresha — Book now](https://mobbin.com/screens/3206f2b1-cf79-4213-ab4a-7cb71e3d1bb8) | Bouton pleine largeur fixé en bas, au-dessus du contenu. |

### 7.2 Jetons (Tailwind v4, `src/app/globals.css`)

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: #fdfdfc;
  --color-ink: #0f172a;
  --color-sage-50: #f3f7f5;
  --color-sage-100: #e8f0ec; /* vert menthe du brief */
  --color-sage-200: #cfe0d7;
  --color-sage-300: #a9c7b8;
  --color-sage-400: #7aa592;
  --color-sage-500: #4f8570;
  --color-sage-600: #3a6e5c;
  --color-sage-700: #2d5a4c; /* primaire du brief */
  --color-sage-800: #244a3e;
  --color-sage-900: #1d3b32;
  --color-sage-950: #10231d;
}

@theme inline {
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  :root {
    interpolate-size: allow-keywords; /* animation hauteur auto (Chromium) */
  }
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 5rem; /* hauteur du header sticky */
  }
  body {
    @apply bg-background font-sans text-slate-700 antialiased;
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
  }
}

/* FAQ : ouverture animée (progressive enhancement, sans JS) */
.faq-item::details-content {
  block-size: 0;
  overflow-y: clip;
  transition: block-size 300ms ease, content-visibility 300ms allow-discrete;
}
.faq-item[open]::details-content {
  block-size: auto;
}
.faq-item[open] .faq-answer {
  animation: faq-in 250ms ease-out;
}
@keyframes faq-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .faq-item::details-content { transition: none; }
  .faq-item[open] .faq-answer { animation: none; }
}
```

Correspondance brief → jetons : fond `#FDFDFC` = `bg-background` ; cartes `bg-white border-slate-200/80 rounded-2xl` ;
primaire `#2D5A4C` = `sage-700` ; titres `#0F172A` = `text-ink` ; fonds de badges `#E8F0EC` = `bg-sage-100`.
Tailwind 4.3 génère aussi les classes arbitraires entières (`h-13`, `w-13`) — vérifié. Préférer `bg-linear-to-br`
(nom v4) ; l'ancien `bg-gradient-to-br` fonctionne encore.

### 7.3 Contrastes (calculés, WCAG 2.2)

| Texte / fond | Ratio | Usage autorisé |
|---|---|---|
| blanc sur `sage-700` | 7,8:1 | boutons primaires, bloc « À propos » |
| `sage-700` sur `background` | 7,7:1 | liens, icônes, eyebrows |
| `sage-700` sur `sage-100` | 6,8:1 | badges |
| `sage-100` sur `sage-700` | 6,8:1 | texte secondaire dans le bloc sauge |
| `slate-600` sur `background` | ≈ 7,4:1 | texte courant |
| `slate-500` sur `background` | ≈ 4,7:1 | texte secondaire ≥ 14 px uniquement |
| `sage-100` sur `sage-900` | ≈ 10,5:1 | footer |

Étoiles `amber-400` : décoratives (`aria-hidden`), la note est toujours écrite en texte.

### 7.4 Typographie

Police unique : **Plus Jakarta Sans** (variable, sous-ensemble latin ≈ 27 Ko, préchargée par `next/font`,
`display: swap` ; `display: optional` testé : pas de gain significatif).

| Élément | Classes |
|---|---|
| H1 | `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink text-balance` |
| H2 | `text-3xl md:text-4xl font-bold tracking-tight text-ink text-balance` |
| H3 | `text-lg font-semibold text-ink` |
| Eyebrow | `text-sm font-semibold uppercase tracking-[0.14em] text-sage-700` |
| Paragraphe d'accroche | `text-lg text-slate-600 text-pretty` |
| Texte courant | `text-base leading-relaxed text-slate-600` |
| Petit texte | `text-sm text-slate-500` |

### 7.5 Mise en page

- Conteneur : `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`.
- Sections : `py-16 md:py-24` (brief : `py-20` à `py-24` sur desktop).
- Cartes : `rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8` ; survol :
  `transition hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-md motion-reduce:transform-none`.
- Images : `rounded-3xl overflow-hidden bg-sage-100` (la couleur de fond sert de placeholder de chargement).
- Carte flottante : `rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5`.
- Cibles tactiles ≥ 44 px (`h-11` minimum pour tout élément cliquable principal).

### 7.6 Composants UI à écrire (spécification)

- `Section({ id, labelledBy, className, children })` : `<section id aria-labelledby>` + conteneur.
- `Eyebrow({ children })` : `<p>` avec les classes eyebrow.
- `StarRating({ value })` : 5 × `Star` Lucide (`fill-amber-400 text-amber-400` / `fill-slate-200 text-slate-200`),
  tous `aria-hidden`, + `<span className="sr-only">Note : {formatRating(value)} sur 5</span>`.
- `ImagePlaceholder({ monogram = "PT" })` : `aria-hidden`, fond `bg-linear-to-br from-sage-100 via-sage-50 to-white`,
  SVG de 5 cercles concentriques (`stroke` `sage-300`, esprit « Ease ») et monogramme `text-6xl font-extrabold
  text-sage-700/80`. Doit paraître **intentionnel**, jamais « image manquante ».
- `SkipLink` : `<a href="#contenu" className="sr-only focus:not-sr-only …">Aller au contenu</a>`.

### 7.7 Micro-copie d'interface

Tous les libellés d'interface vivent dans `src/content/ui-copy.ts` (pas dans les composants) :

```ts
// src/content/ui-copy.ts (proposition — ajuster librement le ton, pas la structure)
export const NAV = [
  { href: "/#a-propos", label: "À propos" },
  { href: "/#motifs", label: "Motifs" },
  { href: "/#infos", label: "Infos & Tarifs" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const COPY = {
  skipLink: "Aller au contenu",
  cta: { book: "Prendre rendez-vous en ligne", bookShort: "Prendre RDV", bookMobile: "Prendre rendez-vous" },
  hero: {
    ratingSuffix: "sur Google Reviews",
    reassurance: ["Sans ordonnance", "Facture pour votre mutuelle"], // + « Séance de {durée} » calculé
    cardSubtitle: "Sur rendez-vous · sans ordonnance",
  },
  about: { eyebrow: "À propos" },
  motifs: {
    eyebrow: "Motifs de consultation",
    title: (city: string) => `Pourquoi consulter un ostéopathe à ${city} ?`,
    intro: (city: string) =>
      `Au cabinet de ${city}, chaque séance commence par un bilan complet pour traiter la cause de la douleur, pas seulement le symptôme.`,
    helpLine: "Un doute sur votre situation ? Appelez le cabinet :",
  },
  reviews: {
    eyebrow: "Avis patients",
    title: "Ce qu'en disent les patients",
    source: "Avis Google",
    seeAll: "Voir tous les avis sur Google",
    leaveReview: "Laisser un avis",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes sur l'ostéopathie",
    helpTitle: "Vous ne trouvez pas votre réponse ?",
    helpText: "Appelez le cabinet, nous vous répondrons avec plaisir.",
  },
  infos: {
    eyebrow: "Infos pratiques",
    title: "Infos pratiques, accès & tarifs",
    labels: {
      address: "Adresse", phone: "Téléphone", duration: "Durée", price: "Tarif",
      reimbursement: "Remboursement", hours: "Horaires", access: "Accès", languages: "Langues",
    },
    directions: "Itinéraire",
    map: "Voir sur Google Maps",
    bookingTitle: "Réserver votre séance en ligne",
    bookingText: "Choisissez un créneau : la confirmation vous est envoyée par e-mail.",
    bookingFallback: "Ouvrir l'agenda dans un nouvel onglet",
  },
  footer: { legal: "Mentions légales", privacy: "Confidentialité" },
  newTab: "(nouvel onglet)",
} as const;
```

---

## 8. Spécification des sections et pages

Ordre dans `page.tsx` : `Hero` → `About` → `Motifs` → `Reviews` → `Faq` → `PracticalInfo`. `SiteHeader`,
`SiteFooter` et `MobileActionBar` sont dans le layout. Toutes les sections sont des **Server Components** qui
reçoivent `content: SiteContent` (ou une partie) en props, obtenu via `getSiteContent()` dans `page.tsx`.

Maquette (desktop ; les emoji ne sont qu'un raccourci visuel, utiliser Lucide) :

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ Patrice Tchikaya • Ostéopathe D.O.    À propos  Motifs  Infos & Tarifs  FAQ   (📍 Dudelange) [Prendre RDV] │ header sticky verre dépoli
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ (★ 5,0/5 sur Google Reviews • Cabinet à Dudelange)            ┌──────────────────┐        │
│ H1  Ostéopathe à Dudelange – Patrice Tchikaya                  │  photo hero 4:5  │        │
│ Sous-titre (Notion)                                            │  (ou placeholder) │        │
│ [📅 Prendre rendez-vous en ligne]  [☎ Appeler le +352 51 92 92]│                  │        │
│ ✓ Sans ordonnance  ✓ Séance de 45 minutes  ✓ Facture mutuelle  └──┬───────────────┘        │
│                                                     [⏱ Consultation 45 min · sans ordonnance]│
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌──────────────── bloc sauge (texte blanc) ─────────────────┐               │
│ │ portrait  │ │ À PROPOS · H2 · bio courte · bio détaillée · formation      │               │
│ └───────────┘ └───────────────────────────────────────────────────────────┘               │
│ [🏆 Handball haut niveau]  [💼 Ancien cadre supérieur]  [✔ Ostéopathe D.O.]                  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ MOTIFS · H2 « Pourquoi consulter un ostéopathe à Dudelange ? » · intro                     │
│ [carte Sport]           [carte Posture & Vie Pro]                                          │
│ [carte Traumatologie]   [carte Bilan préventif]                                            │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ AVIS · H2                                        [ 5,0  ★★★★★  Note Google ]               │
│ [avis]  [avis]  [avis]                           [Voir tous les avis sur Google ↗]         │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ FAQ · H2 · « Vous ne trouvez pas… » · ☎        │  ▸ question 1 (ouverte)                   │
│ (colonne collante)                             │  ▸ question 2 …                           │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ INFOS PRATIQUES (carte : photo cabinet, dl)    │  AGENDA Cal.com inline (#rendez-vous)     │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ footer sauge foncé : identité · NAP + horaires · liens · © · mentions                      │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### A. Header — `site-header.tsx`

- `<header id="site-header" className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">`,
  hauteur `h-16`.
- Gauche : `<Link href="/">` avec `<span className="font-bold text-ink">{name}</span>` +
  `<span className="text-sm text-slate-500">• {title}</span>` (sur mobile, le titre passe sous le nom).
  **Ce n'est pas un `<h1>`.**
- Centre (`hidden lg:block`) : `<nav aria-label="Navigation principale">` + `<ul>` des 4 ancres `NAV`
  (`/#a-propos`, `/#motifs`, `/#infos`, `/#faq` : fonctionnent aussi depuis les pages légales). Balises `<a>`
  (pas besoin de JS).
- Droite : badge `<a href="/#infos">` `hidden sm:inline-flex rounded-full bg-sage-100 px-3 py-1.5 text-sm
  font-medium text-sage-800` avec `MapPin` + ville ; puis `BookingLink` `buttonVariants({ size: "sm" })`
  « Prendre RDV ».
- Pas de menu burger (la barre mobile porte la conversion ; moins de JS).

### B. Hero — `hero.tsx`

- `<section aria-labelledby="hero-title">`, 2 colonnes à partir de `lg` (texte 7/12, visuel 5/12), `items-center`,
  `pt-10 pb-16 lg:py-20`.
- **Badge** (`<a href="#avis">`, pilule `bg-sage-100 text-sage-800 text-sm`) : si `content.rating` →
  `Star` ambre + « {formatRating(value)}/5 {COPY.hero.ratingSuffix} » + « • » ; puis « Cabinet à {locality} ».
  Sans note Notion → seulement « Cabinet à {locality} ».
- **H1** `id="hero-title"` = `content.seo.h1` (Notion).
- **Sous-titre** = `content.seo.heroSubtitle`.
- **CTA** dans `<div id="hero-cta" className="mt-8 flex flex-col gap-3 sm:flex-row">` (l'id sert à la barre
  mobile) : `BookingLink` primaire `size lg` avec `CalendarDays` + « Prendre rendez-vous en ligne » ; lien
  `tel:{phoneE164}` secondaire `size lg` avec `Phone` + « Appeler le {phoneDisplay} ».
- **Réassurance** : liste `flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600` avec `CircleCheck`
  `text-sage-700` : « Sans ordonnance », « Séance de {durationLabel} », « Facture pour votre mutuelle ».
- **Visuel** : `relative` ; cadre `aspect-[4/3] lg:aspect-[4/5] overflow-hidden rounded-3xl bg-sage-100` ;
  `SiteImage` avec `image = images.hero.src ? images.hero : images.portrait`, `preload`,
  `sizes="(min-width: 1024px) 40vw, 100vw"`, `placeholder={<ImagePlaceholder />}`. Optionnel : forme menthe
  décorative derrière (`absolute -inset-3 -z-10 rotate-2 rounded-[2rem] bg-sage-100`).
- **Carte flottante** (brief) : `absolute -bottom-6 left-4 sm:left-6`, icône `Clock` dans une pastille
  `bg-sage-100`, titre « Consultation {durationMinutes} min », sous-titre `COPY.hero.cardSubtitle`.
- **Aucune animation** (LCP). Seules transitions CSS de survol sur les boutons.

### C. À propos (E-E-A-T) — `about.tsx`

- `<Section id="a-propos" labelledBy="about-title">`.
- Grille `lg:grid-cols-12 gap-6` :
  - Portrait (`lg:col-span-5`) : `aspect-[4/5] rounded-3xl`, `SiteImage images.portrait`,
    `sizes="(min-width: 1024px) 40vw, 100vw"` (pas de `preload`), placeholder monogramme.
  - Bloc (`lg:col-span-7`) `rounded-3xl bg-sage-700 p-8 md:p-12 text-white flex flex-col justify-center` :
    eyebrow `text-sage-100` « À propos » ; `<h2 id="about-title">` = `about.title` (blanc) ;
    `<p className="text-lg text-sage-50">` = `about.shortBio` ; `<p className="text-sage-100">` = `about.longBio`
    (découper sur les doubles retours à la ligne) ; si `about.education` : ligne avec `GraduationCap`.
- Sous la grille : `<ul className="mt-6 grid gap-6 md:grid-cols-3">` des `about.expertises` (3 par défaut) : carte
  blanche, icône par index `[Trophy, Briefcase, BadgeCheck]` dans pastille `bg-sage-100 text-sage-700`,
  `<h3>` + texte. Enveloppées dans `Reveal` (délai `i * 0.08`).
- Suggestion de contenu (§18) : mentionner « successeur de Daniel Leiner au cabinet de Dudelange » si Patrice
  l'accepte (un avis le mentionne ; requête de marque probable des anciens patients).

### D. Motifs de consultation — `motifs.tsx`

- `<Section id="motifs" labelledBy="motifs-title">` ; eyebrow ; `<h2 id="motifs-title">` =
  `COPY.motifs.title(locality)` ; intro `COPY.motifs.intro(locality)`.
- `<ul className="mt-10 grid gap-6 sm:grid-cols-2">` (2×2 avec 4 motifs, toute quantité supportée) :
  - `<li>` → `Reveal` (délai `i * 0.08`) → `<article>` carte blanche avec survol ;
  - icône : `const Icon = MOTIF_ICONS[motif.icon as MotifIconName]` dans
    `grid size-12 place-items-center rounded-xl bg-sage-100 text-sage-700` ;
  - `<h3>` = `motif.title` ; `<p>` = `motif.description` ;
  - **Phase 9 seulement** : lien « Découvrir : {title} » vers `/{slug}` si la page existe. Jamais « En savoir
    plus » seul (Lighthouse SEO signale les textes de lien non descriptifs).
- Sous la grille : ligne `COPY.motifs.helpLine` + lien `tel:`.

### E. Preuve sociale & avis — `reviews.tsx`

- Masquer toute la section si `content.reviews.length === 0`.
- `<Section id="avis" labelledBy="reviews-title">` ; en-tête `flex flex-col gap-6 md:flex-row md:items-end
  md:justify-between` : à gauche eyebrow + `<h2 id="reviews-title">` ; à droite (si `content.rating`) carte
  résumé : `<p className="text-5xl font-extrabold text-ink">{formatRating(value)}</p>` + `StarRating` +
  « Note Google » + « ({count} avis) » si `count`.
- Liste : mobile = défilement horizontal CSS (`flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4`,
  cartes `w-[85%] shrink-0 snap-start`) ; `md:grid md:grid-cols-3 md:overflow-visible`. Le conteneur défilant
  reçoit `tabIndex={0}` + `aria-label="Avis patients"` (règle axe « scrollable-region-focusable »).
- Carte = `<figure>` : `StarRating` (si `rating !== null`) ; `<blockquote>` texte complet (pas de troncature :
  contenu visible et indexable) ; `<figcaption>` : auteur (`font-semibold text-ink`) · `formatReviewDate(date)` ·
  « Avis Google ». Cartes enveloppées dans `Reveal`.
- Boutons (si `googleBusinessUrl`) : « Voir tous les avis sur Google » (secondaire, `ArrowUpRight`,
  `target="_blank" rel="noopener"`, `<span className="sr-only"> (nouvel onglet)</span>`) ; lien texte
  « Laisser un avis » vers `{googleBusinessUrl}/review` uniquement si l'URL est de la forme `https://g.page/r/…`.
- **Aucun JSON-LD d'avis** (règle 7).

### F. FAQ — `faq.tsx`

- `<Section id="faq" labelledBy="faq-title">`, grille `lg:grid-cols-12 gap-10` :
  - Gauche `lg:col-span-4 lg:sticky lg:top-24 self-start` : eyebrow, `<h2 id="faq-title">`, bloc
    `COPY.faq.helpTitle` / `helpText` + lien `tel:` + `BookingLink` (variante `ghost`).
  - Droite `lg:col-span-8` : `FaqList items={content.faq}` (§6.14).
- Le JSON-LD `FAQPage` est produit par `buildHomeGraph` à partir des **mêmes** données.

### G. Infos pratiques & RDV — `practical-info.tsx`

- `<Section id="infos" labelledBy="infos-title">`, grille `lg:grid-cols-2 gap-8`.
- Gauche : carte blanche. En haut, si `images.cabinet.src` : photo `aspect-[3/2] rounded-2xl`
  (`sizes="(min-width: 1024px) 45vw, 100vw"`). Puis eyebrow + `<h2 id="infos-title">`. Puis `<dl>` en lignes
  `grid grid-cols-[auto_1fr] gap-x-4 gap-y-5`, chaque `<dt>` = icône + libellé `COPY.infos.labels` :
  - Adresse (`MapPin`) : `<address className="not-italic">` rue, code postal + ville ; liens « Itinéraire »
    (`googleMapsDirectionsUrl`, `Navigation`) et « Voir sur Google Maps » (`googleBusinessUrl` sinon
    `googleMapsSearchUrl`), nouvel onglet.
  - Téléphone (`Phone`) : `<a href="tel:…">`.
  - Durée (`Clock`) : `durationLabel`.
  - Tarif (`Euro`) : **seulement si** `consultation.price`.
  - Remboursement (`Receipt`) : `consultation.reimbursement`.
  - Horaires (`CalendarDays`) : si `openingHours` → `formatOpeningHours()` (une ligne par plage).
  - Accès (`Car`) : si `access`. Langues (`Languages`) : si `languages.length`.
- Droite `id="rendez-vous"` : `<h3>` `COPY.infos.bookingTitle`, texte `bookingText`, `BookingInline`
  (§9.2), et sous l'agenda un lien texte `COPY.infos.bookingFallback` (`target="_blank"`).
- **Pas d'iframe Google Maps** (poids, cookies). Option V2 : façade « Afficher la carte » qui charge l'iframe au clic.

### H. Barre d'action mobile — `mobile-action-bar.tsx` (dans le layout)

```tsx
// src/components/layout/mobile-action-bar.tsx
"use client";

import { CalendarDays, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { BookingLink } from "@/components/booking/booking-link";
import { buttonVariants } from "@/components/ui/button";
import type { SiteContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = { booking: SiteContent["booking"]; phoneE164: string; phoneDisplay: string };

/** Barre fixe mobile (< md) : visible quand le déclencheur (CTA hero / h1) ET l'agenda inline sont hors écran. */
export function MobileActionBar({ booking, phoneE164, phoneDisplay }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déclencheur : CTA du hero (accueil) ou, à défaut, le <h1> de la page (pages légales…).
    const trigger = document.getElementById("hero-cta") ?? document.querySelector("main h1");
    const inline = document.getElementById("rendez-vous");
    if (!trigger) return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
      setVisible(!seen.get(trigger) && !(inline && seen.get(inline)));
    });
    io.observe(trigger);
    if (inline) io.observe(inline);
    return () => io.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex gap-3">
        <BookingLink booking={booking} className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
          <CalendarDays aria-hidden="true" /> Prendre rendez-vous
        </BookingLink>
        <a
          href={`tel:${phoneE164}`}
          aria-label={`Appeler le cabinet au ${phoneDisplay}`}
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-13 px-0")}
        >
          <Phone aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
```

- Le brief demande un grand bouton « Prendre rendez-vous » ; le bouton d'appel (icône) est un ajout recommandé
  (l'appel est une conversion majeure en local). `viewportFit: "cover"` (layout) rend `safe-area-inset-bottom`
  effectif sur iPhone.
- Ajouter `pb-28 md:pb-0` au footer pour que la barre ne masque jamais le bas de page.

### I. Footer — `site-footer.tsx`

- `<footer className="bg-sage-900 text-sage-100">`, 3 colonnes `md:grid-cols-3` :
  1. Nom + titre + une phrase (`about.shortBio`) ;
  2. « Cabinet » : `<address className="not-italic">` NAP complet (même libellé exact que la fiche Google) +
     `tel:` + horaires si présents ;
  3. « Liens » : ancres `NAV`, fiche Google (nouvel onglet), `/mentions-legales`, `/confidentialite`.
- Bas : « © {année} {name} – {title} ». Liens soulignés au survol, contraste §7.3.

### J. Pages secondaires

- `mentions-legales/page.tsx` et `confidentialite/page.tsx` : Server Components, `<main id="contenu">`, un `<h1>`,
  prose `max-w-3xl`. `metadata` : `title` (« Mentions légales »), `alternates.canonical` propre à la page.
  Contenu (données tirées de `SiteContent` + champs `[À COMPLÉTER : …]`) :
  - **Mentions légales (Luxembourg)** : éditeur (nom, adresse, téléphone, e-mail) ; profession réglementée :
    ostéopathe, autorisation d'exercer délivrée par le ministre de la Santé (Luxembourg), cadre : loi modifiée du
    26 mars 1992 sur l'exercice et la revalorisation de certaines professions de santé ; n° TVA/matricule si
    applicable ; hébergeur : Vercel Inc. (adresse à reprendre de vercel.com/legal) ; crédits photos.
  - **Confidentialité** : aucune donnée collectée par le site lui-même (pas de formulaire, pas de cookie) ; prise
    de RDV traitée par Cal.com (instance UE) ; mesure d'audience sans cookie si activée ; droits RGPD ; autorité :
    CNPD (Commission nationale pour la protection des données, Luxembourg).
  - **Critère de mise en ligne :** `grep -R "À COMPLÉTER" src` ne retourne plus rien.
- `not-found.tsx` : `<h1>` « Page introuvable », lien vers l'accueil, `BookingLink`.

---

## 9. Prise de rendez-vous Cal.com

### 9.1 Faits vérifiés

- Le compte est sur l'instance **UE** (`cal.eu/patrice-tchikaya-pro/consultation`). Sans `calOrigin`, l'embed React
  vise `app.cal.com` et affiche « 404 – Cal Link seems to be wrong » ; la correction est
  `calOrigin="https://app.cal.eu"` (issue GitHub calcom/cal.diy #28443 + lecture du code d'`embed-core`).
- `@calcom/embed-react` 1.5.3 : `getCalApi({ namespace })` initialise le namespace **sans** origine, et le 1er
  `init` d'un namespace l'emporte. D'où **deux namespaces** : `rdv-popup` (popup, origine passée à chaque
  `modal`) et `rdv-inline` (composant `Cal`, qui fait lui-même `init` avec `origin`). Ne jamais appeler
  `getCalApi({ namespace: "rdv-inline" })`.
- `getCalApi()` se résout **avant** que `embed.js` soit exécuté (file d'attente). `embed.js` pose
  `window.Cal.version` une fois chargé : on l'attend pour décider du repli.
- `embed.js` (≈ 66 Ko non compressé dans le paquet npm 1.5.3) est servi par `app.cal.com/embed/embed.js`.

### 9.2 Code de référence (validé)

```ts
// src/components/booking/cal.ts
import { getCalApi } from "@calcom/embed-react";

/** Namespaces distincts : le 1er `init` d'un namespace fige son origine (cf. code de embed-react). */
export const CAL_POPUP_NAMESPACE = "rdv-popup";
export const CAL_INLINE_NAMESPACE = "rdv-inline";
export const CAL_CONFIG = { layout: "month_view", theme: "light" } as const;

let popupApi: ReturnType<typeof getCalApi> | null = null;

/** Injecte embed.js (une seule fois) et renvoie l'API du namespace popup. */
export function loadCalPopup() {
  popupApi ??= getCalApi({ namespace: CAL_POPUP_NAMESPACE });
  return popupApi;
}

/**
 * getCalApi() se résout AVANT que embed.js soit exécuté (file d'attente).
 * embed.js pose window.Cal.version quand il est réellement chargé : on l'attend,
 * sinon (bloqueur, réseau) on rejette pour basculer sur le lien direct.
 */
export function waitForCalScript(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.Cal?.version) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("Cal.com embed indisponible"));
      setTimeout(tick, 100);
    };
    tick();
  });
}
```

```tsx
// src/components/booking/booking-link.tsx
"use client";

import type { ComponentProps, MouseEvent } from "react";
import type { SiteContent } from "@/lib/content/types";
import { CAL_CONFIG, loadCalPopup, waitForCalScript } from "./cal";

type BookingLinkProps = Omit<ComponentProps<"a">, "href"> & { booking: SiteContent["booking"] };

/**
 * Vrai lien <a href="https://cal.eu/…"> amélioré progressivement :
 * - sans JS, clic molette/Ctrl, ou embed indisponible → page Cal.com (aucune perte de RDV) ;
 * - sinon → popup Cal.com (origine UE passée explicitement à chaque ouverture).
 */
export function BookingLink({ booking, onClick, children, ...props }: BookingLinkProps) {
  const warm = () => void loadCalPopup().catch(() => {});

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      const cal = await loadCalPopup();
      await waitForCalScript(5000);
      cal("modal", { calLink: booking.calLink, calOrigin: booking.calOrigin, config: { ...CAL_CONFIG } });
    } catch {
      window.location.assign(booking.url);
    }
  }

  return (
    <a href={booking.url} onClick={handleClick} onPointerEnter={warm} onFocus={warm} onTouchStart={warm} {...props}>
      {children}
    </a>
  );
}
```

```tsx
// src/components/booking/booking-inline.tsx
"use client";

import Cal from "@calcom/embed-react";
import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/lib/content/types";
import { CAL_CONFIG, CAL_INLINE_NAMESPACE, waitForCalScript } from "./cal";

type Status = "idle" | "loading" | "ready" | "failed";

/** Agenda inline : monté seulement à l'approche de la section (aucun coût au chargement initial). */
export function BookingInline({ booking }: { booking: SiteContent["booking"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setStatus("loading");
        waitForCalScript(10_000).then(
          () => setStatus("ready"),
          () => setStatus("failed"),
        );
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative min-h-[720px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {status !== "idle" && status !== "failed" && (
        <Cal
          namespace={CAL_INLINE_NAMESPACE}
          calLink={booking.calLink}
          calOrigin={booking.calOrigin}
          config={{ ...CAL_CONFIG }}
          style={{ width: "100%", height: "100%", minHeight: 720, overflow: "auto" }}
        />
      )}
      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-600">
          {status === "failed" ? (
            <>
              <p>L’agenda n’a pas pu se charger ici.</p>
              <a href={booking.url} className="font-semibold text-sage-700 underline underline-offset-4">
                Ouvrir l’agenda de réservation
              </a>
            </>
          ) : (
            <>
              <div className="size-10 animate-pulse rounded-full bg-sage-100" aria-hidden="true" />
              <p className="text-sm">Chargement de l’agenda…</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### 9.3 Comportements vérifiés dans le prototype (Chromium 141, embed bloqué par le réseau)

- **0 requête Cal.com au chargement** de la page (aucun impact Lighthouse).
- `embed.js` n'est demandé qu'à l'approche de l'agenda ou à l'intention sur un CTA.
- Embed indisponible → l'agenda affiche le message de repli et le lien ; un clic sur un CTA **navigue vers
  `https://cal.eu/…`** après ≤ 5 s.
- **Non vérifiable ici** (domaines bloqués) : ouverture réelle de la popup et de l'agenda UE. À tester sur la
  preview Vercel : l'iframe doit pointer vers `app.cal.eu/patrice-tchikaya-pro/consultation/embed…`. En cas de
  doute, comparer avec le code généré par le bouton « Embed » du tableau de bord Cal.com (Event types →
  consultation → Embed).

### 9.4 Réglages Cal.com (action humaine)

- Paramètres → Apparence → **couleur de marque `#2D5A4C`** : s'applique aussi aux embeds (évite tout appel
  `cal("ui")` risqué côté code).
- Vérifier l'événement « consultation » (45 min), les rappels e-mail et la politique d'annulation.

---

## 10. SEO

### 10.1 Stratégie

- **Requête principale :** « ostéopathe Dudelange » (et « osteopathe Dudelange » sans accent).
- **Secondaires, à intégrer naturellement dans le contenu** : ostéopathe du sport, mal de dos, lumbago, sciatique,
  cervicalgie, TMS / travail sur écran, bilan ostéopathique, « ostéopathe sans ordonnance », « remboursement
  ostéopathe Luxembourg ». Je n'ai **pas** de données de volume : à valider avec Google Search Console après
  lancement (et éventuellement Keyword Planner).
- Localités proches (Bettembourg, Kayl, Rumelange, Esch-sur-Alzette ; côté français Volmerange-les-Mines,
  Zoufftgen) : seulement dans des phrases vraies (ex. accès), jamais en liste de mots-clés.
- Allemand/anglais (« Osteopath Düdelingen », « osteopath Dudelange ») : public réel au Luxembourg → version
  DE/EN recommandée plus tard (hors périmètre).

### 10.2 Métadonnées

- `<title>` et description : `homeMeta()` (§6.9), surchargeables par `Meta_Title` / `Meta_Description` dans Notion.
- `canonical` par page (règle 9). `metadataBase` = `SITE_URL`.
- `robots` : `index, follow` seulement si `ALLOW_INDEXING` (production Vercel) ; `robots.txt` renvoie
  `Disallow: /` sur les previews.
- Open Graph / Twitter : image générée (`opengraph-image.tsx`), `og:locale fr_LU`.
- `lang="fr-LU"` sur `<html>`.

### 10.3 Données structurées

- Graphe global (layout) : `WebSite` → `publisher` → `["MedicalBusiness", "MedicalOrganization"]` (adresse, géo,
  téléphone, `priceRange`, `medicalSpecialty` Musculoskeletal, `isAcceptingNewPatients`, horaires si connus,
  `sameAs`, `ReserveAction` vers Cal.com, catalogue des motifs) ← `Person` (`worksFor`, `jobTitle`, `knowsAbout`,
  `knowsLanguage`).
- Graphe de page : `WebPage` + `FAQPage` (mêmes données que la FAQ visible).
- Validation après déploiement : https://validator.schema.org (0 erreur) et le test des résultats enrichis de
  Google (le JSON-LD doit être détecté ; pas de résultat enrichi attendu, cf. §2.1).

### 10.4 Contenu on-page

- 1 `<h1>` (Notion `Titre_SEO_H1`), `<h2>` par section, `<h3>` pour cartes/questions.
- NAP (nom, adresse, téléphone) écrit en texte dans le HTML (header, infos pratiques, footer), **strictement
  identique** à la fiche Google.
- Liens internes descriptifs ; liens externes `rel="noopener"` + mention « (nouvel onglet) » en `sr-only`.
- `alt` des images : ceux de Notion (déjà descriptifs et localisés).
- Aucune information importante uniquement dans une image ou derrière du JS.

### 10.5 Moteurs génératifs (IA)

HTML propre, FAQ visible, JSON-LD cohérent et NAP homogène sont ce qui aide le plus. `llms.txt` : optionnel, sans
effet démontré à ce jour.

---

## 11. Performance

### 11.1 Mesures du prototype (Lighthouse 13.5.0, Chromium 141, `next start` local, contenu de secours)

| | Mobile | Desktop |
|---|---|---|
| Performance (runs successifs) | 96, 99, 98 (base) · 98, 99, 99 (avec Motion) | 100 |
| LCP | 1,8 – 2,4 s (élément LCP : sous-titre du hero) | 0,5 s |
| TBT | 50 – 160 ms | 0 ms |
| CLS | 0 | 0 |
| Accessibilité / Bonnes pratiques / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| JS transféré | 148 Ko (sans Motion) · 181 Ko (avec Motion + LazyMotion) | idem |

Limites honnêtes : le prototype n'avait pas encore de vraie photo hero ni toutes les sections ; le score mobile
varie de ±2 points d'un run à l'autre. **Objectif : médiane ≥ 98 sur 5 runs mobiles, 100 desktop.** Sur Vercel
(CDN, Brotli), les résultats sont généralement au moins aussi bons qu'en local.

### 11.2 Règles

1. Pages statiques (ISR) ; aucune API dynamique dans les pages.
2. Une seule image `preload` : celle du hero. Toutes les autres en lazy (défaut) avec `sizes` exact.
3. Formats AVIF/WebP (config). Images sources raisonnables (≤ 2400 px de large) ; image hero servie ≤ 120 Ko.
4. Police : un seul fichier variable latin (≈ 27 Ko), préchargé, `swap`, métriques de repli auto (`next/font`).
5. Client JS limité aux 4 composants de la règle 1. Motion via `LazyMotion` asynchrone, jamais au-dessus de la
   ligne de flottaison.
6. Cal.com : zéro octet au chargement (§9.3). Pas de Google Maps, pas d'analytics avec cookies.
7. CLS : dimensions fixes (`aspect-*`) sur tous les conteneurs d'images, `min-h-[720px]` sur l'agenda.
8. Budgets : JS transféré ≤ 190 Ko, CSS ≤ 15 Ko, HTML de la page ≤ 80 Ko.

---

## 12. Accessibilité (WCAG 2.2 AA)

- Lien d'évitement, repères (`header`, `nav[aria-label]`, `main#contenu`, `footer`), sections avec
  `aria-labelledby`.
- Hiérarchie de titres sans saut. Un seul `<h1>`.
- Contrastes §7.3. Focus visible partout (`focus-visible:outline-2 outline-sage-700`).
- Icônes décoratives `aria-hidden` ; boutons icône avec `aria-label`.
- Note en étoiles doublée d'un texte `sr-only`.
- Liens `tel:` explicites (« Appeler le cabinet au … »).
- Zone de défilement des avis focusable (`tabIndex={0}`, `aria-label`).
- Barre mobile masquée = `inert` (non focusable).
- `prefers-reduced-motion` : transitions et animations neutralisées.
- Test manuel : navigation 100 % clavier, VoiceOver iOS ou NVDA sur le hero, la FAQ et les CTA.

---

## 13. Sécurité, RGPD et cadre légal

- Secrets : `NOTION_TOKEN`, `REVALIDATE_SECRET` uniquement côté serveur (`server-only`), jamais préfixés
  `NEXT_PUBLIC_`. Intégration Notion en **lecture seule**.
- En-têtes de sécurité : §6.1. Pas de CSP stricte : elle exigerait des nonces, donc des pages dynamiques
  (incompatible avec l'ISR statique) ; compromis assumé pour un site sans formulaire ni donnée sensible.
- Cookies : le site n'en pose aucun ; Cal.com n'est chargé qu'à la demande de l'utilisateur. Pas de GA/GTM/Pixel
  sans bannière de consentement. Dans cette configuration, une bannière ne devrait pas être nécessaire —
  **à faire valider** (je ne suis pas juriste).
- Avis patients : prénom + initiale ; idéalement avec l'accord des patients cités. Les règles déontologiques
  luxembourgeoises sur la publicité des professions de santé (témoignages) n'ont **pas pu être vérifiées** :
  à confirmer auprès du ministère de la Santé ou de l'association professionnelle avant la mise en ligne.
- Profession : l'ostéopathie est une profession de santé réglementée au Luxembourg (loi modifiée du 26 mars 1992,
  autorisation d'exercer du ministre de la Santé — source : communiqué gouvernement.lu d'octobre 2018).
  Ne jamais écrire « médecin » ni « Dr ».

---

## 14. Plan d'exécution par phases

> À la fin de **chaque** phase : `npm run lint && npm run typecheck && npm test && npm run build` → verts → commit.

### Phase 0 — Initialisation

```bash
# 1. Générer le squelette HORS du dépôt (README.md et CLAUDE.md font échouer create-next-app en place — vérifié)
npx create-next-app@16.3.6 /tmp/np-scaffold --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --disable-git --skip-install --yes
# 2. Copier sans écraser README.md / CLAUDE.md / docs/ (rsync n'est pas installé ; GNU cp 9.4 vérifié)
cp -r --update=none /tmp/np-scaffold/. . && rm -rf /tmp/np-scaffold
# 3. Dépendances
npm install
npm install @notionhq/client@5.26.0 @calcom/embed-react@1.5.3 motion@13.4.4 lucide-react@1.48.0 \
  @radix-ui/react-slot@1.3.3 class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@3.7.0 server-only@0.0.1
npm install -D @types/node@^22 schema-dts@2.0.0 vitest@5.0.2 tsx@4.23.15 node-html-parser@9.0.4
```

4. Supprimer `public/*.svg` et `src/app/favicon.ico` ; vider `page.tsx` (texte temporaire).
5. `package.json` : scripts §6.1 + `"engines": { "node": "22.x" }`.
6. `.gitignore` : ajouter `!.env.example` (le `.env*` généré l'ignorerait) ; créer `.env.example` (§16.3).
7. `vitest.config.ts` (§6.1) ; `docs/DECISIONS.md` (titre + tableau vide « date | décision | raison »).
8. Vérifier que `CLAUDE.md` commence par `@AGENTS.md` et que `AGENTS.md` existe.

**Critères :** `npm run dev` affiche une page ; `lint`, `typecheck` et `build` passent (`npm test` n'a pas encore
de fichier de test : il devient obligatoire dès la phase 1). Commit `chore: initialise Next.js 16.3.6`.

**En parallèle (Arthur) :** créer le projet Vercel lié au dépôt (§16.1) → chaque push produit une preview où Notion
et Cal.com fonctionnent.

### Phase 1 — Couche contenu

Fichiers §6.1 à §6.8 : `config/*`, `lib/content/*` (types, fallback, parse, format, tests, get-site-content),
`lib/notion/*`, `lib/icons.ts`, `lib/maps.ts`, `lib/utils.ts`, `scripts/notion-check.ts`, `next.config.ts`.

**Critères :** 7 tests verts ; `npm run build` sans token → avertissement « contenu de secours » et build OK ;
avec un vrai token (local ou Vercel) → `npm run notion:check` ✓ (avertissements attendus : tarif, portrait).

### Phase 2 — Design system et coque

`globals.css` (§7.2), `layout.tsx` (§6.10 + SkipLink/Header/Footer), `ui/*` (§6.14, §7.6), `content/ui-copy.ts`,
`site-header.tsx`, `site-footer.tsx`.

**Critères :** header collant « verre dépoli », ancres fonctionnelles, footer ; contrastes conformes ; aucune
couleur en dur hors jetons.

### Phase 3 — Sections

`hero`, `about`, `motifs`, `reviews`, `faq`, `practical-info` (sans l'agenda réel : placeholder) + composition dans
`page.tsx` avec `generateMetadata` (§6.11) et `<JsonLd data={buildHomeGraph(...)} />`.

**Critères :** rendu correct à 360, 768 et 1280 px ; un seul `<h1>` ; aucun contenu Notion en dur ; placeholders
d'image élégants ; FAQ native fonctionnelle ; zone d'avis accessible au clavier.

### Phase 4 — Prise de RDV

`booking/*`, `mobile-action-bar.tsx` ; brancher tous les CTA (header, hero, FAQ, 404, barre mobile) et l'agenda.

**Critères :** 0 requête Cal.com au chargement ; repli vérifié (dans cet environnement : navigation vers
`cal.eu` après clic) ; **sur la preview Vercel** : popup et agenda UE fonctionnels (§9.3).

### Phase 5 — SEO technique et pages secondaires

`lib/seo/*`, `components/seo/json-ld.tsx`, `robots.ts`, `sitemap.ts`, `manifest.ts`, `icon.svg`, `apple-icon.tsx`,
`opengraph-image.tsx`, `api/revalidate/route.ts`, `mentions-legales`, `confidentialite`, `not-found.tsx`,
`scripts/seo-smoke.ts`.

**Critères :** `npm run build && npm start` puis `npm run seo:smoke` → « Tout est vert » (vérifié sur le
prototype) ; sortie de build `○ /  1h` ; `/api/revalidate` renvoie 401 sans secret et 200 avec.

### Phase 6 — Micro-animations et finitions

`reveal.tsx`, `motion-features.ts` ; survols CSS ; animation FAQ ; mouvements réduits.

**Critères :** aucune animation au-dessus de la ligne de flottaison ; contenu visible sans JS ; score inchangé.

### Phase 7 — QA et performance

Lighthouse ×5 mobile et desktop (§15.2), tests manuels (§12), Safari iOS, Chrome Android, Firefox, liens morts.

**Critères :** médiane mobile ≥ 98, desktop 100 ; Accessibilité / Bonnes pratiques / SEO = 100 (build avec
`ALLOW_INDEXING=true` pour la catégorie SEO) ; aucune erreur console.

### Phase 8 — Mise en ligne

§16. **Bloquants :** données §18 marquées « bloquant », `NOTION_TOKEN` en production, `grep -R "À COMPLÉTER" src`
vide, tests manuels Cal.com OK sur la preview.

### Phase 9 (optionnelle, quand le contenu existe) — Pages motifs

- Source : corps de la page Notion de chaque ligne `Motifs_Consultation` (blocs).
- Générer une page **uniquement si le corps contient ≥ 300 mots** (éviter le contenu mince) ; sinon carte sans lien.
- **Amendement du 28/09/2026 (voir `docs/DECISIONS.md`) :** et **uniquement si la case `Page_Validée` est cochée**
  (relecture de Patrice). Case absente ou décochée = pas de page. Ne pas confondre avec `Publié`, qui masque la carte.
- Route `src/app/[slug]/page.tsx` : `dynamicParams = false`, `generateStaticParams` depuis les motifs publiés,
  `generateMetadata` (title « {Motif} à Dudelange », description = `Description_Courte`, canonical `/{slug}`).
- Rendu : fil d'Ariane (Accueil › Motif), `<h1>`, intro, blocs Notion (paragraph, heading_2/3, bulleted/numbered
  list sur 1 niveau, quote, callout, divider ; images **externes** autorisées seulement), bloc CTA, liens vers
  les autres motifs.
- Blocs via `notion.blocks.children.list` + `collectPaginatedAPI` ; texte enrichi : gras, italique, code, liens.
- JSON-LD : `MedicalWebPage` (`lastReviewed` = `last_edited_time`, `reviewedBy` → `#person`) + `BreadcrumbList`.
- Sitemap : ajouter ces pages. Cartes de l'accueil : lien descriptif « Découvrir : {Motif} ».
- **Non prototypé** : prévoir tests unitaires du rendu des blocs.

---

## 15. Tests, QA et mesures

### 15.1 Automatisés

| Commande | Contenu |
|---|---|
| `npm test` | Vitest : analyse (placeholders, Cal UE, adresse, téléphone, note, slug, horaires, hôtes d'images) et formatage FR. |
| `npm run typecheck` | `next typegen && tsc --noEmit` (sans `next typegen`, un clone neuf échoue : `LayoutProps` introuvable — vérifié). |
| `npm run lint` | ESLint (config Next core-web-vitals + TypeScript). |
| `npm run build` | Doit afficher `○ /  1h`. |
| `npm run seo:smoke` | §6.13, sur `npm start`. |
| `npm run notion:check` | Accès et qualité du contenu Notion (hors cet environnement). |

### 15.2 Lighthouse (procédure vérifiée dans cet environnement)

```bash
ALLOW_INDEXING=true npm run build && npx next start -p 3100 &
CHROME=$(find /opt/pw-browsers -type f -name chrome | head -1)
for i in 1 2 3 4 5; do
  CHROME_PATH=$CHROME npx --yes lighthouse@13 http://localhost:3100/ \
    --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path=./lh-mobile-$i.json --quiet
done
# desktop : ajouter --preset=desktop ; prendre la médiane ; ne pas commiter les rapports.
```

Note : `--chrome-path` n'est pas pris en compte par Lighthouse 13 : utiliser la variable `CHROME_PATH`.
Sans `ALLOW_INDEXING=true`, l'audit SEO « page indexable » échoue (noindex volontaire hors production).

### 15.3 Manuels (checklist)

- [ ] Parcours RDV complet sur la preview (popup desktop, popup mobile, agenda inline), iframe sur `app.cal.eu`.
- [ ] Clic sur le téléphone (mobile) ouvre le composeur.
- [ ] Clavier seul : tout est atteignable, focus visible, FAQ opérable (Entrée/Espace).
- [ ] Mouvements réduits activés : aucune animation.
- [ ] Largeurs 320 / 360 / 390 / 768 / 1024 / 1280 / 1440 px : pas de débordement horizontal.
- [ ] Safari iOS : barre mobile au-dessus de la barre système (safe area).
- [ ] Avec `NOTION_TOKEN` : toute modification Notion visible après `/api/revalidate`.

---

## 16. Déploiement et mise en ligne

### 16.1 Vercel (Arthur)

1. Vercel → Add New → Project → importer `arthur7578/patrice-tchikaya-osteopathe` (framework détecté : Next.js).
2. Variables d'environnement (Production **et** Preview) : `NOTION_TOKEN`, `REVALIDATE_SECRET` (chaîne aléatoire
   longue) ; Production seulement : `NEXT_PUBLIC_SITE_URL=https://osteopathe-tchikaya.lu`.
3. Node.js 22.x (cohérent avec `engines`).
4. Domaine : acheter/configurer `osteopathe-tchikaya.lu`, l'ajouter dans Vercel avec `www` ; domaine principal =
   apex, `www` → redirection 308.
5. (Optionnel) Activer Web Analytics et Speed Insights dans le dashboard, **puis** ajouter `<Analytics />` et
   `<SpeedInsights />` (conditionnés par `NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS`).

### 16.2 Après la mise en ligne

1. Google Search Console : propriété **Domaine** (vérification DNS TXT), envoyer `sitemap.xml`, inspecter
   l'URL d'accueil et demander l'indexation.
2. Bing Webmaster Tools : importer depuis Search Console.
3. Fiche Google (GBP) : URL du site
   `https://osteopathe-tchikaya.lu/?utm_source=google&utm_medium=organic&utm_campaign=gbp` (mesure du trafic de la
   fiche ; le canonical évite tout doublon) ; lien de prise de RDV = URL Cal.com.
4. Valider le JSON-LD (§10.3) sur l'URL de production.
5. Surveiller Search Console (couverture, requêtes) à J+7, J+30.

### 16.3 `.env.example`

```bash
# Secret de l'intégration Notion (lecture seule) — obligatoire en production
NOTION_TOKEN=
# URL canonique du site, sans slash final
NEXT_PUBLIC_SITE_URL=https://osteopathe-tchikaya.lu
# Secret de /api/revalidate?secret=… (chaîne aléatoire longue)
REVALIDATE_SECRET=
# Optionnel : forcer l'indexation hors production Vercel (tests Lighthouse SEO en local)
ALLOW_INDEXING=
# Optionnel : balise de vérification Search Console (si pas de vérification DNS)
GOOGLE_SITE_VERIFICATION=
# Optionnel : activer Vercel Web Analytics + Speed Insights (après activation dans le dashboard)
NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=
```

---

## 17. SEO hors-site et local (actions humaines, fort impact)

Le classement dans le « pack local » Google dépend surtout de la fiche Google (pertinence, proximité, notoriété).
Le site la renforce ; il ne la remplace pas.

1. **Fiche Google** : catégorie principale « Ostéopathe » ; services = les 4 motifs ; description travaillée ;
   horaires ; photos réelles (façade, salle, praticien) ; lien RDV ; réponse à chaque avis ; demander un avis
   après chaque séance (lien `https://g.page/r/CY0QxWkj7WfJEBM/review`, QR code au cabinet).
2. **NAP identique partout** : « 46 Avenue Grande-Duchesse Charlotte, 3440 Dudelange » / « +352 51 92 92 ».
3. **Annuaires** : editus.lu, Apple Business Connect (Apple Plans), Bing Places, page Facebook, LinkedIn ;
   association professionnelle (ex. osteopathie.lu) si Patrice est membre.
4. **Liens locaux pertinents** : clubs sportifs de Dudelange (handball en priorité, vu le parcours de Patrice),
   entreprises locales (ateliers TMS), associations, presse locale.
5. **Contenu** : enrichir la FAQ (nombre de séances, que porter/apporter, parking, femmes enceintes ou
   nourrissons *si pratiqué*, différence ostéopathe/kinésithérapeute, langues parlées) ; phase 9 pour les motifs.

---

## 18. Questions ouvertes / données manquantes

| # | Question | Bloquant pour la mise en ligne ? |
|---|---|---|
| 1 | Le domaine `osteopathe-tchikaya.lu` est-il acheté ? (aucune résolution DNS au 27/09/2026) | Oui |
| 2 | Tarif réel de la consultation ? | Non (ligne masquée), mais fortement recommandé |
| 3 | Photos (hero, portrait, cabinet) : où les héberger (Vercel Blob / Cloudinary) et quand ? | Non (placeholders), fortement recommandé |
| 4 | Note et nombre d'avis Google à afficher (`Note_Google`, `Nombre_Avis_Google`) ? | Non |
| 5 | Coordonnées GPS exactes du cabinet (idéalement celles du repère de la fiche Google) ? | Oui (JSON-LD) |
| 6 | Horaires d'ouverture (format `Mo-Fr 08:00-19:00; Sa 08:00-12:00`) ? | Non, recommandé |
| 7 | Mentions légales : e-mail, n° TVA/matricule, n° d'autorisation d'exercer (si souhaité), école et année du diplôme ? | Oui (mentions légales) |
| 8 | Affichage des témoignages patients : conforme aux règles professionnelles luxembourgeoises ? Accord des patients ? | Oui (à vérifier) |
| 9 | Mentionner « successeur de Daniel Leiner » ? (avec son accord) | Non |
| 10 | Langues parlées au cabinet ? | Non |
| 11 | Publics pris en charge (femmes enceintes, nourrissons, seniors, sportifs de haut niveau) ? | Non (contenu) |
| 12 | Version allemande / anglaise à terme ? | Non |
| 13 | Nuance sur le remboursement (CNS vs complémentaires) validée par Patrice ? | Non, recommandé |

---

## 19. Sources et vérifications

- Notion : 6 bases lues via le connecteur Notion le 27/09/2026 (schémas et contenus reproduits ci-dessus).
- npm : versions relevées le 27/09/2026 (`npm view`), prototype installé avec ces versions exactes.
- Next.js 16.3.6 : documentation embarquée `node_modules/next/dist/docs/` (image `preload`/`priority`, `qualities`,
  ISR sans Cache Components, `revalidatePath`/`revalidateTag`, JSON-LD, guide de migration v16).
- Notion SDK 5.26.0 : types (`dataSources.query`, `collectPaginatedAPI`, `isFullDatabase`, version par défaut
  `2025-09-03`).
- Cal.com : code de `@calcom/embed-react` 1.5.3 et `@calcom/embed-core` 1.5.3 ; issue GitHub calcom/cal.diy #28443
  (EU, `calOrigin="https://app.cal.eu"`) ; `EmbedCodes.tsx` du dépôt calcom/cal.com.
- Radix : code de `@radix-ui/react-collapsible` 1.1.20 (`children: isOpen && children`).
- schema.org : types de `schema-dts` 2.0.0 (énumérations `MedicalSpecialty`, `MedicineSystem`, type `Physician`).
- Google (via recherche web, pages Google non consultables d'ici) : règle des avis « self-serving » (2019, rappelée
  en 2025) ; dépréciation des résultats enrichis FAQ (7 mai 2026) selon plusieurs sources SEO.
- Luxembourg : gouvernement.lu (communiqué d'octobre 2018 sur la réglementation de la profession d'ostéopathe) ;
  switchr.lu (remboursements 2026 — à confirmer).
- Mobbin : références listées en §7.1.
- Mesures : prototype jetable hors dépôt (Lighthouse 13.5.0, Chromium 141, Playwright).
