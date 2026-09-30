/**
 * Mutation testing Stryker, groupe par groupe (stryker/groups.json, source unique pour ce script et la CI).
 *
 * Runner « command » : pour chaque mutant, Stryker lance `vitest related --run <fichiers du groupe>`, c'est-à-dire
 * uniquement les tests qui importent (directement ou non) un fichier muté. Deux écueils évités (docs/DECISIONS.md) :
 * le runner vitest de Stryker 10 ne détecte presque aucun mutant avec vitest 5 (scores faux), et relancer toute la
 * suite pour chaque mutant est trop lent.
 *
 * Usage : npm run test:mutation [-- <groupe> …]   (sans argument : tous les groupes)
 * Rapports : reports/mutation/<groupe>/index.html (+ mutation.json) ; incrémental : reports/incremental/<groupe>.json
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

/** Version épinglée, lancée via npx et hors package.json : ses dépendances apportent des alertes `npm audit`. */
const STRYKER = "@stryker-mutator/core@10.0.0";
/**
 * Stryker importe `typescript` (réécriture du tsconfig dans son bac à sable) : installé par npx à côté de lui,
 * il ne voit pas celui du projet. On lui fournit donc la même version que le projet.
 */
const TYPESCRIPT = `typescript@${(JSON.parse(readFileSync("node_modules/typescript/package.json", "utf8")) as { version: string }).version}`;

type Group = { name: string; include: string[]; exclude: string[] };

const groups = JSON.parse(readFileSync("stryker/groups.json", "utf8")) as Group[];
const base = JSON.parse(readFileSync("stryker/base.json", "utf8")) as Record<string, unknown>;
const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !groups.some((g) => g.name === name));
if (unknown.length > 0) {
  console.error(`Groupe(s) inconnu(s) : ${unknown.join(", ")}. Groupes : ${groups.map((g) => g.name).join(", ")}`);
  process.exit(2);
}

/** Fichiers d'un groupe, triés, relatifs à la racine (les crochets de `[slug]` restent littéraux). */
function groupFiles(group: Group): string[] {
  const excluded = new Set(group.exclude.flatMap((pattern) => globSync(pattern)));
  return [...new Set(group.include.flatMap((pattern) => globSync(pattern)))].filter((f) => !excluded.has(f)).sort();
}

const shellQuote = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`;

type Mutant = {
  mutatorName: string;
  replacement?: string;
  status: string;
  location: { start: { line: number; column: number } };
};

/**
 * Résumé Markdown d'un groupe (score, survivants avec fichier:ligne) depuis le rapport JSON de Stryker.
 * Score = (tués + délais) / (tués + délais + survivants + non couverts), comme Stryker.
 */
function summarize(name: string, reportFile: string): string {
  const report = JSON.parse(readFileSync(reportFile, "utf8")) as { files: Record<string, { mutants: Mutant[] }> };
  const rows: string[] = [];
  const survivors: string[] = [];
  let detected = 0;
  let valid = 0;
  for (const [file, { mutants }] of Object.entries(report.files).sort(([a], [b]) => a.localeCompare(b))) {
    const count = (...statuses: string[]) => mutants.filter((m) => statuses.includes(m.status)).length;
    const fileDetected = count("Killed", "Timeout");
    const fileValid = fileDetected + count("Survived", "NoCoverage");
    detected += fileDetected;
    valid += fileValid;
    const score = fileValid ? ((100 * fileDetected) / fileValid).toFixed(1) : "–";
    rows.push(`| ${file} | ${score} % | ${fileDetected} | ${count("Survived")} | ${count("NoCoverage")} |`);
    for (const m of mutants.filter((m) => m.status === "Survived" || m.status === "NoCoverage")) {
      const replacement = (m.replacement ?? "").replace(/\s+/g, " ").slice(0, 80);
      survivors.push(`- \`${file}:${m.location.start.line}\` ${m.mutatorName} → \`${replacement}\`${m.status === "NoCoverage" ? " (non couvert)" : ""}`);
    }
  }
  const total = valid ? ((100 * detected) / valid).toFixed(1) : "–";
  return [
    `### Mutation testing : ${name} — score ${total} % (${detected}/${valid})`,
    "",
    "| Fichier | Score | Tués | Survivants | Non couverts |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
    survivors.length > 0 ? `<details><summary>${survivors.length} mutant(s) non détecté(s)</summary>\n\n${survivors.join("\n")}\n\n</details>` : "Aucun survivant.",
    "",
  ].join("\n");
}

let failed = false;
for (const group of groups.filter((g) => requested.length === 0 || requested.includes(g.name))) {
  const files = groupFiles(group);
  if (files.length === 0) {
    console.error(`Groupe « ${group.name} » : aucun fichier.`);
    process.exit(2);
  }
  const dir = `reports/mutation/${group.name}`;
  mkdirSync(dir, { recursive: true });
  mkdirSync("reports/incremental", { recursive: true });
  const config = {
    ...base,
    mutate: files,
    // Binaire local (pas npx) : évite le démarrage de npm à chaque mutant.
    commandRunner: { command: `node_modules/.bin/vitest related --run --reporter=dot ${files.map(shellQuote).join(" ")}` },
    incrementalFile: `reports/incremental/${group.name}.json`,
    htmlReporter: { fileName: `${dir}/index.html` },
    jsonReporter: { fileName: `${dir}/mutation.json` },
  };
  const configFile = `${dir}/stryker.config.json`;
  writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`\n### Groupe ${group.name} : ${files.length} fichier(s)`);
  const run = spawnSync("npx", ["--yes", "-p", TYPESCRIPT, "-p", STRYKER, "stryker", "run", configFile], { stdio: "inherit" });
  if (run.status !== 0) failed = true;
  if (existsSync(config.jsonReporter.fileName)) {
    const summary = summarize(group.name, config.jsonReporter.fileName);
    writeFileSync(`${dir}/summary.md`, summary);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}
process.exit(failed ? 1 : 0);
