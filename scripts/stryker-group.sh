#!/usr/bin/env bash
# Lance Stryker (runner « command ») sur un groupe de fichiers, avec SEULEMENT les tests concernés :
# relancer toute la suite pour chaque mutant est ce qui rendait l'essai précédent trop lent.
# Usage : scripts/stryker-group.sh <nom> "<globs mutés, séparés par des virgules>" "<fichiers/dossiers de tests>"
# Ex.   : scripts/stryker-group.sh seo "src/lib/seo/*.ts,!src/lib/seo/*.test.ts" "src/lib/seo"
set -euo pipefail
name="$1"; mutate="$2"; tests="$3"
mkdir -p "reports/$name"
config="reports/$name/stryker.config.json"
jq --arg name "$name" --arg mutate "$mutate" --arg cmd "npx vitest run --reporter=dot $tests" \
  '.mutate = ($mutate | split(","))
   | .commandRunner.command = $cmd
   | .incrementalFile = "reports/incremental/\($name).json"
   | .htmlReporter = { fileName: "reports/mutation/\($name)/index.html" }' \
  stryker/base.json > "$config"
# Version épinglée, hors package.json : évite d'ajouter des dépendances de dev (et leurs alertes npm audit).
exec npx --yes @stryker-mutator/core@10.0.0 run "$config"
