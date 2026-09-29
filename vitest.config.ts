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
      exclude: ["src/**/*.test.{ts,tsx}"],
      reporter: ["text-summary", "html", "lcov"],
      // Seuils sur la logique pure uniquement : pages et composants relèvent de l'e2e (Playwright).
      thresholds: {
        "src/lib/**": { statements: 70, branches: 55, functions: 65, lines: 70 },
      },
    },
  },
});
