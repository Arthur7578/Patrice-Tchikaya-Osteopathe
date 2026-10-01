import { beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/content/ui-copy";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import type { PaymentPage, SiteContent } from "@/lib/content/types";
import { expectSiteRules, renderPage, visibleText } from "@/test/render";

const getSiteContent = vi.fn<() => Promise<SiteContent>>();
vi.mock("@/lib/content/get-site-content", () => ({ getSiteContent }));

const { default: Paiement, generateMetadata } = await import("./page");

/** Contenu de secours, avec des morceaux de la page /paiement remplacés. */
const withPayment = (payment: Partial<SiteContent["payment"]> = {}, page: Partial<PaymentPage> = {}): SiteContent => ({
  ...C,
  payment: { ...C.payment, ...payment, page: { ...C.payment.page, ...page } },
});
const NBSP = / | /g;
const text = async (c: SiteContent) => {
  getSiteContent.mockResolvedValue(c);
  return visibleText(await renderPage(Paiement)).replace(NBSP, " ");
};

beforeEach(() => getSiteContent.mockReset().mockResolvedValue(C));

describe("/paiement : métadonnées", () => {
  it("canonical /paiement (règle 9)", async () => {
    expect((await generateMetadata()).alternates?.canonical).toBe("/paiement");
  });

  it("titre et description par défaut (dérivés de la ville) sans surcharge Notion", async () => {
    const m = await generateMetadata();
    expect(m.title).toBe(COPY.payment.metaTitle);
    expect(m.description).toBe(COPY.payment.metaDescription(C.contact.locality));
  });

  it("Meta_Title et Meta_Description de Notion l'emportent", async () => {
    getSiteContent.mockResolvedValue(withPayment({}, { metaTitle: "Titre Notion", metaDescription: "Description Notion" }));
    expect(await generateMetadata()).toMatchObject({ title: "Titre Notion", description: "Description Notion" });
  });
});

describe("/paiement : rendu", () => {
  it("un seul <h1> (le titre Notion), règles du site, retour à l'accueil", async () => {
    getSiteContent.mockResolvedValue(C);
    const root = await renderPage(Paiement);
    const h1 = root.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(h1[0]!.text.replace(NBSP, " ")).toBe(C.payment.page.title);
    expect(root.querySelector('a[href="/"]')).not.toBeNull();
    expectSiteRules(root);
  });

  it("aucune animation d'apparition, aucun script tiers", async () => {
    getSiteContent.mockResolvedValue(C);
    const root = await renderPage(Paiement);
    expect(root.querySelectorAll("[data-reveal], script[src], iframe")).toHaveLength(0);
  });

  it("étapes numérotées : une <li> par carte, avec un libellé « Étape N » pour les lecteurs d'écran", async () => {
    getSiteContent.mockResolvedValue(C);
    const root = await renderPage(Paiement);
    const steps = root.querySelectorAll("#etapes-title ~ ol > li");
    expect(steps).toHaveLength(C.payment.page.steps!.cards.length);
    expect(steps[0]!.querySelector(".sr-only")?.text).toBe(COPY.payment.step(1));
  });

  it("l'aide affiche le téléphone du cabinet en lien tel: et la phrase de remboursement", async () => {
    getSiteContent.mockResolvedValue(C);
    const root = await renderPage(Paiement);
    expect(root.querySelector(`#aide-title ~ a[href="tel:${C.contact.phoneE164}"]`)).not.toBeNull();
    expect(visibleText(root)).toContain(C.consultation.reimbursement.slice(0, 30));
  });
});

describe("/paiement : ce qui n'est pas renseigné n'est pas affiché", () => {
  it("sans coordonnées Wero : ni numéro, ni e-mail, ni nom du bénéficiaire", async () => {
    const t = await text(withPayment({ wero: { recipient: null, recipientName: "Nom Beneficiaire" } }));
    expect(t).not.toContain("Nom Beneficiaire");
    expect(t).not.toContain(C.payment.page.labels.phone);
  });

  it("numéro Wero : libellé « numéro » ; e-mail : libellé « e-mail » ; nom du bénéficiaire affiché", async () => {
    const labels = C.payment.page.labels;
    const phone = await text(withPayment({ wero: { recipient: { value: "+352 691 000 000", kind: "phone" }, recipientName: "P. Tchikaya" } }));
    expect(phone).toContain(labels.phone);
    expect(phone).toContain("+352 691 000 000");
    expect(phone).toContain("P. Tchikaya");
    const email = await text(withPayment({ wero: { recipient: { value: "cabinet@exemple.lu", kind: "email" }, recipientName: null } }));
    expect(email).toContain(labels.email);
    expect(email).toContain("cabinet@exemple.lu");
  });

  it("le tarif est masqué tant qu'il n'est pas renseigné, affiché ensuite", async () => {
    const wero = { recipient: { value: "+352 691 000 000", kind: "phone" as const }, recipientName: null };
    getSiteContent.mockResolvedValue({ ...withPayment({ wero }), consultation: { ...C.consultation, price: null } });
    expect(visibleText(await renderPage(Paiement))).not.toContain(C.payment.page.labels.price);
    getSiteContent.mockResolvedValue({ ...withPayment({ wero }), consultation: { ...C.consultation, price: "60 €" } });
    expect(visibleText(await renderPage(Paiement)).replace(NBSP, " ")).toContain("60 €");
  });

  it("sections sans ligne dans Notion : masquées (étapes, sécurité, première utilisation, encart)", async () => {
    getSiteContent.mockResolvedValue(withPayment({}, { steps: null, reassurance: null, firstTime: null, caution: null }));
    const root = await renderPage(Paiement);
    for (const id of ["etapes-title", "securite-title", "premiere-fois-title"]) expect(root.querySelector(`#${id}`), id).toBeNull();
    expect(visibleText(root)).not.toContain(`${C.payment.page.labels.caution} :`);
    expect(root.querySelector("#aide-title")).not.toBeNull(); // l'aide reste toujours affichée
  });

  it("l'encart « Bon à savoir » apparaît quand il est renseigné, avec ou sans étapes", async () => {
    for (const steps of [C.payment.page.steps, null]) {
      const t = await text(withPayment({}, { steps, caution: "Un paiement Wero est irrévocable." }));
      expect(t).toContain(`${C.payment.page.labels.caution} :`);
      expect(t).toContain("Un paiement Wero est irrévocable.");
    }
  });

  it("« Autres moyens de paiement » : affichés seulement s'ils sont renseignés", async () => {
    expect(await text(withPayment({ otherMethods: null }))).not.toContain(C.payment.page.labels.otherMethods);
    expect(await text(withPayment({ otherMethods: "Espèces, carte bancaire" }))).toContain("Espèces, carte bancaire");
  });

  it("un texte de carte sur plusieurs lignes donne un paragraphe par ligne", async () => {
    const steps = { title: "Étapes", cards: [{ title: "Ouvrir", text: "Ligne 1\n\nLigne 2" }] };
    getSiteContent.mockResolvedValue(withPayment({}, { steps }));
    const root = await renderPage(Paiement);
    expect(root.querySelectorAll("#etapes-title ~ ol li p").map((p) => p.text)).toEqual(["Ligne 1", "Ligne 2"]);
  });

  it("le nombre de cartes reste affiché sans erreur pour 1 à 5 étapes", async () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const cards = Array.from({ length: n }, (_, i) => ({ title: `T${i}`, text: `Texte ${i}` }));
      getSiteContent.mockResolvedValue(withPayment({}, { steps: { title: "Étapes", cards } }));
      expect((await renderPage(Paiement)).querySelectorAll("#etapes-title ~ ol > li")).toHaveLength(n);
    }
  });
});

describe("/paiement : tout ce qui est renseigné est affiché, à sa place", () => {
  const labels = C.payment.page.labels;
  const clean = (s: string) => s.replace(NBSP, " ").trim();
  const full = withPayment(
    {
      info: "Le règlement se fait après la séance.",
      wero: { recipient: { value: "+352 691 000 000", kind: "phone" }, recipientName: "P. Tchikaya" },
      otherMethods: "Espèces",
    },
    {
      eyebrow: "Paiement",
      title: "Régler votre séance",
      intro: "Wero en trois étapes.",
      steps: {
        title: "Les étapes",
        cards: [
          { title: "Ouvrez Wero", text: "  Dans l'application.  \n\n  Ou dans votre banque. " },
          { title: "Saisissez le numéro", text: "Celui ci-dessus." },
          { title: "Validez", text: "" },
        ],
      },
      caution: "Un paiement Wero est irrévocable.",
      reassurance: { title: "C'est sûr", cards: [{ title: "Votre banque", text: "Ligne A\nLigne B" }, { title: "Chiffré", text: "Toujours." }] },
      firstTime: { title: "Pas encore Wero ?", cards: [{ title: "L'application", text: "Téléchargez-la." }] },
      help: { title: "Une question ?", text: "Appelez le cabinet." },
    },
  );

  it("paragraphes dans l'ordre de lecture : surtitre, introduction, cartes (une ligne = un paragraphe), encart, aide", async () => {
    getSiteContent.mockResolvedValue({ ...full, consultation: { ...C.consultation, price: "90 €" } });
    const root = await renderPage(Paiement);
    expect(root.querySelectorAll("main p").map((p) => clean(p.text))).toEqual([
      "Paiement",
      "Le règlement se fait après la séance.",
      "Wero en trois étapes.",
      "Dans l'application.",
      "Ou dans votre banque.",
      "Celui ci-dessus.",
      `${labels.caution} : Un paiement Wero est irrévocable.`,
      "Ligne A",
      "Ligne B",
      "Toujours.",
      "Téléchargez-la.",
      `${labels.otherMethods} : Espèces`,
      "Appelez le cabinet.",
      clean(C.consultation.reimbursement),
    ]);
  });

  it("coordonnées Wero, bénéficiaire et tarif ; titres des sections et des cartes ; numéros des étapes", async () => {
    getSiteContent.mockResolvedValue({ ...full, consultation: { ...C.consultation, price: "90 €" } });
    const root = await renderPage(Paiement);
    expect(root.querySelectorAll("dl dt, dl dd").map((n) => clean(n.text))).toEqual([
      labels.phone, "+352 691 000 000", labels.name, "P. Tchikaya", labels.price, "90 €",
    ]);
    expect(root.querySelectorAll("main h2").map((h) => clean(h.text))).toEqual([
      "Les étapes", "C'est sûr", "Pas encore Wero ?", "Une question ?",
    ]);
    expect(root.querySelectorAll("main h3").map((h) => clean(h.text))).toEqual([
      `${COPY.payment.step(1).trim()} Ouvrez Wero`, `${COPY.payment.step(2).trim()} Saisissez le numéro`, `${COPY.payment.step(3).trim()} Validez`,
      "Votre banque", "Chiffré", "L'application",
    ]);
    expect(root.querySelectorAll("#etapes-title ~ ol > li > span[aria-hidden]").map((s) => s.text)).toEqual(["1", "2", "3"]);
  });

  it("nom du bénéficiaire : seulement avec des coordonnées Wero, et seulement s'il est renseigné", async () => {
    const dlTexts = async (wero: SiteContent["payment"]["wero"]) => {
      getSiteContent.mockResolvedValue({ ...withPayment({ wero }), consultation: { ...C.consultation, price: "90 €" } });
      return (await renderPage(Paiement)).querySelectorAll("dl dt, dl dd").map((n) => clean(n.text));
    };
    expect(await dlTexts({ recipient: null, recipientName: "Nom seul" })).toEqual([labels.price, "90 €"]);
    expect(await dlTexts({ recipient: { value: "+352 691 000 000", kind: "phone" }, recipientName: null })).toEqual([
      labels.phone, "+352 691 000 000", labels.price, "90 €",
    ]);
  });

  it("rien de facultatif : ni surtitre, ni introduction, ni coordonnées, ni sections, ni texte d'aide", async () => {
    getSiteContent.mockResolvedValue({
      ...withPayment(
        { wero: { recipient: null, recipientName: "Nom seul" }, otherMethods: null },
        { eyebrow: null, intro: null, steps: null, caution: null, reassurance: null, firstTime: null, help: { title: "Aide", text: null } },
      ),
      consultation: { ...C.consultation, price: null },
    });
    const root = await renderPage(Paiement);
    expect(root.querySelector("dl")).toBeNull();
    expect(root.querySelectorAll("main p").map((p) => clean(p.text))).toEqual([clean(C.payment.info), clean(C.consultation.reimbursement)]);
    expect(root.querySelectorAll("main h2").map((h) => clean(h.text))).toEqual(["Aide"]);
  });
});
