import type { AccessRowId, InfoRowId } from "./rows";

export type ImageSlot = "hero" | "portrait" | "cabinet";

/** Image prête pour next/image. `src === null` => afficher le placeholder de la zone. */
export type SiteImage = {
  src: string | null;
  alt: string; // toujours non vide (Alt_description Notion, sinon alt de secours)
  width: number;
  height: number;
};

export type OpeningHoursRange = {
  days: Array<"Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su">;
  opens: string; // "08:00"
  closes: string; // "19:00"
};

export type Expertise = {
  title: string;
  text: string;
  icon: string; // nom Lucide validé (voir MOTIF_ICONS)
};

export type Geo = { latitude: number; longitude: number };

/** Numéro affiché tel que saisi dans Notion + sa forme E.164 pour le lien `tel:`. */
export type Phone = { display: string; e164: string };

/** Segment de texte enrichi (Notion → site). Seuls gras, italique, code et liens sont conservés. */
export type RichText = { text: string; bold?: true; italic?: true; code?: true; href?: string };

/** Bloc de contenu normalisé : sous-ensemble des blocs Notion que le site sait afficher (phase 9). */
export type ContentBlock =
  | { type: "paragraph"; text: RichText[] }
  | { type: "heading"; level: 2 | 3; text: RichText[] }
  | { type: "list"; ordered: boolean; items: RichText[][] }
  | { type: "quote"; text: RichText[] }
  | { type: "callout"; text: RichText[] }
  | { type: "divider" }
  | { type: "image"; src: string; alt: string };

/** Page détaillée d'un motif : corps de la page Notion, validé (case Page_Validée) et assez long. */
export type MotifPage = {
  blocks: ContentBlock[];
  wordCount: number;
  lastEdited: string; // ISO, last_edited_time de la page Notion (sitemap, JSON-LD lastReviewed)
};

export type Motif = {
  title: string;
  slug: string;
  description: string;
  icon: string; // nom Lucide validé (voir MOTIF_ICONS)
  notionPageId: string | null; // pour les pages motifs (phase 9)
  /** null = pas de page détaillée publiée (case non cochée, texte trop court ou slug réservé). */
  page: MotifPage | null;
};

export type Review = {
  author: string; // déjà formaté "Prénom N."
  rating: number | null; // 0..5
  text: string;
  date: string | null; // ISO "2026-09-21"
};

export type FaqItem = { question: string; answer: string };

/** Venir au cabinet : une ligne Notion par sujet, chacune masquée tant qu'elle est vide ou « [À …] ». */
export type AccessInfo = {
  train: string | null; // Acces_Train
  bus: string | null; // Acces_Bus
  parking: string | null; // Acces_Parking
  accessibility: string | null; // Acces_PMR — ne jamais affirmer un accès PMR non vérifié
};

/** Note Google : API Google Places si configurée (voir get-google-rating.ts), sinon Note_Google (Notion). */
export type Rating = { value: number; count: number | null };

/**
 * Prise de RDV, pensée pour être configurable sans changer de code : une seule URL vient de
 * Notion (`Url_Booking`). `provider` est déduit de son hôte — seuls les hôtes Cal.com connus
 * activent l'intégration embarquée (popup + agenda inline, §9 du plan) ; tout autre prestataire
 * (Doctena, Calendly, un futur outil…) reste un vrai lien `<a href>` fonctionnel sans JS.
 * Changer de prestataire = coller une nouvelle URL dans Notion, sans toucher au code.
 */
export type BookingProvider = "cal" | "generic";

export type Booking = {
  url: string;
  provider: BookingProvider;
  /** Renseignés seulement si provider === "cal" (chemin Cal.com, ex. "cabinet/consultation"). */
  calLink: string | null;
  /** Renseigné seulement si provider === "cal" ("https://app.cal.eu" ou "https://app.cal.com"). */
  calOrigin: string | null;
};

/** Coordonnées Wero du cabinet : Wero accepte un numéro de mobile ou une adresse e-mail. */
export type WeroRecipient = { value: string; kind: "phone" | "email" };

/** Carte de la page /paiement : titre + texte (un paragraphe par ligne). */
export type PaymentCard = { title: string; text: string };

/** Section de cartes : titre + cartes. Une section sans carte vaut `null` (masquée). */
export type PaymentSection = { title: string; cards: PaymentCard[] };

/** Textes de la page /paiement, éditables dans la base Notion Page_Paiement (mise en page fixe). */
export type PaymentPage = {
  eyebrow: string | null; // Surtitre
  title: string; // Titre_Page (le <h1>)
  intro: string | null; // Introduction, sous la phrase Info_Paiement
  metaTitle: string | null; // Meta_Title ; null = titre par défaut
  metaDescription: string | null; // Meta_Description ; null = description par défaut
  steps: PaymentSection | null; // lignes de type « Étape »
  caution: string | null; // Encart : encart « Bon à savoir » facultatif ; null = pas d'encart
  reassurance: PaymentSection | null; // lignes de type « Sécurité »
  firstTime: PaymentSection | null; // lignes de type « Première utilisation »
  help: { title: string; text: string | null }; // Titre_Aide, Texte_Aide
  /** Libellés du bloc de coordonnées, de l'encart et de l'aide (lignes Libelle_* de Page_Paiement). */
  labels: {
    phone: string; // Libelle_Numero : « Numéro Wero »
    email: string; // Libelle_Email : « Adresse e-mail Wero »
    name: string; // Libelle_Nom : « Nom affiché par Wero »
    price: string; // Libelle_Tarif : « Tarif de la consultation »
    caution: string; // Libelle_Encart : « Bon à savoir »
    otherMethods: string; // Libelle_Autres_Moyens : « Autres moyens de paiement acceptés »
  };
};

/** Règlement après la séance (page /paiement + ligne « Règlement » des infos pratiques). */
export type Payment = {
  info: string; // Info_Paiement (phrase courte : quand et comment régler)
  wero: {
    recipient: WeroRecipient | null; // Wero_Numero_Ou_Email ; null = non publié sur le site
    recipientName: string | null; // Wero_Nom_Beneficiaire : nom affiché par Wero avant validation
  };
  otherMethods: string | null; // Autres_Moyens_Paiement (texte libre) ; null = bloc masqué
  page: PaymentPage; // base Page_Paiement
};

export type SiteContent = {
  practitioner: { name: string; title: string };
  seo: { h1: string; heroSubtitle: string; metaTitle: string | null; metaDescription: string | null };
  contact: {
    street: string;
    postalCode: string;
    locality: string;
    countryName: string;
    countryCode: "LU";
    phoneDisplay: string; // numéro principal : celui du cabinet
    phoneE164: string;
    /** Numéro secondaire : mobile du praticien (ligne directe), toujours affiché après le cabinet. null = masqué. */
    mobilePhone: Phone | null;
    geo: Geo;
    email: string | null;
  };
  booking: Booking;
  googleBusinessUrl: string | null;
  consultation: {
    durationLabel: string;
    durationMinutes: number | null;
    price: string | null; // null si placeholder "[Mettre le tarif…]"
    reimbursement: string;
  };
  payment: Payment;
  rating: Rating | null;
  /** Horaires structurés (JSON-LD) ; null si le texte Notion n'a pas pu être interprété. */
  openingHours: OpeningHoursRange[] | null;
  /** Horaires à afficher : mise en forme normalisée si lisibles, sinon texte Notion tel quel. */
  openingHoursLines: string[];
  access: AccessInfo;
  /** Ordre d'affichage des lignes, réglable dans Notion (Infos_Ordre / Acces_Ordre). Toujours complet. */
  rowOrder: { infos: InfoRowId[]; access: AccessRowId[] };
  languages: string[]; // Langues_Parlees "Français, Anglais"
  about: {
    title: string;
    shortBio: string;
    longBio: string;
    education: string | null; // Formation (E-E-A-T)
    continuingEducation: string[]; // Formations_Continues (optionnel, une par ligne) — vide = bloc masqué
    expertises: Expertise[];
  };
  motifs: Motif[];
  reviews: Review[];
  faq: FaqItem[];
  images: Record<ImageSlot, SiteImage>;
  sameAs: string[];
  /** Mentions légales : données que seul Patrice peut fournir (aucune valeur inventée). */
  legal: {
    authorizationNumber: string | null; // Numero_Autorisation_Exercer (ministère de la Santé)
    vatStatus: string | null; // Statut_TVA (matricule, exonération…) — à confirmer avec le comptable
  };
};
