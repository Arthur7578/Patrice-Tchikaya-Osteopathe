/** Lien « Accueil » du header et du menu mobile (absent du footer, qui réutilise `NAV`). */
export const HOME_LINK = { href: "/", label: "Accueil" } as const;

export const NAV = [
  { href: "/#a-propos", label: "À propos" },
  { href: "/#motifs", label: "Motifs" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#infos", label: "Accès & tarifs" },
] as const;

/** Libellé du lien de pied de page qui rouvre la bannière cookies, cité aussi dans la bannière. */
const MANAGE_COOKIES = "Gérer les cookies";

export const COPY = {
  skipLink: "Aller au contenu",
  navLabel: "Navigation principale",
  ratingOn: "sur", // « 5,0/5 sur Google Maps » (hero), « 12 avis sur Google Maps » (avis)
  googleMaps: "Google Maps", // nom de marque, jamais traduit (translate="no")
  starRating: (value: string) => `Note : ${value} sur 5`, // lu par les lecteurs d'écran (étoiles décoratives)
  cta: {
    book: "Prendre rendez-vous en ligne",
    bookShort: "Prendre RDV",
    bookMobile: "Prendre rendez-vous",
    call: (phone: string) => `Appeler le ${phone}`,
    callCabinet: (phone: string) => `Appeler le cabinet au ${phone}`, // bouton icône de la barre mobile
  },
  hero: {
    location: (city: string) => `Cabinet à ${city}`,
    // Points sous les boutons (choix et ordre : clé Notion Hero_Points) ; `duree` et `tarif` viennent de Notion.
    points: {
      ordonnance: "Sans ordonnance",
      duree: (duration: string) => `Séance de ${duration}`,
      mutuelle: "Facture pour votre mutuelle",
      tarif: (price: string) => `Tarif : ${price}`,
      confirmation: "Confirmation par e-mail",
    },
    cardTitle: (minutes: number) => `Consultation ${minutes} min`,
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
    ctaTitle: (city: string) => `Consulter au cabinet de ${city}`,
    ctaText: (duration: string) =>
      `Séance de ${duration}, sans ordonnance. Réservez en ligne, ou appelez le cabinet si vous avez une question avant de venir.`,
    related: "À lire aussi", // autres pages publiées (motifs et pages d'information), en bas de chaque page détaillée
  },
  reviews: {
    eyebrow: "Avis patients",
    title: "Ce qu'en disent les patients",
    source: "Avis Google",
    ratingLabel: "Note", // « Note sur Google Maps », ou « 12 avis sur Google Maps » si le nombre est connu
    ratingCount: (count: number) => `${count} avis`,
    listLabel: "Avis patients", // liste défilante des avis (zone focalisable)
    seeAll: "Voir tous les avis sur Google",
    leaveReview: "Laisser un avis",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes sur l'ostéopathie",
    more: (n: number) => (n === 1 ? "Voir la question suivante" : `Voir les ${n} autres questions`),
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
    // Blocs repliables ; sous le titre s'affichent les libellés des lignes qu'ils contiennent.
    transportTitle: "Venir au cabinet",
    moreTitle: "Bon à savoir",
    directions: "Itinéraire",
    map: "Voir sur Google Maps",
    paymentLink: "Comment payer avec Wero",
    bookingTitle: "Réserver votre séance en ligne",
    bookingText: "Choisissez un créneau : la confirmation vous est envoyée par e-mail.",
    bookingFallback: "Ouvrir l'agenda dans un nouvel onglet",
  },
  // Agenda intégré (BookingInline) : pendant le chargement, puis si Cal.com ne répond pas.
  bookingInline: {
    loading: "Chargement de l'agenda…",
    failed: "L'agenda n'a pas pu se charger ici.",
    open: "Ouvrir l'agenda de réservation",
  },
  /**
   * Page /paiement : seuls les métadonnées par défaut et le libellé lu par les lecteurs d'écran sont ici. Tous les
   * textes visibles de la page (titres, étapes, libellés, aide…) viennent de la base Notion Page_Paiement
   * (secours : fallback.ts).
   */
  payment: {
    metaTitle: "Régler votre séance avec Wero",
    metaDescription: (city: string) =>
      `Régler votre séance d'ostéopathie à ${city} avec Wero : les étapes, pourquoi c'est sûr et que faire si vous n'avez pas encore Wero.`,
    step: (n: number) => `Étape ${n} : `, // annoncé par les lecteurs d'écran (le numéro affiché est décoratif)
  },
  // Page /articles : liste de toutes les pages détaillées publiées (motifs et pages d'information).
  articles: {
    metaTitle: "Tous les articles",
    metaDescription: (city: string) =>
      `Tous les articles du cabinet d'ostéopathie de ${city} : motifs de consultation et informations pratiques pour préparer votre séance.`,
    title: "Tous les articles",
    intro: (city: string) =>
      `Les motifs de consultation et les informations pratiques du cabinet d'ostéopathie de ${city}, au même endroit.`,
  },
  footer: {
    cabinet: "Cabinet",
    links: "Liens",
    googleProfile: "Fiche Google",
    legal: "Mentions légales",
    privacy: "Confidentialité",
    payment: "Régler votre séance",
    articles: "Tous les articles",
    cookies: MANAGE_COOKIES,
  },
  // Bannière de consentement (GTM, docs/DECISIONS.md du 27/09).
  cookies: {
    label: "Consentement aux cookies",
    text: `Ce site utilise des cookies de mesure d'audience (Google Tag Manager) uniquement avec votre accord. Vous pouvez changer d'avis à tout moment depuis le lien « ${MANAGE_COOKIES} » en bas de page.`,
    refuse: "Refuser",
    accept: "Accepter",
  },
  notFound: {
    title: "Page introuvable",
    text: "La page que vous cherchez n'existe pas ou plus. Vous pouvez revenir à l'accueil ou prendre rendez-vous directement.",
  },
  // Image de partage (/opengraph-image) : le nom, le titre et la ville viennent de getSiteContent().
  ogImage: { tagline: (city: string) => `Ostéopathe à ${city} – prise de rendez-vous en ligne` },
  backToHome: "Retour à l'accueil",
  menu: { open: "Ouvrir le menu", close: "Fermer le menu", label: "Menu principal" },
  // /llms.txt : intitulés structurels ; tout le contenu vient de getSiteContent().
  llms: {
    practical: "Informations pratiques",
    motifs: "Motifs de consultation",
    guides: "Pages d'information",
    faq: "Questions fréquentes",
    pages: "Pages du site",
    booking: "Prise de rendez-vous en ligne",
    home: "Page d'accueil",
  },
  newTab: "(nouvel onglet)",
} as const;
