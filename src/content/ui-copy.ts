import { localePath, type Locale } from "@/config/i18n";
import { COPY_DE } from "./ui-copy.de";
import { COPY_EN } from "./ui-copy.en";
import { COPY_LB } from "./ui-copy.lb";
import { COPY_PT } from "./ui-copy.pt";

/** Libellé du lien de pied de page qui rouvre la bannière cookies, cité aussi dans la bannière. */
const MANAGE_COOKIES = "Gérer les cookies";

/**
 * Textes d'interface en français (langue source). Les autres langues : ui-copy.<code>.ts (de, en, lb, pt),
 * typées sur celui-ci (une clé ajoutée ici sans traduction ne compile pas). Les traductions sont faites avec le code,
 * pas à l'exécution : modifier un texte ici = mettre à jour les autres fichiers dans le même commit.
 */
export const COPY_FR = {
  skipLink: "Aller au contenu",
  home: "Accueil", // lien « Accueil » du header et du menu mobile (absent du footer)
  nav: { about: "À propos", motifs: "Motifs", faq: "FAQ", infos: "Accès & tarifs" },
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
    translated: "Traduit", // sous un avis traduit dans la langue de la page (jamais affiché en français)
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
    // Prestataire sans agenda intégré (ex. Doctena) : les boutons mènent à sa page de réservation.
    bookingExternalText: "Consultez les créneaux disponibles et réservez votre séance sur l'agenda en ligne du cabinet.",
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
  // Sélecteur de langue (header).
  languages: { label: "Langue du site" },
  // Pages juridiques : les données du cabinet viennent de Notion ; sans elles, textes d'attente (LEGAL_PLACEHOLDERS).
  legalNotice: {
    title: "Mentions légales",
    metaDescription: (name: string, title: string, city: string) => `Mentions légales du site de ${name}, ${title} à ${city}.`,
    publisher: "Éditeur du site",
    phone: "Téléphone :",
    email: "E-mail :",
    regulated: "Profession réglementée",
    regulatedText: (name: string) =>
      `L'ostéopathie est une profession de santé réglementée au Grand-Duché de Luxembourg, inscrite sur la liste des professions de santé fixée par la loi modifiée du 26 mars 1992 sur l'exercice et la revalorisation de certaines professions de santé (ajout opéré par la loi du 21 août 2018). ${name} exerce sous autorisation d'exercer délivrée par le ministre de la Santé du Luxembourg et figure au registre professionnel tenu par ce ministère.`,
    authorization: "Numéro d'autorisation d'exercer :",
    education: "École et année du diplôme :",
    vat: "Numéro de TVA / immatriculation :",
    hosting: "Hébergement",
    hostingText: "Ce site est hébergé par Vercel Inc. — adresse et informations légales disponibles sur",
    credits: "Crédits",
    creditsText: (name: string) => `Conception et développement : ${name}. Photographies : droits réservés`,
    translationNote: "", // vide en français : version de référence
  },
  privacy: {
    title: "Confidentialité",
    metaDescription: (name: string, title: string, city: string) =>
      `Politique de confidentialité du site de ${name}, ${title} à ${city}.`,
    collected: "Données collectées par ce site",
    collectedText: "Ce site ne comporte aucun formulaire. Il ne dépose aucun cookie sans votre accord explicite.",
    gtm: "Google Tag Manager (avec votre accord)",
    gtmText:
      "Ce site utilise Google Tag Manager, chargé uniquement si vous l'acceptez via la bannière affichée lors de votre première visite. Tant que vous n'avez pas donné votre accord (ou si vous le refusez), aucun cookie lié à cet outil n'est déposé et aucun script correspondant n'est chargé.",
    gtmChoice: `Vous pouvez revenir sur votre choix à tout moment via le lien « ${MANAGE_COOKIES} » en pied de page, qui rouvre la bannière de consentement.`,
    booking: "Prise de rendez-vous en ligne",
    bookingText:
      "La prise de rendez-vous est assurée par un service tiers de réservation en ligne, chargé uniquement à votre initiative (survol, clic ou approche de l'agenda). Les données que vous saisissez pour réserver un créneau (nom, e-mail, téléphone) sont traitées directement par ce service, selon sa propre politique de confidentialité. Ce site n'a accès à aucune de ces données.",
    bookingExternalText: (host: string) =>
      `La prise de rendez-vous est assurée par un service tiers de réservation en ligne (${host}). Les boutons « Prendre rendez-vous » ouvrent sa page de réservation : aucun de ses scripts n'est chargé sur ce site. Les données que vous saisissez pour réserver un créneau sont traitées directement par ce service, selon sa propre politique de confidentialité. Ce site n'a accès à aucune de ces données.`,
    audience: "Mesure d'audience sans cookie",
    audienceText:
      "Si une mesure d'audience Vercel est activée en complément, elle fonctionne sans cookie et sans donnée personnelle identifiable, à des fins statistiques uniquement. Elle compte aussi les clics sur les boutons de prise de rendez-vous, avec le seul emplacement du bouton (en-tête, accueil, FAQ…), pour savoir lesquels sont utiles.",
    rights: "Vos droits",
    rightsText: (name: string, phone: string) =>
      `Conformément au Règlement général sur la protection des données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur vos données personnelles. Pour toute question, vous pouvez contacter ${name} au ${phone}.`,
    authority: "Autorité de contrôle compétente au Luxembourg : Commission nationale pour la protection des données (CNPD).",
  },
  // Métadonnées et données structurées (le contenu vient de Notion ; ici, les formulations par défaut).
  meta: {
    homeTitle: (city: string, name: string) => `Ostéopathe à ${city} – ${name}, D.O.`,
    homeDescription: (city: string, duration: string) =>
      `Cabinet d'ostéopathie à ${city} (Luxembourg) : dos, cou, articulations, sport et TMS. Séance de ${duration}. Prise de rendez-vous en ligne.`,
    titleTemplate: (name: string, city: string) => `%s | ${name}, ostéopathe à ${city}`,
    motifLocal: (city: string) => `Ostéopathe à ${city}, sans ordonnance.`,
    imageAlt: (name: string, title: string, city: string) => `${name}, ${title} à ${city}`,
    websiteName: (name: string, city: string) => `${name} – Ostéopathe à ${city}`,
    knowsAbout: { osteopathy: "Ostéopathie", msd: "Troubles musculo-squelettiques", handball: "Handball" },
  },
};

export type UiCopy = typeof COPY_FR;

/**
 * Textes d'attente des pages juridiques, tant que la donnée manque dans Notion : consignes pour le cabinet, en
 * français dans toutes les langues (seo:smoke les signale sur chaque page du sitemap).
 */
export const LEGAL_PLACEHOLDERS = {
  email: "[À COMPLÉTER : adresse e-mail professionnelle — champ Notion Email_Contact]",
  authorization: "[À COMPLÉTER — champ Notion Numero_Autorisation_Exercer ; délivré par le ministère de la Santé]",
  education: "[À COMPLÉTER — champ Notion Formation, base Section A_Propos]",
  vat: "[À COMPLÉTER — champ Notion Statut_TVA ; les soins de santé sont en général exonérés de TVA (art. 44 de la loi TVA), à confirmer avec votre comptable]",
  photos: "[À COMPLÉTER si une source externe est utilisée]",
};

const COPIES: Record<Locale, UiCopy> = { fr: COPY_FR, de: COPY_DE, en: COPY_EN, lb: COPY_LB, pt: COPY_PT };

/** Textes d'interface d'une langue. */
export const getCopy = (locale: Locale): UiCopy => COPIES[locale];

/** Lien « Accueil » du header et du menu mobile. */
export const homeLink = (locale: Locale) => ({ href: localePath(locale, "/"), label: getCopy(locale).home });

/** Ancres de la page d'accueil (header, menu mobile, pied de page). */
export function navLinks(locale: Locale) {
  const { nav } = getCopy(locale);
  return [
    { href: localePath(locale, "/#a-propos"), label: nav.about },
    { href: localePath(locale, "/#motifs"), label: nav.motifs },
    { href: localePath(locale, "/#faq"), label: nav.faq },
    { href: localePath(locale, "/#infos"), label: nav.infos },
  ];
}
