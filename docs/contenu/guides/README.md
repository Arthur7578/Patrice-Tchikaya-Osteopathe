# Pages d'information : brouillons à valider

Trois pages rédigées par l'agent le 30/09/2026. Elles vivent dans la base Notion **Motifs_Consultation**, comme les motifs,
avec la colonne `Type` = **Page d'information** (un motif de consultation = `Type` vide ou `Motif`). Elles ne sont publiées
que si `Page_Validée` est **cochée** : Patrice relit dans Notion (le corps de chaque ligne est le texte de la page), corrige,
puis coche. La page apparaît à la revalidation suivante (≤ 1 h, ou tout de suite via `/api/revalidate`), liée depuis
l'accueil (« Bon à savoir »), le pied de page, le sitemap et `llms.txt`. Seuil : 300 mots minimum.

Les fichiers `.md` de ce dossier sont la copie des brouillons au 30/09/2026 ; **Notion fait foi** ensuite.

| Fichier | Adresse | Titre (h1) |
|---|---|---|
| `osteopathe-kinesitherapeute-difference.md` | `/osteopathe-kinesitherapeute-difference` | Ostéopathe ou kiné : quelle différence ? |
| `osteopathe-sans-ordonnance-dudelange.md` | `/osteopathe-sans-ordonnance-dudelange` | Ostéopathe sans ordonnance à Dudelange |
| `osteopathe-pres-de-dudelange.md` | `/osteopathe-pres-de-dudelange` | Ostéopathe près de Dudelange |

Colonnes Notion : titre de la ligne (= h1 et début du `<title>`), `slug URL`, `Description_Courte` (= meta description, 70–160 caractères),
`Icone_Lucide` (liste de `src/lib/icons.ts`), `Type`, `Page_Validée`. Une ligne ajoutée et validée devient une page, sans code.

## Points à faire valider par Patrice

**Toutes les pages**
- Les descriptions de séance (questions, examen, traitement manuel, conseils ; 45 minutes) correspondent-elles à sa pratique ?
- Les signaux d'alerte (avis médical d'abord) : les juge-t-il justes et suffisants ?
- Ton et vocabulaire. Aucune promesse de guérison ; le mot « médecin » et « Dr » sont volontairement absents.

**Ostéopathe ou kiné**
- Le résumé du rôle du kinésithérapeute (rééducation, exercices, suivi sur plusieurs séances) : à corriger s'il le formule autrement.
- « Si une rééducation plus longue est nécessaire, Patrice vous en parle à la fin de la séance » : est-ce bien ce qu'il fait ?

**Sans ordonnance**
- Cohérent avec la FAQ existante (« praticien de première intention »). À confirmer : liste de ce qu'il demande d'apporter.
- Quand il refuse/oriente avant toute manipulation : la formulation reflète-t-elle sa pratique ?
- Reçoit-il les enfants / bébés ? (Question volontairement non traitée.)

**Près de Dudelange**
- Communes citées : Bettembourg, Kayl, Rumelange, Esch-sur-Alzette, Volmerange-les-Mines, Zoufftgen. À ajuster selon sa patientèle réelle.
- **Aucun temps de trajet ni distance** n'est écrit : non vérifiés. Il peut en ajouter (par ex. depuis Bettembourg, Esch, la frontière).
- Langues parlées au cabinet : non mentionnées (clé `Langues_Parlees` vide dans Notion). À ajouter si utile aux frontaliers.
- Les infos train / bus / stationnement renvoient vers « Infos pratiques » (`/#acces`) au lieu d'être recopiées.

## Hors périmètre (décision d'Arthur, 30/09/2026)
Aucune page sur le remboursement ou la prise en charge : sujet jugé trop incertain. Les pages n'en parlent pas.
