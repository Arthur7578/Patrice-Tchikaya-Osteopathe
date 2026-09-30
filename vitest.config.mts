import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "node", // les tests de composants passent en jsdom via `// @vitest-environment jsdom`
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"], // inclut les fichiers jamais importés par un test
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**"],
      reporter: ["text-summary", "html", "lcov"],
      // Seuils globaux, juste sous le niveau atteint (99,7 % des instructions, 99,2 % des branches, 30/09/2026) :
      // du code ajouté sans test fait échouer la CI. Les rares lignes non couvertes sont inatteignables
      // (ref React nulle, `?? ""` de typage) ou vérifiées en e2e (chargement différé des animations).
      thresholds: { statements: 98, branches: 96, functions: 97, lines: 98 },
    },
  },
});
