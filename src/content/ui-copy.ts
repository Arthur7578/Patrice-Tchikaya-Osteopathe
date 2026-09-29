import type { WeroRecipient } from "@/lib/content/types";

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
      address: "Adresse", phone: "Téléphone", duration: "Durée", price: "Tarif", payment: "Règlement",
      reimbursement: "Remboursement", hours: "Horaires", access: "Accès", languages: "Langues",
    },
    directions: "Itinéraire",
    map: "Voir sur Google Maps",
    paymentLink: "Comment payer avec Wero",
    bookingTitle: "Réserver votre séance en ligne",
    bookingText: "Choisissez un créneau : la confirmation vous est envoyée par e-mail.",
    bookingFallback: "Ouvrir l'agenda dans un nouvel onglet",
  },
  /**
   * Page /paiement. Faits sur Wero vérifiés le 28/09/2026 (sources : docs/DECISIONS.md).
   * Les données propres au cabinet (coordonnées Wero, autres moyens, phrase d'intro) viennent de Notion.
   */
  payment: {
    eyebrow: "Paiement",
    title: "Régler votre séance",
    metaTitle: "Régler votre séance avec Wero",
    metaDescription: (city: string) =>
      `Régler votre séance d'ostéopathie à ${city} avec Wero : les étapes, pourquoi c'est sûr et que faire si vous n'avez pas encore Wero.`,
    intro: "Voici comment payer avec Wero, en quelques secondes depuis votre téléphone.",
    recipient: {
      phone: "Numéro Wero du cabinet",
      email: "Adresse e-mail Wero du cabinet",
      name: "Nom affiché par Wero",
      price: "Tarif de la consultation",
    },
    stepsTitle: "Payer avec Wero, étape par étape",
    steps: {
      open: {
        title: "Ouvrez Wero",
        text: "Dans l'application Wero, ou dans l'application de votre banque si Wero y est intégré.",
      },
      // Espaces insécables (\u00a0) : un numéro, un montant ou un nom entre guillemets ne se coupe pas en fin de ligne.
      send: {
        title: "Envoyez au cabinet",
        text: (recipient: WeroRecipient | null) =>
          recipient
            ? `Choisissez l'envoi d'argent, puis saisissez ${recipient.kind === "email" ? "l'adresse e-mail" : "le numéro"} Wero du cabinet : ${recipient.value.replace(/ /g, "\u00a0")}.`
            : "Choisissez l'envoi d'argent, puis saisissez le numéro de mobile ou l'adresse e-mail Wero du cabinet. Vous ne les avez pas ? Demandez-les au cabinet.",
      },
      amount: {
        title: "Indiquez le montant",
        // `tip` : conseil optionnel sur le message joint au paiement (Notion : Wero_Conseil_Message).
        text: (price: string | null, tip: string | null) =>
          `Saisissez le montant de votre séance${price ? ` (${price.replace(/ /g, "\u00a0")} pour une consultation)` : ""}.${tip ? ` ${tip}` : ""}`,
      },
      confirm: {
        title: "Vérifiez, puis validez",
        text: (name: string | null) =>
          `Contrôlez le nom du bénéficiaire affiché${name ? ` («\u00a0${name}\u00a0»)` : ""} et le montant, puis validez avec votre empreinte, votre visage ou votre code. L'argent arrive en quelques secondes.`,
      },
    },
    // Encart facultatif : seul le libellé est ici, le texte vient de Notion (Paiement_Mise_En_Garde).
    caution: { label: "Bon à savoir" },
    reassuranceTitle: "Un paiement simple et sûr",
    reassurance: [
      {
        title: "Une solution des banques européennes",
        text: "Wero est développé par l'European Payments Initiative (EPI), soutenue par de grandes banques européennes.",
      },
      {
        title: "Aucune coordonnée bancaire à partager",
        text: "Un numéro de mobile ou une adresse e-mail suffit : ni IBAN, ni numéro de carte.",
      },
      {
        title: "Validé par vous seul",
        text: "Aucun paiement ne part sans votre validation dans l'application : empreinte, reconnaissance faciale ou code.",
      },
      {
        title: "Le bon destinataire, en quelques secondes",
        text: "Wero affiche le nom du bénéficiaire avant que vous validiez, puis l'argent arrive en quelques secondes.",
      },
    ],
    firstTimeTitle: "Première utilisation de Wero ?",
    firstTime: [
      {
        title: "Votre banque est au Luxembourg",
        lines: [
          "Téléchargez l'application Wero, puis reliez-la à votre compte : votre identité est vérifiée via LuxTrust ou l'application de votre banque.",
          "Wero est proposé notamment par Spuerkeess, BGL BNP Paribas, BIL, Banque Raiffeisen et POST.",
          "Vous utilisiez Payconiq ? Wero le remplace au Luxembourg depuis septembre 2026.",
        ],
      },
      {
        title: "Votre banque est en France, en Belgique ou en Allemagne",
        lines: [
          "Wero y est proposé par de nombreuses banques, souvent directement dans leur application : cherchez «\u00a0Wero\u00a0» dans ses menus.",
        ],
      },
    ],
    helpTitle: "Pas de Wero, ou une question ?",
    otherMethods: "Autres moyens de paiement acceptés",
    help: "Votre banque ne propose pas encore Wero, ou vous avez une question sur le règlement ? Appelez le cabinet :",
  },
  footer: { legal: "Mentions légales", privacy: "Confidentialité", payment: "Régler votre séance" },
  newTab: "(nouvel onglet)",
} as const;
