import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClaudeTranslator, identityTranslator, TranslationError, validateTranslation, type Problem } from "./translate";

/** Problèmes résumés « clé type » (ex. « a doctor »). */
const summary = (problems: Problem[]) => problems.map((p) => `${p.key ?? "*"} ${p.code}`);
const check = (source: Record<string, string>, translated: unknown, names?: string[]) => summary(validateTranslation(source, translated, names));

describe("validateTranslation", () => {
  const source = { a: "Bonjour <b>vous</b>", b: 'Voir <a n="0">ici</a>' };

  it("accepte une traduction complète qui garde les balises (déplacées)", () => {
    expect(check(source, { a: "<b>You</b>, hello", b: 'See <a n="0">here</a>' })).toEqual([]);
  });

  it.each([
    ["réponse non JSON", null, ["* json"]],
    ["clé manquante", { a: "<b>x</b>" }, ["b missing"]],
    ["texte vide", { a: " ", b: '<a n="0">x</a>' }, ["a missing"]],
    ["balise perdue", { a: "Hello you", b: '<a n="0">x</a>' }, ["a tags"]],
    ["lien renuméroté", { a: "<b>x</b>", b: '<a n="1">x</a>' }, ["b tags"]],
  ])("rejette : %s", (_label, translated, problems) => {
    expect(check(source, translated)).toEqual(problems);
  });

  it("règle 10 : un médecin cité comme profession se traduit fidèlement, dans chaque langue", () => {
    const source = { a: "Consultez un médecin en cas d'urgence.", b: "Consultez un docteur si la douleur persiste." };
    expect(check(source, { a: "See a doctor in an emergency.", b: "See a doctor if the pain persists." })).toEqual([]);
    expect(check(source, { a: "Im Notfall einen Arzt aufsuchen.", b: "Gehen Sie zum Arzt, wenn der Schmerz anhält." })).toEqual([]);
    expect(check(source, { a: "Am Noutfall bei en Dokter goen.", b: "Gitt bei en Dokter." })).toEqual([]);
    expect(check(source, { a: "Em caso de urgência, consulte um médico.", b: "Consulte um médico." })).toEqual([]);
    expect(check({ a: "Suivi médical" }, { a: "Acompanhamento médico" })).toEqual([]); // adjectif portugais
  });

  it("règle 10 : les spécialités françaises traduites par un composé allemand en « -arzt » sont permises", () => {
    expect(check({ a: "Parlez-en à votre généraliste ou à un pédiatre." }, { a: "Sprechen Sie mit Ihrem Hausarzt oder einem Kinderarzt." })).toEqual([]);
    expect(check({ a: "Un dentiste peut vérifier la mâchoire." }, { a: "Ein Zahnarzt kann den Kiefer untersuchen." })).toEqual([]);
  });

  it("règle 10 : refuse une traduction qui présente l'ostéopathe comme médecin, en nommant le mot ajouté", () => {
    expect(check({ a: "Votre ostéopathe" }, { a: "Your doctor" })).toEqual(["a doctor"]);
    expect(check({ a: "Votre ostéopathe" }, { a: "Ären Dokter" })).toEqual(["a doctor"]);
    expect(check({ a: "Au cabinet" }, { a: "In der Arztpraxis" })).toEqual(["a doctor"]);
    expect(check({ a: "Votre ostéopathe" }, { a: "O seu médico" })).toEqual(["a doctor"]);
    // Un médecin cité dans le français n'autorise pas à en ajouter un second (l'ostéopathe).
    const problems = validateTranslation({ a: "Votre ostéopathe, ou un médecin" }, { a: "Your doctor, or a physician" });
    expect(summary(problems)).toEqual(["a doctor"]);
    expect(problems[0]!.reason).toContain('"physician"');
  });

  it("règle 10 : refuse un titre de docteur ajouté devant le nom du praticien, même si le français cite un médecin", () => {
    const names = ["Patrice", "Tchikaya"];
    expect(check({ a: "Patrice Tchikaya vous reçoit. Consultez un médecin si fièvre." }, { a: "Dr Tchikaya will see you. If fever, see a physician." }, names))
      .toEqual(["a doctor", "a title"]);
    expect(check({ a: "Le docteur Martin vous a orienté vers Patrice" }, { a: "Dr Martin referred you to Patrice" }, names)).toEqual([]);
    // Titre déjà dans le français (avis d'un patient cité tel quel) : la traduction le garde.
    expect(check({ a: "Merci au docteur Tchikaya !" }, { a: "Thank you Dr Tchikaya!" }, names)).toEqual([]);
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
    expect(params).not.toHaveProperty("thinking"); // réflexion adaptative par défaut (la désactiver est refusé)
    expect(params.system).toMatch(/never present him or his practice as a doctor/);
    expect(params.system).toMatch(/translate those mentions faithfully/);
    expect(JSON.stringify(params.messages)).toContain("Target language: Luxembourgish");
    expect(params.output_config).toEqual({
      effort: "high",
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

  it("réponse invalide : redemandée, jusqu'à 3 essais (noms du praticien transmis à la vérification)", async () => {
    const { client, stream } = fakeClient([{ text: "pas du json" }, { text: JSON.stringify({ a: "Dr Tchikaya, osteopath" }) }, { text: JSON.stringify({ a: "Tchikaya, osteopath" }) }]);
    expect(await createClaudeTranslator(client)({ a: "Tchikaya, ostéopathe" }, "en", ["Tchikaya"])).toEqual({ a: "Tchikaya, osteopath" });
    expect(stream).toHaveBeenCalledTimes(3);
  });

  it("nouvel essai : le modèle reçoit la raison du refus (mot ajouté compris)", async () => {
    const { client, calls } = fakeClient([{ text: JSON.stringify({ a: "Your doctor" }) }, { text: JSON.stringify({ a: "Your osteopath" }) }]);
    expect(await createClaudeTranslator(client)({ a: "Votre ostéopathe" }, "en")).toEqual({ a: "Your osteopath" });
    const retry = JSON.stringify(calls[1]!.messages);
    expect(retry).toContain("previous translation of this batch was rejected");
    expect(retry).toContain('id \\"a\\"');
    expect(retry).toContain("doctor");
    expect(JSON.stringify(calls[0]!.messages)).not.toContain("rejected");
  });

  it("3 essais refusés pour un texte : celui-là reste en français, les autres sont traduits (la page n'est pas bloquée)", async () => {
    const bad = JSON.stringify({ a: "Your doctor", b: "Hello" });
    const { client } = fakeClient([{ text: bad }, { text: bad }, { text: bad }]);
    expect(await createClaudeTranslator(client)({ a: "Votre ostéopathe", b: "Bonjour" }, "en")).toEqual({ a: "Votre ostéopathe", b: "Hello" });
    expect(console.warn).toHaveBeenLastCalledWith(expect.stringContaining("laissé(s) en français"));
  });

  it("journal d'un refus : la clé, la raison et les deux textes", async () => {
    const { client } = fakeClient([{ text: JSON.stringify({ a: "Your doctor" }) }, { text: JSON.stringify({ a: "Your osteopath" }) }]);
    await createClaudeTranslator(client)({ a: "Votre ostéopathe" }, "en");
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/a : it mentions a doctor.*FR : « Votre ostéopathe ».*traduction : « Your doctor »/));
  });

  it("3 réponses illisibles : erreur (rien n'est mis en cache, la requête suivante réessaie)", async () => {
    const { client } = fakeClient([{ text: "pas du json" }, { text: "toujours pas" }, { text: "[]x" }]);
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
