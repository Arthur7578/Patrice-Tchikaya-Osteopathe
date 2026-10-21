import { afterEach, describe, expect, it, vi } from "vitest";
import { localePath, LOCALES, splitLocalePath, translationMode } from "./i18n";

describe("localePath / splitLocalePath", () => {
  it.each([
    ["fr", "/", "/"],
    ["fr", "/paiement", "/paiement"],
    ["fr", "/#infos", "/#infos"],
    ["en", "/", "/en"],
    ["en", "/paiement", "/en/paiement"],
    ["pt", "/#infos", "/pt#infos"],
    ["lb", "/mal-de-dos#faq", "/lb/mal-de-dos#faq"],
  ] as const)("%s + %s → %s", (locale, path, expected) => {
    expect(localePath(locale, path)).toBe(expected);
  });

  it.each([
    ["/", "fr", "/"],
    ["/paiement", "fr", "/paiement"],
    ["/en", "en", "/"],
    ["/en/paiement", "en", "/paiement"],
    ["/lb/a/b", "lb", "/a/b"],
    ["/fr/paiement", "fr", "/fr/paiement"], // « /fr » n'est pas un préfixe public (redirigé par le proxy)
    ["/english", "fr", "/english"],
    ["", "fr", "/"],
  ] as const)("%s → %s %s", (pathname, locale, path) => {
    expect(splitLocalePath(pathname)).toEqual({ locale, path });
  });

  it("aller-retour pour chaque langue", () => {
    for (const locale of LOCALES) expect(splitLocalePath(localePath(locale, "/paiement"))).toEqual({ locale, path: "/paiement" });
  });
});

describe("translationMode", () => {
  it.each([
    [{ ANTHROPIC_API_KEY: "cle" }, "claude"],
    [{ ANTHROPIC_API_KEY: "cle", VERCEL_ENV: "production" }, "claude"],
    [{ TRANSLATION_MODE: "identity" }, "identity"],
    [{ TRANSLATION_MODE: "identity", VERCEL_ENV: "production" }, null], // jamais de faux « anglais » en production
    [{ TRANSLATION_MODE: "autre" }, null],
    [{}, null],
  ])("%o → %s", (env, expected) => {
    expect(translationMode(env as NodeJS.ProcessEnv)).toBe(expected);
  });
});

describe("langues publiées et hreflang", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async (env: Record<string, string>) => {
    vi.resetModules();
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("TRANSLATION_MODE", "");
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    return import("./i18n");
  };

  it("sans traduction : français seul, canonical sans hreflang", async () => {
    const m = await load({});
    expect(m.ENABLED_LOCALES).toEqual(["fr"]);
    expect(m.localeAlternates("fr", "/paiement")).toEqual({ canonical: "/paiement" });
  });

  it("avec traduction : 5 langues, hreflang vers chacune + x-default (le français)", async () => {
    const m = await load({ ANTHROPIC_API_KEY: "cle" });
    expect(m.ENABLED_LOCALES).toEqual(["fr", "de", "en", "lb", "pt"]);
    expect(m.localeAlternates("en", "/paiement")).toEqual({
      canonical: "/en/paiement",
      languages: { fr: "/paiement", de: "/de/paiement", en: "/en/paiement", lb: "/lb/paiement", pt: "/pt/paiement", "x-default": "/paiement" },
    });
  });
});
