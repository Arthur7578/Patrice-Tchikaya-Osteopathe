import type { PaymentCard, PaymentPage, PaymentSection } from "./types";

/** Ligne de la base Notion Page_Paiement, réduite à ce que lit le code (déjà triée par « Ordre »). */
export type PaymentRow = { name: string; type: string; text: string };

/** Sans accents, en minuscules : « Étape », « etape » et « ÉTAPE » désignent le même type. */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const keyOf = (name: string) => fold(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

/**
 * Valeur « vide » : rien, ou un texte d'attente entre crochets (« [Facultatif — …] »).
 * Volontairement plus strict que `isPlaceholder` : ici les textes sont libres, une phrase qui contient
 * « mettre le » ne doit jamais être prise pour un texte d'attente.
 */
const isBlank = (value: string) => {
  const v = value.trim();
  return v === "" || /^\[[\s\S]*\]$/.test(v);
};

/** Clés des lignes de type « Texte » (Name), sous leur forme normalisée par `keyOf`. */
const TEXT_KEYS = new Set([
  "titre_page", "surtitre", "introduction", "titre_etapes", "titre_securite",
  "titre_premiere_utilisation", "titre_aide", "texte_aide", "encart", "meta_title", "meta_description",
  "libelle_numero", "libelle_email", "libelle_nom", "libelle_tarif", "libelle_encart", "libelle_autres_moyens",
]);

/** Types de ligne « carte » -> section de la page. */
const CARD_TYPES = { etape: "steps", securite: "reassurance", premiere_utilisation: "firstTime" } as const;

/**
 * Construit les textes de /paiement depuis les lignes de Page_Paiement. Appelée seulement si la base
 * contient des lignes (sinon : instantané de secours). Règles :
 * - « Titre_Page », le titre d'une section qui a des cartes et les libellés « Libelle_* » sont obligatoires
 *   (secours + avertissement) ;
 * - les autres lignes « Texte » sont facultatives : absente, vide ou entre crochets = élément masqué ;
 * - une section sans carte est masquée (supprimer les lignes d'un type suffit à la retirer).
 */
export function buildPaymentPage(
  rows: PaymentRow[],
  fallback: PaymentPage,
  warn: (message: string) => void,
): PaymentPage {
  const texts = new Map<string, string>();
  const cards: Record<"steps" | "reassurance" | "firstTime", PaymentCard[]> = {
    steps: [],
    reassurance: [],
    firstTime: [],
  };

  for (const row of rows) {
    const type = keyOf(row.type);
    if (type === "texte") {
      const key = keyOf(row.name);
      if (TEXT_KEYS.has(key)) texts.set(key, row.text);
      else warn(`Page_Paiement : clé « ${row.name} » inconnue, ligne ignorée`);
    } else if (type in CARD_TYPES) {
      if (isBlank(row.name)) continue; // carte sans titre
      cards[CARD_TYPES[type as keyof typeof CARD_TYPES]].push({
        title: row.name.trim(),
        text: isBlank(row.text) ? "" : row.text.trim(),
      });
    } else {
      warn(`Page_Paiement : type « ${row.type} » inconnu pour « ${row.name} », ligne ignorée`);
    }
  }

  const optional = (key: string): string | null => {
    const value = texts.get(key);
    return value === undefined || isBlank(value) ? null : value.trim();
  };
  const required = (key: string, fallbackValue: string, label: string): string => {
    const value = optional(key);
    if (value !== null) return value;
    warn(`Champ obligatoire vide dans Page_Paiement : ${label} (valeur de secours utilisée)`);
    return fallbackValue;
  };
  const section = (
    list: PaymentCard[],
    key: string,
    fallbackSection: PaymentSection | null,
    label: string,
  ): PaymentSection | null =>
    list.length === 0 ? null : { title: required(key, fallbackSection?.title ?? "", label), cards: list };

  return {
    eyebrow: optional("surtitre"),
    title: required("titre_page", fallback.title, "Titre_Page"),
    intro: optional("introduction"),
    metaTitle: optional("meta_title"),
    metaDescription: optional("meta_description"),
    steps: section(cards.steps, "titre_etapes", fallback.steps, "Titre_Etapes"),
    caution: optional("encart"),
    reassurance: section(cards.reassurance, "titre_securite", fallback.reassurance, "Titre_Securite"),
    firstTime: section(cards.firstTime, "titre_premiere_utilisation", fallback.firstTime, "Titre_Premiere_Utilisation"),
    help: {
      title: required("titre_aide", fallback.help.title, "Titre_Aide"),
      text: optional("texte_aide"),
    },
    labels: {
      phone: required("libelle_numero", fallback.labels.phone, "Libelle_Numero"),
      email: required("libelle_email", fallback.labels.email, "Libelle_Email"),
      name: required("libelle_nom", fallback.labels.name, "Libelle_Nom"),
      price: required("libelle_tarif", fallback.labels.price, "Libelle_Tarif"),
      caution: required("libelle_encart", fallback.labels.caution, "Libelle_Encart"),
      otherMethods: required("libelle_autres_moyens", fallback.labels.otherMethods, "Libelle_Autres_Moyens"),
    },
  };
}
