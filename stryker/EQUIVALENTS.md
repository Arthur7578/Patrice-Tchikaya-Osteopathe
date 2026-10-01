# Mutants Stryker survivants jugés équivalents

Un mutant « équivalent » change le code sans changer aucun comportement observable : aucun test ne peut le
tuer. S'y ajoutent, pour les pages (groupe `app`), des mutants qui ne changent que l'apparence (styles des images
générées, colonnes d'une grille) ou une configuration que seuls le build et l'e2e voient (`next/font`). Cette liste évite de refaire l'analyse à chaque rapport (`mutation.yml`, résumé du job). Elle est repérée
par le code d'origine plutôt que par numéro de ligne, qui change au fil des modifications.

Un survivant absent de cette liste est un trou de test à examiner. Dernière revue complète : 01/10/2026 (chaque
ligne ci-dessous correspond à un mutant qui survit encore, vérifié par une relance ciblée).

## src/lib/content (groupe `content`)

| Fichier | Code d'origine → mutant | Pourquoi rien ne change |
| --- | --- | --- |
| `blocks.ts` | `/^(#{2,3}) (.+)$/` et `/^(?:-\|(\d+)\.) (.+)$/` sans `$` | Chaque ligne vient de `split("\n")` : `(.+)` va déjà jusqu'au bout. |
| `format.ts` | `r.days.length === 1 ? …` → `false` | Pour un seul jour, la branche suivante (`join(", ")`) donne le même nom de jour. |
| `parse.ts` | `(value ?? "").trim()` dans `cleanOptional`, `""` remplacé | `value` n'est jamais `null` ici : `isPlaceholder(null)` vaut `true`. |
| `parse.ts` | `parsePostalLine` : `\s+` → `\s`, `.trim()` du pays retiré | La ville est rognée ensuite ; le pays n'a plus d'espaces (texte rogné au départ, `\s*` avant). |
| `parse.ts` | `toE164` : `.replace(/\(0\)/g, …)` avec un autre texte, `.replace(/^00/, "")` | Tout ce qui n'est pas chiffre est retiré ensuite, et le « + » est ajouté s'il manque. |
| `parse.ts` | `new URL(value.trim())` → `new URL(value)` | L'analyseur d'URL retire lui-même les espaces autour. |
| `parse.ts` | `parseRating` : `n >= 0` → `true` | `n` vient de `\d+` : jamais négatif. |
| `parse.ts` | `split(/[\n;]+/)`, `split(/[;\n]+/)`, `split(/\s+/)` sans `+` ; `.trim()` retirés avant `split`/`filter(Boolean)` | Les morceaux vides sont filtrés juste après. |
| `parse.ts` | `normalizeSlug` : `/^-+\|-+$/g` → `/^-\|-+$/g` ou `/^-+\|-$/g` | Espaces et ponctuation deviennent un seul « - », retiré aux extrémités. |
| `parse.ts` | `normalize` : apostrophes typographiques supprimées au lieu d'être converties | L'apostrophe est facultative dans les connecteurs (« jusqu'?au »). |
| `parse.ts` | `RANGE_CONNECTOR` sans `^` ou sans `$` | Ne diffère que pour un texte entre deux jours qui commence ou finit par un connecteur sans en être un (« lundi au soir et jeudi ») : comportement non spécifié, aucun cas réel. |
| `parse.ts` | `isClosedDayLine` : `text.replace(CLOSED, "")` avec un autre texte | Le mot « fermé » ne contient aucun jour : le retirer ne change pas `parseDays`. |
| `parse.ts` | `Number(m[2] ?? "0")` → `Number(m[2] ?? "")` | `Number("")` vaut 0. |
| `payment-page.ts` | `keyOf` : `/^_+\|_+$/g` → `/^_\|_+$/g` ou `/^_+\|_$/g` | Les caractères non alphanumériques deviennent un seul « _ », retiré aux extrémités. |
| `rows.ts` | `/[^a-z0-9]+/g` → `/[^a-z0-9]/g` ; `split(/[,;\n]+/)` sans `+` | Remplacement par une chaîne vide identique ; les morceaux vides sont ignorés. |

## src/lib/notion (groupe `notion`)

| Fichier | Code d'origine → mutant | Pourquoi rien ne change |
| --- | --- | --- |
| `blocks.ts` | `siteHost` : `/^www\./` → `/www\./`, ou `""` remplacé | L'hôte du site (`SITE_URL`) ne contient pas « www. ». |
| `blocks.ts` | `url.hostname.replace(/^www\./, "")` → `/www\./` | Ne diffère que pour un hôte contenant « www. » au milieu, qui ne peut pas égaler celui du site. |
| `blocks.ts` | `if (href) segment.href = href` → `if (true)` | Ajoute `href: undefined`, que le rendu ignore. |
| `fetch-content.ts` | `toKeyValue` : `if (key)` → `if (true)` | Une ligne sans nom est rangée sous la clé « », que rien ne lit. |
| `fetch-content.ts` | `required` : `value.trim()` → `value` | `getText` rogne déjà le texte (`richTextToPlain`). |
| `fetch-content.ts` | `g.url("Url_Booking") ?? ""` → autre texte | Un texte qui n'est pas une URL donne le même résultat (`null`, valeur de secours). |
| `properties.ts` | `getUrl` : `.trim()` retiré | L'analyseur d'URL rogne lui-même les espaces. |

## src/lib/seo (groupe `seo`)

| Fichier | Code d'origine → mutant | Pourquoi rien ne change |
| --- | --- | --- |
| `json-ld.ts` | `webpage: (path = "/")` → `path = ""` | Chaque appel passe un chemin : la valeur par défaut ne sert jamais. |
| `llms-txt.ts` | `/[\xa0\s]*:$/` sans `$` ou sans `*` | Le libellé `COPY.infos.labels.phoneMobile` (« Mobile : ») donne le même résultat. |

## src/lib/google (groupe `google`)

| Fichier | Code d'origine → mutant | Pourquoi rien ne change |
| --- | --- | --- |
| `places.ts` | `typeof d.userRatingCount === "number"` → `true` | `Number.isInteger` renvoie déjà `false` pour tout ce qui n'est pas un nombre. |

## src/app (groupe `app`)

| Fichier | Code d'origine → mutant | Pourquoi aucun test ne le tue |
| --- | --- | --- |
| `apple-icon.tsx`, `opengraph-image.tsx` | Styles de l'image (couleurs, tailles, `display`, polices) | Rendu graphique seulement (satori) ; le texte, la taille et le type de l'image sont testés. |
| `paiement/page.tsx` | `stepColumns` : nombre de colonnes de la grille des étapes | Mise en page seulement ; le nombre d'étapes affichées est testé de 1 à 5. |
| `paiement/page.tsx` | Clés React `` `${i}-${card.title}` `` | Une clé ne change pas le HTML rendu. |
| `paiement/page.tsx` | `paragraphs` : `split(/\n+/)` sans `+`, `line.trim()` retiré | Lignes vides filtrées ensuite ; les espaces en début et fin de paragraphe ne s'affichent pas en HTML. |
| `confidentialite/page.tsx` | `process.env.NEXT_PUBLIC_GTM_ID ?? ""` → autre texte | Sans identifiant, un texte quelconque est refusé comme la chaîne vide. |
| `layout.tsx` | Options de `Plus_Jakarta_Sans` (`subsets`, `display`, `variable`) | `next/font` est remplacé dans les tests (il n'existe qu'au build) ; le build et l'e2e (une seule police chargée) le vérifient. |

## src/components (groupe `components`)

| Fichier | Code d'origine → mutant | Pourquoi aucun test ne le tue |
| --- | --- | --- |
| `analytics/cookie-consent.tsx` | `consentListeners.filter(…)` au désabonnement | Un écouteur oublié dans le tableau n'a aucun effet visible (le composant démonté ne se rend plus). |
| `analytics/cookie-consent.tsx` | `getHashServerSnapshot` (`""`) remplacé | Côté serveur, aucun choix n'est connu : la bannière est affichée quelle que soit l'ancre. |
| `analytics/cookie-consent.tsx` | `history.replaceState(null, "", …)` : titre `""` remplacé | Les navigateurs ignorent ce paramètre. |
| `booking/booking-inline.tsx` | `if (!el)`, `entry?.`, `"loading"` → `""`, dépendances `[booking.provider]`, `provider === "cal"` → `true` | Ref jamais nulle dans un effet ; l'observateur fournit toujours une entrée ; `""` donne le même affichage que « chargement » ; le prestataire ne change pas ; hors Cal.com, l'état vaut déjà « failed ». |
| `booking/booking-inline.tsx` | Style de l'iframe Cal.com | Mise en page seulement. |
| `booking/cal.ts` | `> timeoutMs` → `>= timeoutMs` | Une milliseconde d'écart sur un délai de 5 à 10 s. |
| `content/content-blocks.tsx` | Classes CSS des liens (`LINK`) | Style seulement. |
| `layout/mobile-action-bar.tsx` | Dépendances de `useEffect` : `[]` → `["…"]` | Tableau constant : l'effet ne s'exécute toujours qu'une fois. |
| `layout/mobile-menu.tsx` | `buttonRef.current?.focus` → `.current.focus` | Le bouton est toujours monté quand le menu est ouvert. |
| `layout/site-footer.tsx` | `NEXT_PUBLIC_GTM_ID ?? ""` → autre texte | Sans identifiant, un texte quelconque est refusé comme la chaîne vide. |
| `sections/practical-info.tsx` | Classes de la grille (`DL`) | Style seulement. |
| `sections/reviews.tsx` | Clé React des avis | Une clé ne change pas le HTML rendu. |
| `sections/about.tsx`, `motifs.tsx`, `reviews.tsx` | Délai d'apparition `i * 0.08` → `i / 0.08` | Animation : vérifiée par l'e2e (chaque section animée finit visible), pas par vitest. |
| `ui/reveal.tsx` | Paramètres de l'animation (opacité, décalage, `once`, marge, durée, courbe) | Idem : l'e2e vérifie que tout finit visible, sans JavaScript et en mouvement réduit compris. |
