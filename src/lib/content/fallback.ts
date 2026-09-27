import type { SiteContent } from "./types";

/**
 * Snapshot du contenu Notion au 27/09/2026 (+ valeurs du brief).
 * Utilisé : (1) sans NOTION_TOKEN (dev, CI, sandbox) ; (2) champ par champ si un champ
 * OBLIGATOIRE est vide dans Notion. Ne jamais l'utiliser pour masquer une panne Notion en prod.
 */
export const FALLBACK_CONTENT: SiteContent = {
  practitioner: { name: "Patrice Tchikaya", title: "Ostéopathe D.O." },
  seo: {
    h1: "Ostéopathe à Dudelange – Patrice Tchikaya",
    heroSubtitle:
      "Prise en charge globale des douleurs articulaires et musculaires. Expertise dédiée aux sportifs, actifs et accompagnement sur-mesure.",
    metaTitle: null,
    metaDescription: null,
  },
  contact: {
    street: "46 Avenue Grande-Duchesse Charlotte",
    postalCode: "3440",
    locality: "Dudelange",
    countryName: "Luxembourg",
    countryCode: "LU",
    phoneDisplay: "+352 51 92 92",
    phoneE164: "+352519292",
  },
  booking: {
    url: "https://cal.eu/patrice-tchikaya-pro/consultation",
    provider: "cal",
    calLink: "patrice-tchikaya-pro/consultation",
    calOrigin: "https://app.cal.eu",
  },
  googleBusinessUrl: "https://g.page/r/CY0QxWkj7WfJEBM",
  consultation: {
    durationLabel: "45 minutes",
    durationMinutes: 45,
    price: null,
    reimbursement:
      "Consultations prises en charge par les mutuelles et assurances complémentaires de santé.",
  },
  rating: { value: 5, count: null },
  openingHours: null,
  access: null,
  languages: [],
  about: {
    education: null,
    title: "Un parcours unique au service de votre santé",
    shortBio:
      "Ostéopathe installé au sein du cabinet de Dudelange, Patrice Tchikaya propose une prise en charge globale et personnalisée de la douleur.",
    longBio:
      "Ancien sportif de haut niveau en handball et ancien cadre supérieur d'entreprise, Patrice Tchikaya dispose d'une compréhension fine des contraintes physiques et psychiques du corps humain. Son double parcours lui permet de traiter avec une précision particulière les traumatismes liés au sport, ainsi que les troubles musculo-squelettiques (TMS), le stress et les mauvaises postures générés par le monde professionnel.",
    expertises: [
      {
        title: "Ancien sportif de haut niveau en handball",
        text: "Maîtrise des pathologies mécaniques, des traumatismes sportifs, de la récupération et de la prévention.",
      },
      {
        title: "Ancien cadre supérieur d'entreprise",
        text: "Compréhension directe du stress, des troubles musculo-squelettiques (TMS) et des mauvaises postures liées au travail sur écran.",
      },
      {
        title: "Ostéopathe D.O.",
        text: "Une approche systémique, douce et globale du patient.",
      },
    ],
  },
  motifs: [
    {
      title: "Ostéopathie du Sport",
      slug: "osteopathie-du-sport-dudelange",
      description:
        "Entorses, tendinites, préparation physique, récupération et suivi des athlètes de tous niveaux.",
      icon: "Activity",
      notionPageId: null,
    },
    {
      title: "Posture & Vie Pro (TMS)",
      slug: "tms-ergonomie-bureau",
      description:
        "Mal de dos, cervicalgies, tensions sur écran, canal carpien et gestion du stress corporel.",
      icon: "Briefcase",
      notionPageId: null,
    },
    {
      title: "Traumatologie & Douleurs",
      slug: "traitement-lumbago-sciatique-dudelange",
      description: "Lumbagos, sciatiques, blocages articulaires aigus ou chroniques.",
      icon: "Zap",
      notionPageId: null,
    },
    {
      title: "Bilan Préventif",
      slug: "bilan-osteopathique-annuel",
      description: "Bilan postural global, ajustements préventifs et rééquilibrage du corps.",
      icon: "ShieldCheck",
      notionPageId: null,
    },
  ],
  reviews: [
    {
      author: "Yves S.",
      rating: 5,
      text: "Après pas mal d'années de soins auprès de Leiner Daniel ( parti à la retraite ) me voici entre les mains de Patrice Tchikaya ( son successeur ) que je recommande vivement , extrêmement à l'écoute , lors de ma première séance pour bien cerner ma douleur. après des manipulations ( bien ciblées et douces ) qui m'ont soulagées rapidement . Ce qui est très appréciable sont ses conseils afin d'éviter des faux mouvements et douleurs répétitives . Très bon accueil au cabinet . A recommander .",
      date: "2026-09-21",
    },
    {
      author: "Jeff D.",
      rating: 5,
      text: "Excellent ostéopathe ! Il travaille avec beaucoup de professionnalisme et prend vraiment le temps nécessaire avec ses patients. On se sent écouté et très bien pris en charge. En plus d'être très compétent, il a beaucoup d'humour, ce qui rend les séances vraiment agréables. Je le recommande vivement",
      date: "2026-09-13",
    },
    {
      author: "Michelle Y.",
      rating: 5,
      text: "On m'a recommandé Patrice lorsque j'étais enceinte et que j'avais mal au dos. Après une seule séance, la douleur avait complètement disparu ! Il a un souci du détail incroyable et m'a donné des exercices à faire pour s'assurer que la douleur ne revienne pas. (translated)",
      date: "2026-07-05",
    },
  ],
  faq: [
    {
      question: "Comment se déroule une séance d'ostéopathie ?",
      answer:
        "La séance dure 45 minutes. Elle débute par une anamnèse précise (questionnaire médical), suivie d'un examen clinique, du traitement manuel adapté et de conseils personnalisés.",
    },
    {
      question: "Les consultations sont-elles remboursées au Luxembourg ?",
      answer:
        "L'ostéopathie est prise en charge par la majorité des mutuelles et assurances complémentaires de santé. Une facture vous est remise à l'issue de la séance.",
    },
    {
      question: "Faut-il une ordonnance médicale pour consulter ?",
      answer:
        "Non, l'ostéopathe est un praticien de première intention. Vous pouvez prendre rendez-vous directement sans ordonnance préalable.",
    },
  ],
  images: {
    hero: { src: null, alt: "Cabinet d'ostéopathie Patrice Tchikaya à Dudelange", width: 960, height: 1200 },
    portrait: { src: null, alt: "Patrice Tchikaya, ostéopathe D.O. à Dudelange", width: 800, height: 1000 },
    cabinet: {
      src: null,
      alt: "Cabinet d'ostéopathie et salle de consultation Patrice Tchikaya à Dudelange",
      width: 1200,
      height: 800,
    },
  },
  sameAs: ["https://g.page/r/CY0QxWkj7WfJEBM"],
};
