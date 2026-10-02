import { describe, expect, it } from "vitest";
import { contentDrift } from "./drift";
import { FALLBACK_CONTENT } from "./fallback";
import type { SiteContent } from "./types";

const clone = () => structuredClone(FALLBACK_CONTENT) as SiteContent;

describe("contentDrift", () => {
  it("contenu identique : aucun écart", () => {
    expect(contentDrift(FALLBACK_CONTENT, clone())).toEqual([]);
  });

  it("signale un texte modifié, avec son chemin et les deux valeurs", () => {
    const live = clone();
    live.languages = ["Français", "Portugais"];
    live.access.bus = "Arrêt déplacé.";
    const drift = contentDrift(FALLBACK_CONTENT, live);
    expect(drift).toHaveLength(5);
    expect(drift).toContain(`languages.1 : secours "Anglais" ≠ Notion "Portugais"`);
    expect(drift).toContain(`languages.2 : secours "Italien" ≠ Notion absent`);
    expect(drift).toContain(`languages.4 : secours ${JSON.stringify(FALLBACK_CONTENT.languages[4])} ≠ Notion absent`);
    expect(drift.find((line) => line.startsWith("access.bus"))).toContain(`≠ Notion "Arrêt déplacé."`);
  });

  it("signale un élément ajouté dans Notion (absent du secours) et un champ passé à vide", () => {
    const live = clone();
    live.faq.push({ question: "Nouvelle ?", answer: "Oui." });
    live.consultation.price = null;
    const drift = contentDrift(FALLBACK_CONTENT, live);
    expect(drift).toContain(`faq.4 : secours absent ≠ Notion {"question":"Nouvelle ?","answer":"Oui."}`);
    expect(drift).toContain(`consultation.price : secours "90 €" ≠ Notion null`);
  });

  it("ignore l'identifiant de page Notion et les URL des photos", () => {
    const live = clone();
    live.motifs[0].notionPageId = "3e84bf3fc72880e581b0ed699e9db9eb";
    live.images.hero.src = "https://exemple.public.blob.vercel-storage.com/hero.jpeg";
    expect(contentDrift(FALLBACK_CONTENT, live)).toEqual([]);
  });

  it("ignore les pages d'information (guides), absentes du secours par choix", () => {
    const live = clone();
    live.guides = [{ title: "Guide", slug: "guide", description: "Description.", icon: "Sparkles", notionPageId: "abc", page: null }];
    expect(contentDrift(FALLBACK_CONTENT, live)).toEqual([]);
  });

  it("l'alt d'une photo, lui, est comparé", () => {
    const live = clone();
    live.images.hero.alt = "Autre description";
    expect(contentDrift(FALLBACK_CONTENT, live)).toEqual([
      expect.stringMatching(/^images\.hero\.alt : secours "Cabinet d'ostéopathie/),
    ]);
  });

  it("tronque les valeurs longues", () => {
    const live = clone();
    live.about.longBio = "x".repeat(300);
    const [line] = contentDrift(FALLBACK_CONTENT, live);
    expect(line.startsWith("about.longBio : secours ")).toBe(true);
    expect(line).toContain("…");
    expect(line.length).toBeLessThan(260);
  });
});
