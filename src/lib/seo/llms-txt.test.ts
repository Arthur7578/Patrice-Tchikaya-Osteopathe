import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import { buildLlmsTxt } from "./llms-txt";

describe("buildLlmsTxt", () => {
  const out = buildLlmsTxt(FALLBACK_CONTENT, "https://exemple.test");

  it("respecte le format llms.txt : un seul H1, résumé en citation, sections H2", () => {
    expect(out.match(/^# /gm)).toHaveLength(1);
    expect(out.split("\n")[0]).toContain(FALLBACK_CONTENT.practitioner.name);
    expect(out).toMatch(/^> .+/m);
    expect(out).toMatch(/^## /m);
  });

  it("reprend les faits du site (NAP, motifs, FAQ, lien de RDV)", () => {
    expect(out).toContain(FALLBACK_CONTENT.contact.phoneDisplay);
    expect(out).toContain(FALLBACK_CONTENT.contact.street);
    for (const m of FALLBACK_CONTENT.motifs) expect(out).toContain(m.title);
    for (const f of FALLBACK_CONTENT.faq) expect(out).toContain(f.question);
    expect(out).toContain(`](${FALLBACK_CONTENT.booking.url})`);
    expect(out).toContain("(https://exemple.test/mentions-legales)");
  });

  it("n'écrit jamais « médecin » ni « Dr »", () => {
    expect(out).not.toMatch(/médecin|\bDr\b/i);
  });

  it("omet les champs vides", () => {
    const out2 = buildLlmsTxt({ ...FALLBACK_CONTENT, consultation: { ...FALLBACK_CONTENT.consultation, price: null } });
    expect(out2).not.toContain("Tarif :");
  });
});
