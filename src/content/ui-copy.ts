export const NAV = [
  { href: "/#a-propos", label: "À propos" },
  { href: "/#motifs", label: "Motifs" },
  { href: "/#infos", label: "Infos & Tarifs" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const COPY = {
  skipLink: "Aller au contenu",
  cta: { book: "Prendre rendez-vous en ligne", bookShort: "Prendre RDV", bookMobile: "Prendre rendez-vous" },
  hero: {
    ratingSuffix: "sur Google Reviews",
    reassurance: ["Sans ordonnance", "Facture pour votre mutuelle"], // + « Séance de {durée} » calculé
    cardSubtitle: "Sur rendez-vous · sans ordonnance",
  },
  about: { eyebrow: "À propos" },
  motifs: {
    eyebrow: "Motifs de consultation",
    title: (city: string) => `Pourquoi consulter un ostéopathe à ${city} ?`,
    intro: (city: string) =>
      `Au cabinet de ${city}, chaque séance commence par un bilan complet pour traiter la cause de la douleur, pas seulement le symptôme.`,
    helpLine: "Un doute sur votre situation ? Appelez le cabinet :",
  },
  reviews: {
    eyebrow: "Avis patients",
    title: "Ce qu'en disent les patients",
    source: "Avis Google",
    seeAll: "Voir tous les avis sur Google",
    leaveReview: "Laisser un avis",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes sur l'ostéopathie",
    helpTitle: "Vous ne trouvez pas votre réponse ?",
    helpText: "Appelez le cabinet, nous vous répondrons avec plaisir.",
  },
  infos: {
    eyebrow: "Infos pratiques",
    title: "Infos pratiques, accès & tarifs",
    labels: {
      address: "Adresse", phone: "Téléphone", duration: "Durée", price: "Tarif",
      reimbursement: "Remboursement", hours: "Horaires", access: "Accès", languages: "Langues",
    },
    directions: "Itinéraire",
    map: "Voir sur Google Maps",
    bookingTitle: "Réserver votre séance en ligne",
    bookingText: "Choisissez un créneau : la confirmation vous est envoyée par e-mail.",
    bookingFallback: "Ouvrir l'agenda dans un nouvel onglet",
  },
  footer: { legal: "Mentions légales", privacy: "Confidentialité" },
  newTab: "(nouvel onglet)",
} as const;
