// FICHIER GÉNÉRÉ par `npm run fallback:sync` (workflow mensuel « Synchronisation du contenu de secours »). Ne pas
// modifier à la main : la prochaine synchronisation écraserait la modification. Pour changer un texte, le modifier
// dans Notion ; ce fichier le reprend à la prochaine synchronisation, après relecture de la PR.
//
// Copie de Notion (hors URL des photos, identifiants de page et pages d'information) qui sert aux tests, à la CI
// et au développement sans NOTION_TOKEN, et de valeur de départ aux champs obligatoires vides. Voir docs/DECISIONS.md.
import type { SiteContent } from "./types";

export const FALLBACK_CONTENT: SiteContent = {
  about: {
    continuingEducation: [],
    education: "London School of Osteopathy - 2010",
    expertises: [
      {
        icon: "Trophy",
        text: "Maîtrise des pathologies mécaniques, des traumatismes sportifs, de la récupération et de la prévention.",
        title: "Ancien sportif en handball",
      },
      {
        icon: "Briefcase",
        text: "Compréhension directe du stress, des troubles musculo-squelettiques (TMS) et des mauvaises postures liées au travail sur écran.",
        title: "Ancien cadre en entreprise",
      },
      {
        icon: "BadgeCheck",
        text: "Une approche systémique, douce et globale du patient.",
        title: "Ostéopathe D.O.",
      },
    ],
    longBio: "Ancien sportif en Première Division Française de Handball et ancien cadre en entreprise, Patrice Tchikaya dispose d'une compréhension fine des contraintes physiques et psychiques du corps humain. Son double parcours lui permet de traiter avec une précision particulière les traumatismes liés au sport, ainsi que les troubles musculo-squelettiques (TMS), le stress et les mauvaises postures générés par le monde professionnel.",
    shortBio: "Ostéopathe installé au sein du cabinet de Dudelange, Patrice Tchikaya propose une prise en charge globale et personnalisée de la douleur.",
    title: "Un parcours unique au service de votre santé",
  },
  access: {
    accessibility: "1er étage avec ascenseur.",
    bus: "Arrêt « Gare Dudelange-Ville » à 280 m : bus de la ville 8, 9 et 10, lignes régionales RGTR 631, 633 et 651.",
    parking: "Parking à 150 mètres.",
    train: "Gare CFL de Dudelange-Ville à 280 m, sur la même avenue (4 min à pied). Ligne CFL 60, via Bettembourg.",
  },
  booking: {
    calLink: "patrice-tchikaya-pro",
    calOrigin: "https://app.cal.com",
    provider: "cal",
    url: "https://cal.com/patrice-tchikaya-pro",
  },
  consultation: {
    durationLabel: "45 minutes",
    durationMinutes: 45,
    price: "90 €",
    reimbursement: "Consultations prises en charge par les mutuelles et assurances complémentaires de santé.",
  },
  contact: {
    countryCode: "LU",
    countryName: "Luxembourg",
    email: "patrice.tchikaya.pro@gmail.com",
    geo: {
      latitude: 49.481194,
      longitude: 6.084361,
    },
    locality: "Dudelange",
    mobilePhone: {
      display: "+352 691 044 147",
      e164: "+352691044147",
    },
    phoneDisplay: "+352 51 92 92",
    phoneE164: "+352519292",
    postalCode: "3440",
    street: "46 Avenue Grande-Duchesse Charlotte",
  },
  faq: [
    {
      answer: "Une séance de 45 minutes coûte 90 €, réglée après la séance. La CNS ne rembourse pas l'ostéopathie, mais certaines assurances complémentaires, comme la CMCM, en remboursent une partie selon votre contrat. Frontaliers : renseignez-vous auprès de votre mutuelle. Une facture vous est remise après chaque séance.",
      question: "Combien coûte une séance, et est-elle remboursée ?",
    },
    {
      answer: "Non. Vous pouvez prendre rendez-vous directement, en ligne ou par téléphone, sans ordonnance.",
      question: "Faut-il une ordonnance pour consulter ?",
    },
    {
      answer: "Elle dure 45 minutes. Patrice vous interroge d'abord sur votre douleur, vos antécédents et votre quotidien (travail, sport). Il observe ensuite votre posture et la mobilité de vos articulations, puis traite avec les mains. Vous repartez avec des conseils, et si besoin des exercices, pour éviter que la douleur revienne.",
      question: "Comment se passe la première séance ?",
    },
    {
      answer: "En général, non : le traitement est doux et adapté à votre douleur. Les manipulations qui font « craquer » ne sont pas systématiques, et Patrice vous explique chaque geste avant de le faire. Une légère fatigue ou des courbatures peuvent apparaître le lendemain.",
      question: "Est-ce que ça fait mal ? Est-ce que ça « craque » ?",
    },
    {
      answer: "Cela dépend de votre douleur et de son ancienneté. À la fin de la première séance, Patrice vous dit s'il est utile de revenir, et dans quel délai.",
      question: "Combien de séances faut-il prévoir ?",
    },
    {
      answer: "Les créneaux disponibles s'affichent dans l'agenda en ligne. Si aucun ne convient et que la douleur est forte, appelez le cabinet. Après une chute ou un choc, ou en cas de fièvre, de fourmillements ou de perte de force dans un bras ou une jambe, faites d'abord un bilan médical.",
      question: "Puis-je être reçu rapidement en cas de lumbago ou de torticolis ?",
    },
    {
      answer: "Pour une grossesse, un enfant ou un bébé, appelez le cabinet avant de réserver : Patrice vous dira si une séance est adaptée à votre situation.",
      question: "Recevez-vous les femmes enceintes, les enfants et les bébés ?",
    },
    {
      answer: "Si vous en avez, apportez vos examens récents liés à la douleur (radios, IRM, comptes rendus). Prévoyez une tenue souple et confortable.",
      question: "Que dois-je apporter, et comment m'habiller ?",
    },
    {
      answer: "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés : vous envoyez le montant de la consultation depuis votre téléphone, en quelques secondes. Pour toute question sur le règlement, appelez le cabinet.",
      question: "Comment et quand puis-je régler ma séance ?",
    },
  ],
  googleBusinessUrl: "https://g.page/r/CY0QxWkj7WfJEBM",
  guides: [],
  images: {
    cabinet: {
      alt: "Cabinet d'ostéopathie et salle de consultation Patrice Tchikaya à Dudelange",
      height: 800,
      src: null,
      width: 1200,
    },
    hero: {
      alt: "Cabinet d'ostéopathie Patrice Tchikaya à Dudelange",
      height: 1200,
      src: null,
      width: 960,
    },
    portrait: {
      alt: "Patrice Tchikaya, ostéopathe D.O. à Dudelange",
      height: 1000,
      src: null,
      width: 800,
    },
  },
  languages: [
    "Français",
    "Anglais",
    "Italien",
    "Espagnol",
    "notions de Portugais",
  ],
  legal: {
    authorizationNumber: "2026.04-00259-RTAUTO",
    vatStatus: null,
  },
  motifs: [
    {
      description: "Entorses, tendinites, préparation physique, récupération et suivi des athlètes de tous niveaux.",
      icon: "Activity",
      notionPageId: null,
      page: {
        blocks: [
          {
            text: [
              {
                text: "Que vous jouiez en club, couriez le week-end ou prépariez une compétition, une douleur qui revient à chaque entraînement finit par limiter vos performances et votre plaisir. Au cabinet de Dudelange, Patrice Tchikaya, ancien handballeur de haut niveau, reçoit les sportifs de tous niveaux : après une blessure, pendant une reprise, ou pour faire le point quand une gêne s'installe.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Pour quelles douleurs consulter ?",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  text: "Entorses de la cheville, du genou ou des doigts, une fois une fracture écartée si nécessaire",
                },
              ],
              [
                {
                  text: "Tendinites (tendinopathies) : épaule, coude, genou, tendon d'Achille",
                },
              ],
              [
                {
                  text: "Contractures, raideurs et douleurs musculaires qui reviennent à l'effort",
                },
              ],
              [
                {
                  text: "Douleurs de l'épaule chez les sportifs qui lancent ou qui frappent (handball, volley, tennis)",
                },
              ],
              [
                {
                  text: "Douleurs de dos, de nuque ou de bassin liées à l'entraînement",
                },
              ],
              [
                {
                  text: "Reprise après une blessure, une opération ou une longue pause",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Le regard d'un ancien sportif de haut niveau",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Le handball à haut niveau a appris à Patrice ce que le terrain impose au corps : appuis et changements de direction, réceptions de saut, gestes de tir répétés, et un calendrier qui laisse peu de place à la récupération. Il comprend l'envie de reprendre vite. Il sait aussi qu'une reprise trop rapide expose à la rechute, et vous aide à trouver le bon rythme.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Comment se déroule la séance",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  bold: true,
                  text: "Les questions",
                },
                {
                  text: " : votre sport, votre niveau, votre volume d'entraînement, la façon dont la douleur est apparue, ce qui l'aggrave ou la soulage, et vos éventuels examens.",
                },
              ],
              [
                {
                  bold: true,
                  text: "L'examen",
                },
                {
                  text: " : mobilité, force et tests de la zone douloureuse, mais aussi des zones voisines. Une douleur au genou, par exemple, peut s'accompagner d'une raideur de la cheville ou de la hanche.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Le traitement manuel",
                },
                {
                  text: " : des techniques adaptées à la zone et à l'étape de la récupération, toujours expliquées avant d'être pratiquées.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Le plan de reprise",
                },
                {
                  text: " : des conseils concrets pour les semaines suivantes, ce qu'il faut faire, ce qu'il vaut mieux éviter, et comment remettre de la charge progressivement.",
                },
              ],
            ],
            ordered: true,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Préparation, récupération, prévention",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "L'ostéopathie n'est pas réservée aux blessures. Certains sportifs consultent pendant la préparation d'une saison, lors d'une période d'entraînement intense, ou quand une gêne revient toujours au même endroit. L'objectif est de repérer une raideur ou un déséquilibre qui s'installe, et d'adapter l'entraînement avant que la douleur ne s'impose.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "En complément des autres professionnels",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "L'ostéopathie complète la rééducation, elle ne la remplace pas. Après une blessure importante (rupture de ligament, fracture, opération), la kinésithérapie et le suivi médical restent la base ; l'ostéopathie peut s'y ajouter, en accord avec les professionnels qui vous suivent. Apportez vos comptes rendus et vos examens : ils aident à adapter la séance.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Quand demander d'abord un avis médical",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  text: "Impossible de faire quelques pas après une entorse, douleur vive au toucher d'un os, ou déformation : une fracture doit d'abord être écartée.",
                },
              ],
              [
                {
                  text: "Genou qui gonfle très vite après un pivot, ou qui se dérobe.",
                },
              ],
              [
                {
                  text: "Sensation d'avoir reçu un coup à l'arrière du mollet, difficulté à monter sur la pointe du pied : une rupture du tendon d'Achille est possible.",
                },
              ],
              [
                {
                  text: "Choc à la tête suivi de maux de tête, de vertiges, de nausées ou d'une confusion : un avis médical est indispensable avant toute reprise.",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            text: [
              {
                text: "En cas de doute, appelez le cabinet : Patrice vous dira si une séance est adaptée ou s'il vaut mieux consulter d'abord un autre professionnel de santé.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Questions fréquentes",
              },
            ],
            type: "heading",
          },
          {
            level: 3,
            text: [
              {
                text: "Faut-il être sportif de haut niveau pour consulter ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Non. Le cabinet reçoit aussi bien les compétiteurs que les personnes qui courent, nagent ou jouent une fois par semaine. Ce qui compte, c'est ce que vous voulez pouvoir refaire sans douleur.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "Combien de séances faut-il ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Cela dépend de la blessure, de votre niveau et de votre calendrier. À la fin de la première séance, Patrice vous dit si un suivi lui paraît utile, et à quel rythme.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "Quand consulter après une blessure ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Si les signes ci-dessus font craindre une lésion grave, faites-la d'abord évaluer. Pour une contracture ou une gêne qui traîne, inutile d'attendre qu'elle s'installe davantage.",
              },
            ],
            type: "paragraph",
          },
        ],
        lastEdited: "2026-10-02T22:32:00.000Z",
        wordCount: 641,
      },
      slug: "osteopathie-du-sport-dudelange",
      title: "Ostéopathie du Sport",
    },
    {
      description: "Bilan postural global, ajustements préventifs et rééquilibrage du corps.",
      icon: "ShieldCheck",
      notionPageId: null,
      page: {
        blocks: [
          {
            text: [
              {
                text: "Pas besoin d'avoir mal pour consulter un ostéopathe. Un bilan préventif permet de faire le point sur votre mobilité, vos postures et vos habitudes, de repérer les raideurs ou les tensions qui s'installent, et de repartir avec des conseils adaptés à votre quotidien. Au cabinet de Dudelange, Patrice Tchikaya le propose aux actifs comme aux sportifs.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Pourquoi faire un bilan sans avoir mal ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Une raideur au réveil, un dos fatigué en fin de journée, une épaule qui tire sur certains gestes : ces petites gênes peuvent être les premiers signes qu'une contrainte s'installe. Les repérer tôt permet d'agir sur vos habitudes avant que la douleur ne s'impose.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Pour qui ?",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  text: "Les personnes qui passent leurs journées assises, debout ou à porter des charges",
                },
              ],
              [
                {
                  text: "Les sportifs, avant une nouvelle saison ou un objectif (course, tournoi)",
                },
              ],
              [
                {
                  text: "Après un changement : nouveau poste, déménagement, reprise d'une activité physique",
                },
              ],
              [
                {
                  text: "Après une blessure guérie, pour vérifier que tout a retrouvé sa mobilité",
                },
              ],
              [
                {
                  text: "Tous ceux qui aiment faire le point régulièrement",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Comment se déroule le bilan",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  bold: true,
                  text: "Un entretien complet",
                },
                {
                  text: " : activité professionnelle, sport, sommeil, antécédents, gênes passées ou actuelles.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Un examen global",
                },
                {
                  text: " : posture, mobilité de la colonne, du bassin, des épaules et des hanches, équilibre et appuis.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Des techniques manuelles",
                },
                {
                  text: " si des raideurs ou des tensions le justifient.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Un plan simple",
                },
                {
                  text: " : deux ou trois habitudes ou exercices à mettre en place, plutôt qu'une longue liste difficile à tenir.",
                },
              ],
            ],
            ordered: true,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Ce qu'un bilan ostéopathique n'est pas",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Il ne remplace ni un bilan de santé médical, ni les examens de dépistage, ni le suivi d'une maladie. Si l'examen révèle un signe qui relève d'un autre professionnel de santé, Patrice vous le dira et vous orientera.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "À quelle fréquence ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Il n'y a pas de règle universelle. Certains patients font le point une fois par an, d'autres avant chaque saison sportive, d'autres seulement quand leur situation change. Patrice vous donne son avis à la fin du bilan, sans vous engager dans un suivi qui ne serait pas utile.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Questions fréquentes",
              },
            ],
            type: "heading",
          },
          {
            level: 3,
            text: [
              {
                text: "En quoi le bilan diffère-t-il d'une consultation pour une douleur ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Par son point de départ. Au lieu de partir d'une douleur précise, Patrice regarde l'ensemble de votre corps et de vos habitudes, pour repérer ce qui pourrait devenir douloureux.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "Que faut-il apporter ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Vos examens ou comptes rendus récents s'il y en a, la liste de vos traitements en cours et, si vous êtes sportif, votre programme d'entraînement.",
              },
            ],
            type: "paragraph",
          },
        ],
        lastEdited: "2026-10-02T22:32:00.000Z",
        wordCount: 392,
      },
      slug: "bilan-osteopathique-annuel",
      title: "Bilan Préventif",
    },
    {
      description: "Lumbagos, sciatiques, blocages articulaires aigus ou chroniques.",
      icon: "Zap",
      notionPageId: null,
      page: {
        blocks: [
          {
            text: [
              {
                text: "Un faux mouvement en portant un carton, une douleur qui descend dans la jambe, un cou bloqué au réveil : ces douleurs sont fréquentes, parfois très vives, et le plus souvent bénignes. Au cabinet de Dudelange, Patrice Tchikaya vous aide à comprendre ce qui se passe, cherche avec vous à soulager la douleur et vous accompagne pour reprendre vos activités en confiance.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Lumbago : le mal de dos qui bloque",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Le lumbago, ou lombalgie aiguë, est une douleur du bas du dos qui apparaît souvent brutalement : après un effort, un faux mouvement, ou sans raison évidente. Il peut gêner chaque geste : se lever d'une chaise, s'habiller, se retourner dans le lit.",
              },
            ],
            type: "paragraph",
          },
          {
            text: [
              {
                text: "La plupart des lumbagos s'améliorent nettement en quelques jours à quelques semaines. Rester actif, autant que la douleur le permet, aide à récupérer : le repos strict au lit est aujourd'hui déconseillé.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Sciatique : quand la douleur descend dans la jambe",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "La sciatique est une douleur qui part du bas du dos ou de la fesse et descend à l'arrière de la cuisse, parfois jusqu'au pied. Elle est due à l'irritation d'une racine du nerf sciatique dans le bas du dos, souvent par une hernie discale. Elle peut s'accompagner de fourmillements ou d'engourdissements. Quand la douleur descend plutôt à l'avant de la cuisse, on parle de cruralgie.",
              },
            ],
            type: "paragraph",
          },
          {
            text: [
              {
                text: "La sciatique évolue le plus souvent favorablement, mais plus lentement qu'un lumbago : il faut parfois plusieurs semaines.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Nuque et dos : les « blocages »",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Torticolis au réveil, douleur dans le haut du dos après une longue journée assis, sensation de dos « coincé » : ces blocages, récents ou installés depuis longtemps, font partie des motifs de consultation les plus fréquents en ostéopathie.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Douleur récente ou douleur qui dure : deux approches",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Face à une douleur récente, l'objectif est de soulager, de redonner de la mobilité et de vous aider à rester actif.",
              },
            ],
            type: "paragraph",
          },
          {
            text: [
              {
                text: "Quand la douleur dure depuis plus de trois mois, on parle de douleur chronique. Le travail devient plus global : comprendre ce qui l'entretient (postures, charge de travail, sommeil, stress, manque de mouvement) et construire avec vous des habitudes durables. L'ostéopathie s'inscrit alors souvent dans une prise en charge plus large, avec une activité physique adaptée, de la kinésithérapie ou un suivi médical.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Comment se passe la séance",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  bold: true,
                  text: "Les questions",
                },
                {
                  text: " : comment la douleur est apparue, où elle se situe, ce qui la soulage ou l'aggrave, vos antécédents, et la recherche de signes qui imposeraient un avis médical.",
                },
              ],
              [
                {
                  bold: true,
                  text: "L'examen",
                },
                {
                  text: " : mobilité du dos et des articulations voisines ; quand la douleur descend dans la jambe, tests simples de sensibilité, de force et des réflexes.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Le traitement",
                },
                {
                  text: " : des techniques manuelles douces, adaptées à l'intensité de la douleur.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Les conseils",
                },
                {
                  text: " : positions qui soulagent, gestes à éviter pendant quelques jours, et étapes pour reprendre vos activités.",
                },
              ],
            ],
            ordered: true,
            type: "list",
          },
          {
            text: [
              {
                text: "Pas besoin d'ordonnance ni d'examens pour consulter. Si vous avez déjà une radio, une IRM ou un compte rendu, apportez-les.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Quand consulter en urgence ou demander un avis médical",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                bold: true,
                text: "Appelez le 112 ou rendez-vous aux urgences en cas de :",
              },
            ],
            type: "paragraph",
          },
          {
            items: [
              [
                {
                  text: "perte de contrôle de la vessie ou des selles, ou difficulté à uriner ;",
                },
              ],
              [
                {
                  text: "engourdissement autour des parties génitales, de l'anus ou à l'intérieur des cuisses ;",
                },
              ],
              [
                {
                  text: "faiblesse d'une jambe ou d'un pied qui s'aggrave ;",
                },
              ],
              [
                {
                  text: "douleur dans la poitrine ou essoufflement.",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            text: [
              {
                bold: true,
                text: "Demandez rapidement un avis médical si :",
              },
            ],
            type: "paragraph",
          },
          {
            items: [
              [
                {
                  text: "la douleur fait suite à une chute ou à un choc violent ;",
                },
              ],
              [
                {
                  text: "elle s'accompagne de fièvre ou d'une perte de poids inexpliquée, ou si vous avez un antécédent de cancer ;",
                },
              ],
              [
                {
                  text: "elle ne se calme ni au repos ni la nuit, ou s'aggrave de semaine en semaine.",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Questions fréquentes",
              },
            ],
            type: "heading",
          },
          {
            level: 3,
            text: [
              {
                text: "Combien de séances faut-il pour un lumbago ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Cela dépend de la douleur, de son ancienneté et de votre activité. À la fin de la première consultation, Patrice vous dit si un suivi lui paraît utile.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "Peut-on consulter en pleine crise ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Oui, en l'absence des signes d'alerte ci-dessus. La séance est adaptée à l'intensité de la douleur : quand chaque mouvement fait mal, les techniques restent très douces.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "Faut-il faire une radio avant de venir ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Non, aucun examen n'est nécessaire pour consulter. Si vous en avez déjà, apportez-les : ils complètent l'examen.",
              },
            ],
            type: "paragraph",
          },
        ],
        lastEdited: "2026-10-02T22:32:00.000Z",
        wordCount: 671,
      },
      slug: "traitement-lumbago-sciatique-dudelange",
      title: "Traumatologie & Douleurs",
    },
    {
      description: "Mal de dos, cervicalgies, tensions sur écran, canal carpien et gestion du stress corporel.",
      icon: "Briefcase",
      notionPageId: null,
      page: {
        blocks: [
          {
            text: [
              {
                text: "Journées devant l'écran, réunions qui s'enchaînent, trajets quotidiens : le corps encaisse. Nuque raide en fin de journée, épaules tendues, bas du dos douloureux, poignets qui fourmillent… Ces troubles musculo-squelettiques (TMS) comptent parmi les problèmes de santé liés au travail les plus fréquents en Europe. Ancien cadre supérieur, Patrice Tchikaya connaît ce quotidien de l'intérieur. Au cabinet de Dudelange, il vous aide à soulager ces douleurs et à comprendre ce qui les entretient.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Les troubles les plus fréquents",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  text: "Douleurs de nuque (cervicalgies), parfois accompagnées de maux de tête de tension",
                },
              ],
              [
                {
                  text: "Épaules et haut du dos tendus, douleur entre les omoplates",
                },
              ],
              [
                {
                  text: "Mal de dos lié à la position assise prolongée",
                },
              ],
              [
                {
                  text: "Douleurs du coude ou du poignet liées à la souris et au clavier",
                },
              ],
              [
                {
                  text: "Fourmillements dans la main ou les doigts",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Au cabinet : une séance tournée vers votre quotidien",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Patrice vous interroge sur votre poste de travail, vos horaires, vos déplacements, votre activité physique et votre sommeil. L'examen porte sur la zone douloureuse et sur ce qui l'entoure : une douleur au poignet, par exemple, peut aussi avoir un lien avec le cou ou l'épaule. Le traitement manuel est suivi de conseils concrets, applicables dès le lendemain : réglages du poste, exercices courts, rythme des pauses.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Canal carpien : ce qu'il faut savoir",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Des fourmillements dans le pouce, l'index et le majeur, souvent la nuit, peuvent évoquer un syndrome du canal carpien : la compression d'un nerf au niveau du poignet. D'autres causes existent, notamment au niveau du cou. Patrice examine l'ensemble du trajet (cou, épaule, coude, poignet) et vous oriente vers un avis médical si les signes le justifient.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Le stress se loge aussi dans le corps",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Le stress s'accompagne souvent de tensions musculaires dans la nuque, les épaules, la mâchoire ou le dos, d'une respiration plus courte et d'un sommeil moins réparateur. Une séance d'ostéopathie peut aider à relâcher ces tensions physiques. Elle ne traite ni l'anxiété ni l'épuisement professionnel : si le stress devient envahissant (sommeil, humeur, fatigue qui ne passe pas), parlez-en à un professionnel de santé.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Cinq réglages simples pour le travail sur écran",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  bold: true,
                  text: "L'écran",
                },
                {
                  text: " : le haut de l'écran à hauteur des yeux ou un peu en dessous, à environ une longueur de bras.",
                },
              ],
              [
                {
                  bold: true,
                  text: "L'ordinateur portable",
                },
                {
                  text: " : pour de longues sessions, un support et un clavier séparé évitent de pencher la tête en avant.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Les bras",
                },
                {
                  text: " : coudes près du corps, avant-bras soutenus, poignets dans l'axe.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Le siège",
                },
                {
                  text: " : pieds à plat au sol ou sur un repose-pieds, bas du dos soutenu.",
                },
              ],
              [
                {
                  bold: true,
                  text: "Le mouvement",
                },
                {
                  text: " : le meilleur réglage reste de changer souvent de position. Levez-vous régulièrement, même une minute : appel téléphonique debout, pause pour boire, escaliers.",
                },
              ],
            ],
            ordered: true,
            type: "list",
          },
          {
            level: 2,
            text: [
              {
                text: "Quand demander un avis médical",
              },
            ],
            type: "heading",
          },
          {
            items: [
              [
                {
                  text: "Fourmillements ou engourdissements permanents, perte de force ou maladresse de la main",
                },
              ],
              [
                {
                  text: "Douleur de nuque après un choc (accident de voiture, chute)",
                },
              ],
              [
                {
                  text: "Douleur qui s'aggrave malgré le repos, fièvre ou perte de poids inexpliquée",
                },
              ],
            ],
            ordered: false,
            type: "list",
          },
          {
            text: [
              {
                text: "Un mal de tête brutal et très intense, ou inhabituel, est une urgence : appelez le 112.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 2,
            text: [
              {
                text: "Questions fréquentes",
              },
            ],
            type: "heading",
          },
          {
            level: 3,
            text: [
              {
                text: "Une séance peut-elle remplacer l'aménagement du poste ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Non, les deux se complètent. La séance soulage ; les réglages du poste et vos habitudes limitent le risque que la douleur revienne.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "À quel moment consulter ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Quand une gêne revient régulièrement malgré les pauses et les réglages du poste, ou qu'elle commence à perturber votre travail ou votre sommeil.",
              },
            ],
            type: "paragraph",
          },
          {
            level: 3,
            text: [
              {
                text: "Et si je travaille debout ou en déplacement ?",
              },
            ],
            type: "heading",
          },
          {
            text: [
              {
                text: "Les TMS ne concernent pas que le travail de bureau : gestes répétés, port de charges, longues heures de conduite ou station debout prolongée peuvent aussi être en cause. Le principe reste le même : comprendre ce que votre journée impose à votre corps, et l'adapter.",
              },
            ],
            type: "paragraph",
          },
        ],
        lastEdited: "2026-10-02T22:32:00.000Z",
        wordCount: 594,
      },
      slug: "tms-ergonomie-bureau",
      title: "Posture & Vie Pro (TMS)",
    },
  ],
  openingHours: [
    {
      closes: "19:00",
      days: [
        "Mo",
      ],
      opens: "08:30",
    },
    {
      closes: "16:45",
      days: [
        "Tu",
      ],
      opens: "07:00",
    },
    {
      closes: "19:00",
      days: [
        "We",
      ],
      opens: "08:30",
    },
    {
      closes: "19:00",
      days: [
        "Th",
      ],
      opens: "08:30",
    },
    {
      closes: "17:45",
      days: [
        "Fr",
      ],
      opens: "08:30",
    },
    {
      closes: "12:30",
      days: [
        "Sa",
      ],
      opens: "08:30",
    },
  ],
  openingHoursLines: [
    "Lundi : 08:30–19:00",
    "Mardi : 07:00–16:45",
    "Mercredi : 08:30–19:00",
    "Jeudi : 08:30–19:00",
    "Vendredi : 08:30–17:45",
    "Samedi : 08:30–12:30",
    "Dimanche : fermé",
  ],
  payment: {
    info: "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés.",
    otherMethods: "Revolut",
    page: {
      caution: null,
      eyebrow: "Paiement",
      firstTime: {
        cards: [
          {
            text: "Téléchargez l'application Wero, puis reliez-la à votre compte : votre identité est vérifiée via LuxTrust ou l'application de votre banque.\nWero est proposé notamment par Spuerkeess, BGL BNP Paribas, BIL, Banque Raiffeisen et POST.\nVous utilisiez Payconiq ? Wero le remplace au Luxembourg depuis septembre 2026.",
            title: "Votre banque est au Luxembourg",
          },
          {
            text: "Wero y est proposé par de nombreuses banques, souvent directement dans leur application : cherchez « Wero » dans ses menus.",
            title: "Votre banque est en France, en Belgique ou en Allemagne",
          },
        ],
        title: "Première utilisation de Wero ?",
      },
      help: {
        text: "Votre banque ne propose pas encore Wero, ou vous avez une question sur le règlement ? Appelez le cabinet :",
        title: "Pas de Wero, ou une question ?",
      },
      intro: "Voici comment payer avec Wero, en quelques secondes depuis votre téléphone.",
      labels: {
        caution: "Bon à savoir",
        email: "Adresse e-mail Wero",
        name: "Nom affiché par Wero",
        otherMethods: "Autres moyens de paiement acceptés",
        phone: "Numéro Wero",
        price: "Tarif de la consultation",
      },
      metaDescription: null,
      metaTitle: null,
      reassurance: {
        cards: [
          {
            text: "Wero est développé par l'European Payments Initiative (EPI), soutenue par de grandes banques européennes.",
            title: "Une solution des banques européennes",
          },
          {
            text: "Un numéro de mobile ou une adresse e-mail suffit : ni IBAN, ni numéro de carte.",
            title: "Aucune coordonnée bancaire à partager",
          },
          {
            text: "Aucun paiement ne part sans votre validation dans l'application : empreinte, reconnaissance faciale ou code.",
            title: "Validé par vous seul",
          },
          {
            text: "Wero affiche le nom du bénéficiaire avant que vous validiez, puis l'argent arrive en quelques secondes.",
            title: "Le bon destinataire, en quelques secondes",
          },
        ],
        title: "Un paiement simple et sûr",
      },
      steps: {
        cards: [
          {
            text: "Dans l'application Wero, ou dans l'application de votre banque si Wero y est intégré.",
            title: "Ouvrez Wero",
          },
          {
            text: "Choisissez l'envoi d'argent, puis saisissez le numéro de mobile ou l'adresse e-mail Wero de Patrice Tchikaya.",
            title: "Choisissez le destinataire",
          },
          {
            text: "Saisissez le montant de votre séance. En message, précisez le nom du patient et la date de la séance.",
            title: "Indiquez le montant",
          },
          {
            text: "Contrôlez le nom du bénéficiaire affiché et le montant, puis validez avec votre empreinte, votre visage ou votre code. L'argent arrive en quelques secondes.",
            title: "Vérifiez, puis validez",
          },
        ],
        title: "Payer avec Wero, étape par étape",
      },
      title: "Régler votre séance",
    },
    wero: {
      recipient: {
        kind: "phone",
        value: "+352 691 044 147",
      },
      recipientName: "Patrice Tchikaya",
    },
  },
  practitioner: {
    name: "Patrice Tchikaya",
    title: "Ostéopathe D.O.",
  },
  rating: {
    count: 16,
    value: 5,
  },
  reviews: [
    {
      author: "Yves S.",
      date: "2026-09-21",
      rating: 5,
      text: "Après pas mal d'années de soins auprès de Leiner Daniel ( parti à la retraite ) me voici entre les mains de Patrice Tchikaya ( son successeur ) que je recommande vivement , extrêmement à l'écoute , lors de ma première séance pour bien cerner ma douleur. après des manipulations ( bien ciblées et douces ) qui m'ont soulagées rapidement . Ce qui est très appréciable sont ses conseils afin d'éviter des faux mouvements et douleurs répétitives . Très bon accueil au cabinet . A recommander .",
    },
    {
      author: "Jeff D.",
      date: "2026-09-13",
      rating: 5,
      text: "Excellent ostéopathe ! Il travaille avec beaucoup de professionnalisme et prend vraiment le temps nécessaire avec ses patients. On se sent écouté et très bien pris en charge. En plus d’être très compétent, il a beaucoup d’humour, ce qui rend les séances vraiment agréables. Je le recommande vivement",
    },
    {
      author: "Michelle Y.",
      date: "2026-07-05",
      rating: 5,
      text: "On m'a recommandé Patrice lorsque j'étais enceinte et que j'avais mal au dos. Après une seule séance, la douleur avait complètement disparu ! Il a un souci du détail incroyable et m'a donné des exercices à faire pour s'assurer que la douleur ne revienne pas. (traduit de l’anglais)",
    },
  ],
  rowOrder: {
    access: [
      "adresse",
      "parking",
      "bus",
      "train",
      "pmr",
    ],
    hero: [
      "duree",
      "tarif",
      "ordonnance",
    ],
    infos: [
      "telephone",
      "duree",
      "tarif",
      "reglement",
      "remboursement",
      "horaires",
      "langues",
      "acces",
    ],
  },
  sameAs: [
    "https://g.page/r/CY0QxWkj7WfJEBM",
  ],
  seo: {
    h1: "Ostéopathe à Dudelange – Mal de dos, douleurs de cou et blessures du sport",
    heroSubtitle: "Ancien handballeur de 1re division Française et ancien cadre, Patrice Tchikaya soulage lumbagos, cervicalgies, tendinites et tensions dues au travail ou activité physique, et vous donne les conseils pour éviter qu'elles reviennent.",
    metaDescription: null,
    metaTitle: null,
  },
};
