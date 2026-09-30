@AGENTS.md

# Site Patrice Tchikaya — Ostéopathe D.O. à Dudelange

Landing page SEO local : Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, contenu Notion (lecture seule),
prise de RDV Cal.com (compte UE `cal.eu`), déploiement Vercel.

**Source de vérité : `docs/PLAN.md`.** Relire la section de la phase en cours avant d'écrire du code.
Toute décision non couverte par le plan va dans `docs/DECISIONS.md` (date, décision, raison).
`AGENTS.md` (importé ci-dessus) est créé par `create-next-app` en phase 0.

## Commandes

- `npm run dev` : serveur de dev (http://localhost:3000)
- `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` : **tous verts avant chaque commit**
- `npm run notion:check` : diagnostic Notion (nécessite `NOTION_TOKEN` dans `.env.local`)
- `npm run seo:smoke` : contrôles SEO sur un serveur lancé (`npm run build && npm start`)
- `npm run test:coverage` : couverture v8 (rapport HTML dans `coverage/`, seuils sur `src/lib/**`)
- `npm run test:e2e` : Playwright + axe sur le build (`npm run build` d'abord ; en cloud,
  `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux*/chrome`)
- `npm run test:mutants` : casse volontairement ~40 règles critiques, les tests doivent échouer (`scripts/mutation-check.ts` ;
  ajouter une entrée quand on ajoute une règle ; nécessite des fichiers commités ; ~3 min)
- Tests de pages/sections : `src/test/render.tsx` (rendu statique + `expectSiteRules`) ; toute nouvelle page a son test.

## Environnement cloud

- Bloqués par la politique réseau : `api.notion.com`, `cal.eu`, `app.cal.eu`, `app.cal.com`, `ui.shadcn.com`.
  Sans `NOTION_TOKEN`, le build utilise `src/lib/content/fallback.ts` : c'est normal. Tester Notion et Cal.com
  sur la preview Vercel.
- Pas de CLI shadcn : écrire les composants à la main (PLAN §6.14 et §7.6).
- Chromium : `/opt/pw-browsers` ; Lighthouse via la variable `CHROME_PATH` (PLAN §15.2).

## Règles non négociables (détail : PLAN §2.3)

1. Server Components par défaut ; `"use client"` seulement pour `BookingLink`, `BookingInline`,
   `MobileActionBar`, `MobileMenu`, `Reveal`.
2. Aucun contenu éditorial en dur hors `fallback.ts` et `src/content/ui-copy.ts` ; tout passe par `getSiteContent()`.
3. Images Notion : colonne `URL` uniquement, jamais les fichiers Notion ; toujours l'`alt` Notion ; placeholder
   si pas d'URL (composant `SiteImage`).
4. Aucune animation sur le hero / l'élément LCP ; respecter `prefers-reduced-motion`.
5. Aucun script tiers au chargement (pas de GA/GTM/Pixel/iframe Maps) ; Cal.com chargé à l'intention.
6. Tout CTA de RDV est un vrai `<a href="https://cal.eu/…">` (fonctionne sans JS).
7. JSON-LD : jamais `Physician`, jamais `AggregateRating`/`Review`.
8. Un seul `<h1>` par page.
9. `alternates.canonical` défini dans chaque page, jamais dans le layout racine.
10. Ne jamais écrire « médecin » ni « Dr » : l'ostéopathie est une profession de santé distincte.

## Pièges Next.js 16 (vérifiés sur 16.3.6)

- `<Image preload>` : `priority` est déprécié. `images.qualities` est obligatoire. `images.domains` → `remotePatterns`.
- `params` / `searchParams` sont des Promises (`await params`) ; types globaux `PageProps<"/[slug]">`,
  `LayoutProps<"/">`, générés dans `.next/types` : sur un clone neuf, lancer `npx next typegen` avant `tsc`
  (c'est ce que fait `npm run typecheck`).
- `revalidateTag(tag, profile)` exige 2 arguments ; ici on utilise `revalidatePath("/", "layout")`.
- `middleware.ts` est devenu `proxy.ts` (non utilisé). `next lint` n'existe plus : `npm run lint` lance ESLint.
- Notion SDK v5 : `notion.dataSources.query` (il n'y a plus de `databases.query`).
- Cal.com UE : `calOrigin="https://app.cal.eu"` ; namespaces distincts popup / inline (PLAN §9).

## Conventions

- Interface et documentation en français ; identifiants de code en anglais.
- Tailwind v4 : jetons dans `src/app/globals.css` (`@theme`), pas de `tailwind.config.js`.
- Imports via l'alias `@/`.
- Commits conventionnels (`feat:`, `fix:`, `chore:`, `docs:`), au moins un par phase.
