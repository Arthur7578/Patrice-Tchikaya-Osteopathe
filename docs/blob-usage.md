# Suivi quotidien des opérations Vercel Blob

Workflow `.github/workflows/blob-usage.yml`, script `scripts/blob-usage-check.ts` (`npm run blob:check`),
logique testée dans `src/lib/monitoring/blob-usage.ts`. Décision : `docs/DECISIONS.md` (21/11/2026).

- **Secret requis** : `VERCEL_TOKEN` (Vercel → Account Settings → Tokens, portée limitée à l'équipe), à ajouter dans
  GitHub → Settings → Secrets and variables → Actions. Le script ne fait que des lectures et n'affiche jamais le jeton.
- **Tester** : Actions → « Suivi des opérations Vercel Blob » → Run workflow. Le résumé de l'exécution montre la ligne
  de verdict (`Blob OK : ~N ops le JJ/MM, X builds (seuil S)` ou
  `Blob : ~N ops avancées le JJ/MM, X builds, seuil dépassé (S)`, où S vaut 30 ou 80), les 7 derniers jours
  et, en lancement manuel, quelques lignes brutes de l'API. Case « test_alerte » : ouvre l'issue `blob-usage` même sous
  le seuil (une seule issue ouverte à la fois ; le contrôle normal suivant la ferme).
- **Changer les seuils** : `DAILY_LIMIT` dans `src/lib/monitoring/blob-usage.ts` (30 sans déploiement, 80 avec), puis
  adapter `blob-usage.test.ts`.
- **En local** : `VERCEL_TOKEN=… VERCEL_TEAM_ID=team_… VERCEL_PROJECT_ID=prj_… BLOB_DEBUG=1 npm run blob:check`.
