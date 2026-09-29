import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT } from "./fallback";
import { buildPaymentPage, type PaymentRow } from "./payment-page";

const F = FALLBACK_CONTENT.payment.page;
const row = (name: string, type: string, text: string): PaymentRow => ({ name, type, text });

function build(rows: PaymentRow[]) {
  const warnings: string[] = [];
  return { page: buildPaymentPage(rows, F, (m) => warnings.push(m)), warnings };
}

describe("buildPaymentPage", () => {
  it("range chaque ligne dans sa section, dans l'ordre reçu ; une section sans carte est masquée", () => {
    const { page, warnings } = build([
      row("Titre_Page", "Texte", "Titre"),
      row("Titre_Etapes", "Texte", "Mes étapes"),
      row("Titre_Aide", "Texte", "Aide"),
      row("Un", "Étape", "Premier."),
      row("Deux", "Étape", "Deuxième."),
    ]);
    expect(page.title).toBe("Titre");
    expect(page.steps).toEqual({
      title: "Mes étapes",
      cards: [
        { title: "Un", text: "Premier." },
        { title: "Deux", text: "Deuxième." },
      ],
    });
    expect(page.reassurance).toBeNull();
    expect(page.firstTime).toBeNull();
    expect(warnings).toEqual([]);
  });

  it("clés et types tolérants à la casse, aux accents et aux séparateurs", () => {
    const { page } = build([
      row("titre page", "texte", "Titre"),
      row("SURTITRE", "Texte", "Sur-titre"),
      row("Carte", "ETAPE", "Texte."),
      row("Autre", "premiere utilisation", "Texte."),
      row("Titre_Premiere_Utilisation", "Texte", "Première fois"),
    ]);
    expect(page.title).toBe("Titre");
    expect(page.eyebrow).toBe("Sur-titre");
    expect(page.steps?.cards).toHaveLength(1);
    expect(page.firstTime).toEqual({ title: "Première fois", cards: [{ title: "Autre", text: "Texte." }] });
  });

  it("élément facultatif absent, vide ou entre crochets : masqué (null)", () => {
    const { page, warnings } = build([
      row("Titre_Page", "Texte", "Titre"),
      row("Introduction", "Texte", "[Facultatif — laisser tel quel pour ne rien afficher]"),
      row("Encart", "Texte", "   "),
      row("Titre_Aide", "Texte", "Aide"),
    ]);
    expect(page.eyebrow).toBeNull();
    expect(page.intro).toBeNull();
    expect(page.caution).toBeNull();
    expect(page.metaTitle).toBeNull();
    expect(page.help).toEqual({ title: "Aide", text: null });
    expect(warnings).toEqual([]);
  });

  it("titre obligatoire vide : valeur de secours + avertissement", () => {
    const { page, warnings } = build([row("Titre_Page", "Texte", "[À COMPLÉTER]"), row("Carte", "Sécurité", "Texte.")]);
    expect(page.title).toBe(F.title);
    expect(page.reassurance?.title).toBe(F.reassurance?.title);
    expect(page.help.title).toBe(F.help.title);
    expect(warnings).toEqual([
      "Champ obligatoire vide dans Page_Paiement : Titre_Page (valeur de secours utilisée)",
      "Champ obligatoire vide dans Page_Paiement : Titre_Securite (valeur de secours utilisée)",
      "Champ obligatoire vide dans Page_Paiement : Titre_Aide (valeur de secours utilisée)",
    ]);
  });

  it("ignore avec avertissement une clé ou un type inconnu, et une carte sans titre sans bruit", () => {
    const { page, warnings } = build([
      row("Titre_Page", "Texte", "Titre"),
      row("Titre_Aide", "Texte", "Aide"),
      row("Titre_Inconnu", "Texte", "x"),
      row("Carte", "Bonus", "x"),
      row("[À COMPLÉTER]", "Étape", "x"),
      row("", "Étape", "x"),
    ]);
    expect(page.steps).toBeNull();
    expect(warnings).toEqual([
      "Page_Paiement : clé « Titre_Inconnu » inconnue, ligne ignorée",
      "Page_Paiement : type « Bonus » inconnu pour « Carte », ligne ignorée",
    ]);
  });

  it("un texte libre n'est jamais pris pour un texte d'attente parce qu'il contient « mettre le » ou « todo »", () => {
    const { page } = build([
      row("Titre_Page", "Texte", "Titre"),
      row("Introduction", "Texte", "Pensez à mettre le montant exact."),
      row("Carte", "Étape", "Vous pouvez mettre le message que vous voulez (todo)."),
    ]);
    expect(page.intro).toBe("Pensez à mettre le montant exact.");
    expect(page.steps?.cards[0].text).toBe("Vous pouvez mettre le message que vous voulez (todo).");
  });

  it("carte sans texte : gardée avec le titre seul", () => {
    const { page } = build([row("Titre_Page", "Texte", "T"), row("Carte", "Étape", "[À COMPLÉTER]")]);
    expect(page.steps?.cards).toEqual([{ title: "Carte", text: "" }]);
  });
});
