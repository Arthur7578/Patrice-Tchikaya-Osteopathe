import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClaudeTranslator, identityTranslator, TranslationError, validateTranslation } from "./translate";

describe("validateTranslation", () => {
  const source = { a: "Bonjour <b>vous</b>", b: 'Voir <a n="0">ici</a>' };

  it("accepte une traduction complète qui garde les balises (déplacées)", () => {
    expect(validateTranslation(source, { a: "<b>You</b>, hello", b: 'See <a n="0">here</a>' })).toEqual([]);
  });

  it.each([
    ["réponse non JSON", null, ["réponse non JSON"]],
    ["clé manquante", { a: "<b>x</b>" }, ["b : traduction absente"]],
    ["texte vide", { a: " ", b: '<a n="0">x</a>' }, ["a : traduction absente"]],
    ["balise perdue", { a: "Hello you", b: '<a n="0">x</a>' }, ["a : balises modifiées"]],
    ["lien renuméroté", { a: "<b>x</b>", b: '<a n="1">x</a>' }, ["b : balises modifiées"]],
  ])("rejette : %s", (_label, translated, problems) => {
    expect(validateTranslation(source, translated)).toEqual(problems);
  });

  it("règle 10 : refuse « doctor », « Dokter »… sauf si le français cite lui-même un médecin", () => {
    expect(validateTranslation({ a: "Votre ostéopathe" }, { a: "Your doctor" })).toEqual(["a : titre interdit (règle 10)"]);
    expect(validateTranslation({ a: "Votre ostéopathe" }, { a: "Ären Dokter" })).toEqual(["a : titre interdit (règle 10)"]);
    expect(validateTranslation({ a: "Votre ostéopathe" }, { a: "Dr Tchikaya" })).toEqual(["a : titre interdit (règle 10)"]);
    expect(validateTranslation({ a: "Parlez-en à votre médecin" }, { a: "Talk to your doctor" })).toEqual([]);
    expect(validateTranslation({ a: "Suivi médical" }, { a: "Acompanhamento médico" })).toEqual([]); // adjectif portugais
  });
});

type Reply = { text?: string; stop_reason?: string };
function fakeClient(replies: Reply[]) {
  const calls: Array<Record<string, unknown>> = [];
  const stream = vi.fn((params: Record<string, unknown>) => {
    calls.push(params);
    const reply = replies.shift() ?? { text: "{}" };
    return {
      finalMessage: async () => ({
        stop_reason: reply.stop_reason ?? "end_turn",
        content: reply.text === undefined ? [] : [{ type: "text", text: reply.text }],
      }),
    };
  });
  return { client: { beta: { messages: { stream } } } as unknown as Anthropic, calls, stream };
}

describe("createClaudeTranslator", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("un appel : langue cible, consignes, réponse contrainte par un schéma aux clés exactes", async () => {
    const { client, calls } = fakeClient([{ text: JSON.stringify({ a: "Hello", b: "Bye" }) }]);
    expect(await createClaudeTranslator(client)({ a: "Bonjour", b: "Au revoir" }, "lb")).toEqual({ a: "Hello", b: "Bye" });
    const params = calls[0]!;
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.system).toMatch(/never call him a doctor/);
    expect(JSON.stringify(params.messages)).toContain("Target language: Luxembourgish");
    expect(params.output_config).toEqual({
      effort: "medium",
      format: {
        type: "json_schema",
        schema: { type: "object", properties: { a: { type: "string" }, b: { type: "string" } }, required: ["a", "b"], additionalProperties: false },
      },
    });
    expect(params.fallbacks).toBe("default");
  });

  it("ne garde que les clés demandées (une clé en trop dans la réponse est ignorée)", async () => {
    const { client } = fakeClient([{ text: JSON.stringify({ a: "Hello", z: "?" }) }]);
    expect(await createClaudeTranslator(client)({ a: "Bonjour" }, "en")).toEqual({ a: "Hello" });
  });

  it("lot vide : aucun appel", async () => {
    const { client, stream } = fakeClient([]);
    expect(await createClaudeTranslator(client)({}, "en")).toEqual({});
    expect(stream).not.toHaveBeenCalled();
  });

  it("réponse invalide : redemandée, jusqu'à 3 essais", async () => {
    const { client, stream } = fakeClient([{ text: "pas du json" }, { text: JSON.stringify({ a: "Your doctor" }) }, { text: JSON.stringify({ a: "Your osteopath" }) }]);
    expect(await createClaudeTranslator(client)({ a: "Votre ostéopathe" }, "en")).toEqual({ a: "Your osteopath" });
    expect(stream).toHaveBeenCalledTimes(3);
  });

  it("3 réponses invalides : erreur (rien n'est mis en cache, la requête suivante réessaie)", async () => {
    const { client } = fakeClient([{ text: "{}" }, { text: "{}" }, { text: "{}" }]);
    await expect(createClaudeTranslator(client)({ a: "Bonjour" }, "en")).rejects.toThrow(TranslationError);
  });

  it.each([
    ["refus", "refusal", /refusée/],
    ["réponse tronquée", "max_tokens", /tronquée/],
  ])("%s : erreur immédiate", async (_label, stop_reason, message) => {
    const { client, stream } = fakeClient([{ text: "{}", stop_reason }]);
    await expect(createClaudeTranslator(client)({ a: "Bonjour" }, "en")).rejects.toThrow(message);
    expect(stream).toHaveBeenCalledTimes(1);
  });
});

describe("identityTranslator (CI, tests)", () => {
  it("renvoie le français, dans un nouvel objet", async () => {
    const batch = { a: "Bonjour" };
    const out = await identityTranslator(batch, "en");
    expect(out).toEqual(batch);
    expect(out).not.toBe(batch);
  });
});
