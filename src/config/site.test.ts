import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RESERVED_SLUGS } from "./site";

describe("RESERVED_SLUGS", () => {
  it("contient chaque route de premier niveau de src/app (une route statique masquerait une page motif du même slug)", () => {
    const routes = readdirSync(join(process.cwd(), "src/app"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      // Hors segments dynamiques, groupes, dossiers privés et routes à point (llms.txt) : sans collision possible.
      .filter((name) => !/^[[(_]/.test(name) && !name.includes("."));
    expect(routes.filter((name) => !RESERVED_SLUGS.has(name))).toEqual([]);
  });
});

describe("RESERVED_SLUGS : images générées à la racine", () => {
  it("contient les routes sans extension créées par un fichier de src/app (/apple-icon, /opengraph-image…)", () => {
    const imageRoutes = readdirSync(join(process.cwd(), "src/app"))
      .map((file) => /^(apple-icon|icon|opengraph-image|twitter-image)\.(tsx|ts|jsx|js)$/.exec(file)?.[1])
      .filter((name): name is string => Boolean(name));
    expect(imageRoutes).toEqual(expect.arrayContaining(["apple-icon", "opengraph-image"]));
    expect(imageRoutes.filter((name) => !RESERVED_SLUGS.has(name))).toEqual([]);
  });
});

describe("SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("sans barre finale, même si NEXT_PUBLIC_SITE_URL en a une ou plusieurs (sinon « //chemin » dans les URL)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemple.test//");
    vi.resetModules();
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://exemple.test");
  });

  it("valeur par défaut : le domaine de production", async () => {
    vi.resetModules();
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://osteopathe-tchikaya.lu");
  });
});
