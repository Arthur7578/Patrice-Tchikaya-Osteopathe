# Mutants Stryker survivants jugés équivalents

Un mutant « équivalent » change le code sans changer aucun comportement observable : aucun test ne peut le
tuer. Cette liste évite de refaire l'analyse à chaque rapport (`mutation.yml`, résumé du job). Elle est repérée
par le code d'origine plutôt que par numéro de ligne, qui change au fil des modifications.

Un survivant absent de cette liste est un trou de test à examiner. Dernière revue complète : 30/09/2026.

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
| `parse.ts` | `normalizeSlug` : `.trim()` retiré, `/^-+\|-+$/g` → `/^-\|-+$/g` ou `/^-+\|-$/g` | Espaces et ponctuation deviennent un seul « - », retiré aux extrémités. |
| `parse.ts` | `normalize` : apostrophes typographiques supprimées au lieu d'être converties | L'apostrophe est facultative dans les connecteurs (« jusqu'?au »). |
| `parse.ts` | `RANGE_CONNECTOR` sans `^` ou sans `$` | Ne diffère que pour un texte entre deux jours qui commence ou finit par un connecteur sans en être un (« lundi au soir et jeudi ») : comportement non spécifié, aucun cas réel. |
| `parse.ts` | `isClosedDayLine` : `text.replace(CLOSED, "")` avec un autre texte | Le mot « fermé » ne contient aucun jour : le retirer ne change pas `parseDays`. |
| `parse.ts` | `Number(m[2] ?? "0")` → `Number(m[2] ?? "")` | `Number("")` vaut 0. |
| `payment-page.ts` | `fold` sans `.trim()`, `keyOf` : `/^_+\|_+$/g` → `/^_\|_+$/g` ou `/^_+\|_$/g` | Les caractères non alphanumériques deviennent un seul « _ », retiré aux extrémités. |
| `rows.ts` | `/[^a-z0-9]+/g` → `/[^a-z0-9]/g` ; `split(/[,;\n]+/)` sans `+` | Remplacement par une chaîne vide identique ; les morceaux vides sont ignorés. |
