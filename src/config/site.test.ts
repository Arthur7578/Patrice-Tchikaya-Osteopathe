import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
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
