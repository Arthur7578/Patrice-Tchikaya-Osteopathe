import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RESERVED_SLUGS } from "./site";

/** Dossiers où une route occupe le premier segment d'une adresse : la racine de src/app et la racine d'une langue. */
const ROUTE_ROOTS = ["src/app", "src/app/[locale]"];

describe("RESERVED_SLUGS", () => {
  it("contient chaque route de premier niveau de src/app et de src/app/[locale] (une route statique masquerait une page motif du même slug)", () => {
    const routes = ROUTE_ROOTS.flatMap((dir) => readdirSync(join(process.cwd(), dir), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      // Hors segments dynamiques, groupes, dossiers privés et routes à point (llms.txt) : sans collision possible.
      .filter((name) => !/^[[(_]/.test(name) && !name.includes("."));
    expect(routes).toEqual(expect.arrayContaining(["api", "articles", "paiement"]));
    expect(routes.filter((name) => !RESERVED_SLUGS.has(name))).toEqual([]);
  });

  it("contient les préfixes de langue (« /en » est une langue, jamais une page motif)", () => {
    for (const locale of ["fr", "en", "lb", "pt"]) expect(RESERVED_SLUGS.has(locale), locale).toBe(true);
  });
});

describe("RESERVED_SLUGS : images générées à la racine", () => {
  it("contient les routes sans extension créées par un fichier de src/app (/apple-icon, /opengraph-image…)", () => {
    const imageRoutes = ROUTE_ROOTS.flatMap((dir) => readdirSync(join(process.cwd(), dir)))
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
