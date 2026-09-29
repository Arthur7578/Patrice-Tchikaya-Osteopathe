import type { PageObjectResponse } from "@notionhq/client";
import { describe, expect, it } from "vitest";
import { getCheckbox, getDateStart, getNumber, getText, getUrl, richTextToPlain } from "./properties";

const rt = (text: string, href: string | null = null) => ({ plain_text: text, href }) as never;
const props = (o: Record<string, unknown>) => o as PageObjectResponse["properties"];

describe("getText", () => {
  it("lit chaque type de propriété texte", () => {
    const p = props({
      t: { type: "title", title: [rt(" Titre ")] },
      r: { type: "rich_text", rich_text: [rt("a"), rt("b")] },
      u: { type: "url", url: "https://x.test" },
      n: { type: "number", number: 12 },
      s: { type: "select", select: { name: "Choix" } },
      e: { type: "email", email: "a@b.test" },
      ph: { type: "phone_number", phone_number: "+352 1" },
    });
    expect(["t", "r", "u", "n", "s", "e", "ph"].map((k) => getText(p, k))).toEqual([
      "Titre", "ab", "https://x.test", "12", "Choix", "a@b.test", "+352 1",
    ]);
  });

  it("renvoie '' pour une propriété absente, vide ou d'un autre type", () => {
    const p = props({
      n: { type: "number", number: null },
      s: { type: "select", select: null },
      u: { type: "url", url: null },
      c: { type: "checkbox", checkbox: true },
    });
    expect(["absente", "n", "s", "u", "c"].map((k) => getText(p, k))).toEqual(["", "", "", "", ""]);
  });

  it("richTextToPlain concatène puis rogne", () => {
    expect(richTextToPlain([rt("  a"), rt("b  ")])).toBe("ab");
  });
});

describe("getUrl", () => {
  it("propriété url : renvoie la valeur brute", () => {
    expect(getUrl(props({ u: { type: "url", url: "https://x.test/a" } }), "u")).toBe("https://x.test/a");
    expect(getUrl(props({ u: { type: "url", url: null } }), "u")).toBeNull();
  });

  it("texte enrichi : préfère le href du lien, sinon le texte s'il est une URL valide", () => {
    const withHref = props({ r: { type: "rich_text", rich_text: [rt("cliquez", "https://cal.eu/x")] } });
    const plain = props({ r: { type: "title", title: [rt(" https://cal.eu/y ")] } });
    expect(getUrl(withHref, "r")).toBe("https://cal.eu/x");
    expect(getUrl(plain, "r")).toBe("https://cal.eu/y");
  });

  it("renvoie null si absent, non-URL ou d'un autre type", () => {
    expect(getUrl(props({}), "x")).toBeNull();
    expect(getUrl(props({ r: { type: "rich_text", rich_text: [rt("pas une url")] } }), "r")).toBeNull();
    expect(getUrl(props({ n: { type: "number", number: 1 } }), "n")).toBeNull();
  });
});

describe("getNumber / getCheckbox / getDateStart", () => {
  const p = props({
    n: { type: "number", number: 3 },
    c: { type: "checkbox", checkbox: false },
    d: { type: "date", date: { start: "2026-09-29" } },
    dn: { type: "date", date: null },
  });
  it("lisent la valeur typée", () => {
    expect(getNumber(p, "n")).toBe(3);
    expect(getCheckbox(p, "c")).toBe(false);
    expect(getDateStart(p, "d")).toBe("2026-09-29");
  });
  it("renvoient null si absent, vide ou d'un autre type (checkbox absente = ne pas filtrer)", () => {
    expect(getNumber(p, "c")).toBeNull();
    expect(getCheckbox(p, "absente")).toBeNull();
    expect(getDateStart(p, "dn")).toBeNull();
    expect(getDateStart(p, "n")).toBeNull();
  });
});
