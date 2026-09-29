/** Lien « Accueil » du header et du menu mobile (absent du footer, qui réutilise `NAV`). */
export const HOME_LINK = { href: "/", label: "Accueil" } as const;

export const NAV = [
  { href: "/#a-propos", label: "À propos" },
  { href: "/#motifs", label: "Motifs" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#infos", label: "Infos & Tarifs" },
  { href: "/#acces", label: "Accès" },
] as const;

export const COPY = {
  skipLink: "Aller au contenu",
  ratingOn: "sur", // « 5,0/5 sur Google Maps » (hero), « 12 avis sur Google Maps » (avis)
  cta: { book: "Prendre rendez-vous en ligne", bookShort: "Prendre RDV", bookMobile: "Prendre rendez-vous" },
  hero: {
    reassurance: ["Sans ordonnance", "Facture pour votre mutuelle"], // + « Séance de {durée} » calculé
    cardSubtitle: "Sur rendez-vous · sans ordonnance",
  },
  about: { eyebrow: "À propos", training: "Formation" }, // diplôme (Formation) + formations continues, une seule liste
  motifs: {
    eyebrow: "Motifs de consultation",
    title: (city: string) => `Pourquoi consulter un ostéopathe à ${city} ?`,
    intro: (city: string) =>
      `Au cabinet de ${city}, chaque séance commence par un bilan complet pour traiter la cause de la douleur, pas seulement le symptôme.`,
    helpLine: "Un doute sur votre situation ? Appelez le cabinet :",
    discover: (title: string) => `Découvrir : ${title}`, // lien descriptif vers la page détaillée (phase 9)
  },
  // Pages motifs (phase 9) : seul l'habillage est ici, le texte vient du corps de la page Notion.
  motifPage: {
    breadcrumb: "Fil d'Ariane",
    home: "Accueil",
    h1: (title: string, city: string) => `${title} à ${city}`,
    call: (phone: string) => `Appeler le ${phone}`,
    ctaTitle: (city: string) => `Consulter au cabinet de ${city}`,
    ctaText: (duration: string) =>
      `Séance de ${duration}, sans ordonnance. Réservez en ligne, ou appelez le cabinet si vous avez une question avant de venir.`,
    others: "Les autres motifs de consultation",
  },
  reviews: {
    eyebrow: "Avis patients",
    title: "Ce qu'en disent les patients",
    source: "Avis Google",
    ratingLabel: "Note", // « Note sur Google Maps », ou « 12 avis sur Google Maps » si le nombre est connu
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
      address: "Adresse", phone: "Téléphone", phoneOffice: "Cabinet\u00a0:", phoneMobile: "Mobile\u00a0:", duration: "Durée", price: "Tarif", payment: "Règlement",
      reimbursement: "Remboursement", hours: "Horaires", languages: "Langues",
      train: "Train", bus: "Bus", parking: "Stationnement", accessibility: "Accès PMR",
    },
    accessTitle: "Accès",
    directions: "Itinéraire",
    map: "Voir sur Google Maps",
    paymentLink: "Comment payer avec Wero",
    bookingTitle: "Réserver votre séance en ligne",
    bookingText: "Choisissez un créneau : la confirmation vous est envoyée par e-mail.",
    bookingFallback: "Ouvrir l'agenda dans un nouvel onglet",
  },
  /**
   * Page /paiement : seuls les libellés d'interface et les métadonnées par défaut sont ici. Les textes de la
   * page (titres, étapes, réassurance, aide…) viennent de la base Notion Page_Paiement (secours : fallback.ts).
   */
  payment: {
    metaTitle: "Régler votre séance avec Wero",
    metaDescription: (city: string) =>
      `Régler votre séance d'ostéopathie à ${city} avec Wero : les étapes, pourquoi c'est sûr et que faire si vous n'avez pas encore Wero.`,
    recipient: {
      phone: "Numéro Wero du cabinet",
      email: "Adresse e-mail Wero du cabinet",
      name: "Nom affiché par Wero",
      price: "Tarif de la consultation",
    },
    step: (n: number) => `Étape ${n} : `, // annoncé par les lecteurs d'écran (le numéro affiché est décoratif)
    caution: { label: "Bon à savoir" },
    otherMethods: "Autres moyens de paiement acceptés",
  },
  footer: { legal: "Mentions légales", privacy: "Confidentialité", payment: "Régler votre séance" },
  backToHome: "Retour à l'accueil",
  menu: { open: "Ouvrir le menu", close: "Fermer le menu", label: "Menu principal" },
  // /llms.txt : intitulés structurels ; tout le contenu vient de getSiteContent().
  llms: {
    practical: "Informations pratiques",
    motifs: "Motifs de consultation",
    faq: "Questions fréquentes",
    pages: "Pages du site",
    booking: "Prise de rendez-vous en ligne",
    home: "Page d'accueil",
  },
  newTab: "(nouvel onglet)",
} as const;
