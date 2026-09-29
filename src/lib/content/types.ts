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
