import { describe, expect, it, vi } from "vitest";
import type { SlugRecord, SlugStore } from "./slug-store";
import { resolveSlugs } from "./slugs";

/** Stockage en mémoire : enregistrements immuables, horodatés dans l'ordre de création. */
function memoryStore(initial: SlugRecord[] = []) {
  const records = [...initial];
  let clock = 1000;
  const store: SlugStore = {
    list: vi.fn(async () => [...records]),
    create: vi.fn(async (r) => {
      if (!records.some((x) => x.pageKey === r.pageKey && x.frSlug === r.frSlug && x.locale === r.locale && x.slug === r.slug)) {
        records.push({ ...r, createdAt: clock++ });
      }
    }),
  };
  return { store, records };
}

/** Traduction factice : « sport » → « sports » en anglais, « osteopathie » → « osteopathy »… */
const DICT: Record<string, Record<string, string>> = {
  en: { "osteopathie du sport dudelange": "Sports osteopathy Dudelange", "mal de dos": "Back pain", "lumbago": "Back pain" },
  de: { "osteopathie du sport dudelange": "Sportosteopathie Düdelingen", "mal de dos": "Rückenschmerzen", "lumbago": "Hexenschuss" },
};
const translate = vi.fn(async (batch: Record<string, string>, locale: string) =>
  Object.fromEntries(Object.entries(batch).map(([k, v]) => [k, DICT[locale]?.[v] ?? v])),
);

const SPORT = { pageKey: "page-sport", frSlug: "osteopathie-du-sport-dudelange" };
const DOS = { pageKey: "page-dos", frSlug: "mal-de-dos" };
const base = { locales: ["fr", "de", "en"] as const, translate, reserved: new Set(["articles", "paiement"]) };

describe("resolveSlugs", () => {
  it("première fois : traduit chaque slug (une requête par langue), l'enregistre, et le renvoie normalisé", async () => {
    translate.mockClear();
    const { store, records } = memoryStore();
    const map = await resolveSlugs({ ...base, pages: [SPORT, DOS], store });
    expect(map.get(SPORT.frSlug)!.slugs).toEqual({ fr: SPORT.frSlug, de: "sportosteopathie-dudelingen", en: "sports-osteopathy-dudelange" });
    expect(map.get(DOS.frSlug)!.slugs).toEqual({ fr: "mal-de-dos", de: "ruckenschmerzen", en: "back-pain" });
    expect(translate).toHaveBeenCalledTimes(2);
    expect(records).toHaveLength(4);
    expect(store.list).toHaveBeenLastCalledWith({ fresh: true }); // relecture finale sans cache
  });

  it("ensuite : relu tel quel, sans traduction ni écriture (une nouvelle traduction ne change jamais l'adresse)", async () => {
    const { store } = memoryStore();
    await resolveSlugs({ ...base, pages: [SPORT], store });
    translate.mockClear();
    vi.mocked(store.create).mockClear();
    const map = await resolveSlugs({ ...base, pages: [SPORT], store });
    expect(map.get(SPORT.frSlug)!.slugs.de).toBe("sportosteopathie-dudelingen");
    expect(translate).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
    expect(store.list).toHaveBeenCalledWith(); // lecture en cache seulement
  });

  it("nouvelle langue : seuls les slugs manquants sont traduits", async () => {
    const { store } = memoryStore([{ ...SPORT, locale: "de", slug: "sport-de", createdAt: 1 }]);
    translate.mockClear();
    const map = await resolveSlugs({ ...base, pages: [SPORT], store });
    expect(map.get(SPORT.frSlug)!.slugs).toEqual({ fr: SPORT.frSlug, de: "sport-de", en: "sports-osteopathy-dudelange" });
    expect(translate).toHaveBeenCalledTimes(1);
    expect(translate.mock.calls[0]![1]).toBe("en");
  });

  it("deux enregistrements pour la même page et la même langue (créations simultanées) : le plus ancien gagne, l'autre redirige", async () => {
    const { store } = memoryStore([
      { ...SPORT, locale: "de", slug: "zweiter", createdAt: 20 },
      { ...SPORT, locale: "de", slug: "erster", createdAt: 10 },
      { ...SPORT, locale: "en", slug: "sports", createdAt: 10 },
    ]);
    const { slugs, aliases } = (await resolveSlugs({ ...base, pages: [SPORT], store })).get(SPORT.frSlug)!;
    expect(slugs.de).toBe("erster");
    expect(aliases.de).toContain("zweiter");
  });

  it("slug déjà pris dans la langue, route du site ou slug français d'une autre page : suffixe -2", async () => {
    const lumbago = { pageKey: "page-lumbago", frSlug: "lumbago" };
    const { store } = memoryStore();
    const map = await resolveSlugs({ ...base, pages: [DOS, lumbago], store });
    expect(map.get("mal-de-dos")!.slugs.en).toBe("back-pain");
    expect(map.get("lumbago")!.slugs.en).toBe("back-pain-2");
    const paiement = { pageKey: "page-paiement", frSlug: "paiement-x" };
    const reserved = await resolveSlugs({ ...base, translate: async () => ({ "slug.paiement-x": "Paiement" }), pages: [paiement], store: memoryStore().store });
    expect(reserved.get("paiement-x")!.slugs.de).toBe("paiement-2");
    const other = await resolveSlugs({ ...base, translate: async (b) => Object.fromEntries(Object.keys(b).map((k) => [k, "mal de dos"])), pages: [DOS, SPORT], store: memoryStore().store });
    expect(other.get(SPORT.frSlug)!.slugs.de).toBe("mal-de-dos-2"); // le slug français de l'autre page reste à elle
  });

  it("traduction vide ou illisible : slug français", async () => {
    const map = await resolveSlugs({ ...base, translate: async () => ({}), pages: [DOS], store: memoryStore().store });
    expect(map.get("mal-de-dos")!.slugs.de).toBe("mal-de-dos");
  });

  it("anciennes adresses : slug français sous les autres langues, et après un changement de slug français, les anciens slugs", async () => {
    const { store, records } = memoryStore();
    await resolveSlugs({ ...base, pages: [DOS], store });
    // Le slug français change dans Notion (même page) : nouveaux slugs traduits, les anciens restent des alias.
    const renamed = { pageKey: "page-dos", frSlug: "lumbago" };
    const { slugs, aliases } = (await resolveSlugs({ ...base, pages: [renamed], store })).get("lumbago")!;
    // Traduction identique pour la même page (« back-pain ») : elle garde son adresse anglaise.
    expect(slugs).toEqual({ fr: "lumbago", de: "hexenschuss", en: "back-pain" });
    expect(aliases.fr).toEqual(["mal-de-dos"]);
    expect(aliases.de).toEqual(expect.arrayContaining(["mal-de-dos", "lumbago", "ruckenschmerzen"]));
    expect(aliases.en).toEqual(expect.arrayContaining(["mal-de-dos", "lumbago"]));
    expect(aliases.en).not.toContain("back-pain");
    expect(aliases.de).not.toContain("hexenschuss");
    expect(records).toHaveLength(4);
  });

  it("français seul : rien à traduire ni à écrire", async () => {
    const { store } = memoryStore();
    const map = await resolveSlugs({ ...base, locales: ["fr"], pages: [DOS], store });
    expect(map.get("mal-de-dos")).toEqual({ slugs: { fr: "mal-de-dos" }, aliases: { fr: [] } });
    expect(store.create).not.toHaveBeenCalled();
  });
});
