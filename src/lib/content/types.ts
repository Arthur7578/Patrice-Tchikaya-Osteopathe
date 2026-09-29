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

export type Expertise = { title: string; text: string };

export type Geo = { latitude: number; longitude: number };

export type Motif = {
  title: string;
  slug: string;
  description: string;
  icon: string; // nom Lucide validé (voir MOTIF_ICONS)
  notionPageId: string | null; // pour les pages motifs (phase 9)
};

export type Review = {
  author: string; // déjà formaté "Prénom N."
  rating: number | null; // 0..5
  text: string;
  date: string | null; // ISO "2026-09-21"
};

export type FaqItem = { question: string; answer: string };

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

/** Règlement après la séance (page /paiement + ligne « Règlement » des infos pratiques). */
export type Payment = {
  info: string; // Info_Paiement (phrase courte : quand et comment régler)
  wero: {
    recipient: WeroRecipient | null; // Wero_Numero_Ou_Email ; null = non publié sur le site
    recipientName: string | null; // Wero_Nom_Beneficiaire : nom affiché par Wero avant validation
  };
  otherMethods: string | null; // Autres_Moyens_Paiement (texte libre) ; null = bloc masqué
  messageTip: string | null; // Wero_Conseil_Message : conseil sur le message joint au paiement (étape 3) ; null = masqué
  caution: string | null; // Paiement_Mise_En_Garde : encart « Bon à savoir » facultatif ; null = pas d'encart
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
    phoneDisplay: string;
    phoneE164: string;
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
  rating: { value: number; count: number | null } | null;
  openingHours: OpeningHoursRange[] | null;
  access: string | null; // Acces_Info (parking, bus…)
  languages: string[]; // Langues_Parlees "Français, Anglais"
  about: {
    title: string;
    shortBio: string;
    longBio: string;
    education: string | null; // Formation (E-E-A-T)
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
