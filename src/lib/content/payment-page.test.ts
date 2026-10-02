import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT } from "./fallback";
import { buildPaymentPage, type PaymentRow } from "./payment-page";

const F = FALLBACK_CONTENT.payment.page;
const texte = (name: string, text: string): PaymentRow => ({ name, type: "Texte", text });
const build = (rows: PaymentRow[], fallback = F) => {
  const warnings: string[] = [];
  return { page: buildPaymentPage(rows, fallback, (w) => warnings.push(w)), warnings };
};

describe("buildPaymentPage (textes de /paiement depuis Notion)", () => {
  it("clés de ligne tolérantes : casse, accents, espaces et ponctuation autour", () => {
    const { page, warnings } = build([
      texte("Titre  Page", "Payer"),
      texte("« Meta_Title »", "Titre SEO"),
      texte("meta description", "Description SEO"),
    ]);
    expect(page.title).toBe("Payer");
    expect(page.metaTitle).toBe("Titre SEO");
    expect(page.metaDescription).toBe("Description SEO");
    expect(warnings.filter((w) => w.includes("inconnue"))).toEqual([]);
  });

  it("types tolérants (« ÉTAPE », « etape ») ; titres et textes rognés", () => {
    const { page } = build([
      texte("Titre_Etapes", "  Étapes  "),
      { name: "  Ouvrez Wero  ", type: "ÉTAPE", text: "  Dans l'application.  " },
      { name: "Validez", type: "etape", text: "" },
    ]);
    expect(page.steps).toEqual({
      title: "Étapes",
      cards: [
        { title: "Ouvrez Wero", text: "Dans l'application." },
        { title: "Validez", text: "" },
      ],
    });
  });

  it("titre de section personnalisé pour chaque section de cartes", () => {
    const { page } = build([
      texte("Titre_Securite", "Sûr"),
      texte("Titre_Premiere_Utilisation", "Première fois"),
      { name: "Banques", type: "Sécurité", text: "EPI." },
      { name: "Installer", type: "Première utilisation", text: "Dans votre banque." },
    ]);
    expect(page.reassurance?.title).toBe("Sûr");
    expect(page.firstTime?.title).toBe("Première fois");
  });

  it("texte d'attente = crochets autour de TOUTE la valeur ; crochets au milieu = vrai texte", () => {
    const { page } = build([
      texte("Encart", "[Facultatif : un encart]"),
      texte("Introduction", "Voir [ci-dessous]"),
      texte("Surtitre", "[1] Paiement"),
      texte("Texte_Aide", "  Appelez le cabinet.  "),
    ]);
    expect(page.caution).toBeNull();
    expect(page.intro).toBe("Voir [ci-dessous]");
    expect(page.eyebrow).toBe("[1] Paiement");
    expect(page.help.text).toBe("Appelez le cabinet.");
  });

  it("section avec cartes mais sans titre ni titre de secours : titre vide + avertissement (pas d'exception)", () => {
    const { page, warnings } = build([{ name: "Carte", type: "Étape", text: "Texte." }], { ...F, steps: null });
    expect(page.steps).toEqual({ title: "", cards: [{ title: "Carte", text: "Texte." }] });
    expect(warnings).toContain("Champ obligatoire vide dans Page_Paiement : Titre_Etapes (valeur de secours utilisée)");
  });

  it("texte vide ou fait d'espaces : absent (secours et avertissement si obligatoire, masqué sinon)", () => {
    const { page, warnings } = build([texte("Titre_Page", "   "), texte("Introduction", ""), texte("Surtitre", " \n ")]);
    expect(page.title).toBe(F.title);
    expect(page.intro).toBeNull();
    expect(page.eyebrow).toBeNull();
    expect(warnings).toContain("Champ obligatoire vide dans Page_Paiement : Titre_Page (valeur de secours utilisée)");
  });

  it("chaque champ obligatoire manquant est signalé sous le nom de sa ligne Notion", () => {
    const cards: PaymentRow[] = [
      { name: "Ouvrez Wero", type: "Étape", text: "x" },
      { name: "Paiement sûr", type: "Sécurité", text: "x" },
      { name: "Pas encore Wero ?", type: "Première utilisation", text: "x" },
    ];
    const { warnings } = build(cards);
    expect(warnings).toEqual(
      [
        "Titre_Page", "Titre_Etapes", "Titre_Securite", "Titre_Premiere_Utilisation", "Titre_Aide", "Libelle_Numero",
        "Libelle_Email", "Libelle_Nom", "Libelle_Tarif", "Libelle_Encart", "Libelle_Autres_Moyens",
      ].map((label) => `Champ obligatoire vide dans Page_Paiement : ${label} (valeur de secours utilisée)`),
    );
  });

  it("carte sans titre ignorée ; clé ou type inconnus signalés et ignorés", () => {
    const { page, warnings } = build([
      { name: "[Titre]", type: "Étape", text: "Orpheline." },
      texte("Titre_Inconnu", "x"),
      { name: "Ligne", type: "Autre", text: "x" },
    ]);
    expect(page.steps).toBeNull();
    expect(warnings).toEqual(
      expect.arrayContaining([
        "Page_Paiement : clé « Titre_Inconnu » inconnue, ligne ignorée",
        "Page_Paiement : type « Autre » inconnu pour « Ligne », ligne ignorée",
      ]),
    );
  });
});
