import { ACCESS_ROW_IDS, INFO_ROW_IDS } from "./rows";
import { motifPageFromMarkdown } from "./blocks";
import type { SiteContent } from "./types";

/**
 * Pages motifs (phase 9) : corps des pages Notion validées par Patrice (case Page_Validée),
 * copié tel quel le 29/09/2026. Sert uniquement sans NOTION_TOKEN (dev, CI) : en production,
 * les pages viennent toujours de Notion. Pour rafraîchir : copier le Markdown de chaque page Notion.
 */
const SPORT_PAGE = motifPageFromMarkdown(
  `
Que vous jouiez en club, couriez le week-end ou prépariez une compétition, une douleur qui revient à chaque entraînement finit par limiter vos performances et votre plaisir. Au cabinet de Dudelange, Patrice Tchikaya, ancien handballeur de haut niveau, reçoit les sportifs de tous niveaux : après une blessure, pendant une reprise, ou pour faire le point quand une gêne s'installe.
## Pour quelles douleurs consulter ?
- Entorses de la cheville, du genou ou des doigts, une fois une fracture écartée si nécessaire
- Tendinites (tendinopathies) : épaule, coude, genou, tendon d'Achille
- Contractures, raideurs et douleurs musculaires qui reviennent à l'effort
- Douleurs de l'épaule chez les sportifs qui lancent ou qui frappent (handball, volley, tennis)
- Douleurs de dos, de nuque ou de bassin liées à l'entraînement
- Reprise après une blessure, une opération ou une longue pause
## Le regard d'un ancien sportif de haut niveau
Le handball à haut niveau a appris à Patrice ce que le terrain impose au corps : appuis et changements de direction, réceptions de saut, gestes de tir répétés, et un calendrier qui laisse peu de place à la récupération. Il comprend l'envie de reprendre vite. Il sait aussi qu'une reprise trop rapide expose à la rechute, et vous aide à trouver le bon rythme.
## Comment se déroule la séance
1. **Les questions** : votre sport, votre niveau, votre volume d'entraînement, la façon dont la douleur est apparue, ce qui l'aggrave ou la soulage, et vos éventuels examens.
2. **L'examen** : mobilité, force et tests de la zone douloureuse, mais aussi des zones voisines. Une douleur au genou, par exemple, peut s'accompagner d'une raideur de la cheville ou de la hanche.
3. **Le traitement manuel** : des techniques adaptées à la zone et à l'étape de la récupération, toujours expliquées avant d'être pratiquées.
4. **Le plan de reprise** : des conseils concrets pour les semaines suivantes, ce qu'il faut faire, ce qu'il vaut mieux éviter, et comment remettre de la charge progressivement.
## Préparation, récupération, prévention
L'ostéopathie n'est pas réservée aux blessures. Certains sportifs consultent pendant la préparation d'une saison, lors d'une période d'entraînement intense, ou quand une gêne revient toujours au même endroit. L'objectif est de repérer une raideur ou un déséquilibre qui s'installe, et d'adapter l'entraînement avant que la douleur ne s'impose.
## En complément des autres professionnels
L'ostéopathie complète la rééducation, elle ne la remplace pas. Après une blessure importante (rupture de ligament, fracture, opération), la kinésithérapie et le suivi médical restent la base ; l'ostéopathie peut s'y ajouter, en accord avec les professionnels qui vous suivent. Apportez vos comptes rendus et vos examens : ils aident à adapter la séance.
## Quand demander d'abord un avis médical
- Impossible de faire quelques pas après une entorse, douleur vive au toucher d'un os, ou déformation : une fracture doit d'abord être écartée.
- Genou qui gonfle très vite après un pivot, ou qui se dérobe.
- Sensation d'avoir reçu un coup à l'arrière du mollet, difficulté à monter sur la pointe du pied : une rupture du tendon d'Achille est possible.
- Choc à la tête suivi de maux de tête, de vertiges, de nausées ou d'une confusion : un avis médical est indispensable avant toute reprise.
En cas de doute, appelez le cabinet : Patrice vous dira si une séance est adaptée ou s'il vaut mieux consulter d'abord un autre professionnel de santé.
## Questions fréquentes
### Faut-il être sportif de haut niveau pour consulter ?
Non. Le cabinet reçoit aussi bien les compétiteurs que les personnes qui courent, nagent ou jouent une fois par semaine. Ce qui compte, c'est ce que vous voulez pouvoir refaire sans douleur.
### Combien de séances faut-il ?
Cela dépend de la blessure, de votre niveau et de votre calendrier. À la fin de la première séance, Patrice vous dit si un suivi lui paraît utile, et à quel rythme.
### Quand consulter après une blessure ?
Si les signes ci-dessus font craindre une lésion grave, faites-la d'abord évaluer. Pour une contracture ou une gêne qui traîne, inutile d'attendre qu'elle s'installe davantage.
`,
  "2026-09-29T21:03:59.543Z",
);

const TMS_PAGE = motifPageFromMarkdown(
  `
Journées devant l'écran, réunions qui s'enchaînent, trajets quotidiens : le corps encaisse. Nuque raide en fin de journée, épaules tendues, bas du dos douloureux, poignets qui fourmillent… Ces troubles musculo-squelettiques (TMS) comptent parmi les problèmes de santé liés au travail les plus fréquents en Europe. Ancien cadre supérieur, Patrice Tchikaya connaît ce quotidien de l'intérieur. Au cabinet de Dudelange, il vous aide à soulager ces douleurs et à comprendre ce qui les entretient.
## Les troubles les plus fréquents
- Douleurs de nuque (cervicalgies), parfois accompagnées de maux de tête de tension
- Épaules et haut du dos tendus, douleur entre les omoplates
- Mal de dos lié à la position assise prolongée
- Douleurs du coude ou du poignet liées à la souris et au clavier
- Fourmillements dans la main ou les doigts
## Au cabinet : une séance tournée vers votre quotidien
Patrice vous interroge sur votre poste de travail, vos horaires, vos déplacements, votre activité physique et votre sommeil. L'examen porte sur la zone douloureuse et sur ce qui l'entoure : une douleur au poignet, par exemple, peut aussi avoir un lien avec le cou ou l'épaule. Le traitement manuel est suivi de conseils concrets, applicables dès le lendemain : réglages du poste, exercices courts, rythme des pauses.
## Canal carpien : ce qu'il faut savoir
Des fourmillements dans le pouce, l'index et le majeur, souvent la nuit, peuvent évoquer un syndrome du canal carpien : la compression d'un nerf au niveau du poignet. D'autres causes existent, notamment au niveau du cou. Patrice examine l'ensemble du trajet (cou, épaule, coude, poignet) et vous oriente vers un avis médical si les signes le justifient.
## Le stress se loge aussi dans le corps
Le stress s'accompagne souvent de tensions musculaires dans la nuque, les épaules, la mâchoire ou le dos, d'une respiration plus courte et d'un sommeil moins réparateur. Une séance d'ostéopathie peut aider à relâcher ces tensions physiques. Elle ne traite ni l'anxiété ni l'épuisement professionnel : si le stress devient envahissant (sommeil, humeur, fatigue qui ne passe pas), parlez-en à un professionnel de santé.
## Cinq réglages simples pour le travail sur écran
1. **L'écran** : le haut de l'écran à hauteur des yeux ou un peu en dessous, à environ une longueur de bras.
2. **L'ordinateur portable** : pour de longues sessions, un support et un clavier séparé évitent de pencher la tête en avant.
3. **Les bras** : coudes près du corps, avant-bras soutenus, poignets dans l'axe.
4. **Le siège** : pieds à plat au sol ou sur un repose-pieds, bas du dos soutenu.
5. **Le mouvement** : le meilleur réglage reste de changer souvent de position. Levez-vous régulièrement, même une minute : appel téléphonique debout, pause pour boire, escaliers.
## Quand demander un avis médical
- Fourmillements ou engourdissements permanents, perte de force ou maladresse de la main
- Douleur de nuque après un choc (accident de voiture, chute)
- Douleur qui s'aggrave malgré le repos, fièvre ou perte de poids inexpliquée
Un mal de tête brutal et très intense, ou inhabituel, est une urgence : appelez le 112.
## Questions fréquentes
### Une séance peut-elle remplacer l'aménagement du poste ?
Non, les deux se complètent. La séance soulage ; les réglages du poste et vos habitudes limitent le risque que la douleur revienne.
### À quel moment consulter ?
Quand une gêne revient régulièrement malgré les pauses et les réglages du poste, ou qu'elle commence à perturber votre travail ou votre sommeil.
### Et si je travaille debout ou en déplacement ?
Les TMS ne concernent pas que le travail de bureau : gestes répétés, port de charges, longues heures de conduite ou station debout prolongée peuvent aussi être en cause. Le principe reste le même : comprendre ce que votre journée impose à votre corps, et l'adapter.
`,
  "2026-09-29T21:03:57.263Z",
);

const TRAUMA_PAGE = motifPageFromMarkdown(
  `
Un faux mouvement en portant un carton, une douleur qui descend dans la jambe, un cou bloqué au réveil : ces douleurs sont fréquentes, parfois très vives, et le plus souvent bénignes. Au cabinet de Dudelange, Patrice Tchikaya vous aide à comprendre ce qui se passe, cherche avec vous à soulager la douleur et vous accompagne pour reprendre vos activités en confiance.
## Lumbago : le mal de dos qui bloque
Le lumbago, ou lombalgie aiguë, est une douleur du bas du dos qui apparaît souvent brutalement : après un effort, un faux mouvement, ou sans raison évidente. Il peut gêner chaque geste : se lever d'une chaise, s'habiller, se retourner dans le lit.
La plupart des lumbagos s'améliorent nettement en quelques jours à quelques semaines. Rester actif, autant que la douleur le permet, aide à récupérer : le repos strict au lit est aujourd'hui déconseillé.
## Sciatique : quand la douleur descend dans la jambe
La sciatique est une douleur qui part du bas du dos ou de la fesse et descend à l'arrière de la cuisse, parfois jusqu'au pied. Elle est due à l'irritation d'une racine du nerf sciatique dans le bas du dos, souvent par une hernie discale. Elle peut s'accompagner de fourmillements ou d'engourdissements. Quand la douleur descend plutôt à l'avant de la cuisse, on parle de cruralgie.
La sciatique évolue le plus souvent favorablement, mais plus lentement qu'un lumbago : il faut parfois plusieurs semaines.
## Nuque et dos : les « blocages »
Torticolis au réveil, douleur dans le haut du dos après une longue journée assis, sensation de dos « coincé » : ces blocages, récents ou installés depuis longtemps, font partie des motifs de consultation les plus fréquents en ostéopathie.
## Douleur récente ou douleur qui dure : deux approches
Face à une douleur récente, l'objectif est de soulager, de redonner de la mobilité et de vous aider à rester actif.
Quand la douleur dure depuis plus de trois mois, on parle de douleur chronique. Le travail devient plus global : comprendre ce qui l'entretient (postures, charge de travail, sommeil, stress, manque de mouvement) et construire avec vous des habitudes durables. L'ostéopathie s'inscrit alors souvent dans une prise en charge plus large, avec une activité physique adaptée, de la kinésithérapie ou un suivi médical.
## Comment se passe la séance
1. **Les questions** : comment la douleur est apparue, où elle se situe, ce qui la soulage ou l'aggrave, vos antécédents, et la recherche de signes qui imposeraient un avis médical.
2. **L'examen** : mobilité du dos et des articulations voisines ; quand la douleur descend dans la jambe, tests simples de sensibilité, de force et des réflexes.
3. **Le traitement** : des techniques manuelles douces, adaptées à l'intensité de la douleur.
4. **Les conseils** : positions qui soulagent, gestes à éviter pendant quelques jours, et étapes pour reprendre vos activités.
Pas besoin d'ordonnance ni d'examens pour consulter. Si vous avez déjà une radio, une IRM ou un compte rendu, apportez-les.
## Quand consulter en urgence ou demander un avis médical
**Appelez le 112 ou rendez-vous aux urgences en cas de :**
- perte de contrôle de la vessie ou des selles, ou difficulté à uriner ;
- engourdissement autour des parties génitales, de l'anus ou à l'intérieur des cuisses ;
- faiblesse d'une jambe ou d'un pied qui s'aggrave ;
- douleur dans la poitrine ou essoufflement.
**Demandez rapidement un avis médical si :**
- la douleur fait suite à une chute ou à un choc violent ;
- elle s'accompagne de fièvre ou d'une perte de poids inexpliquée, ou si vous avez un antécédent de cancer ;
- elle ne se calme ni au repos ni la nuit, ou s'aggrave de semaine en semaine.
## Questions fréquentes
### Combien de séances faut-il pour un lumbago ?
Cela dépend de la douleur, de son ancienneté et de votre activité. À la fin de la première consultation, Patrice vous dit si un suivi lui paraît utile.
### Peut-on consulter en pleine crise ?
Oui, en l'absence des signes d'alerte ci-dessus. La séance est adaptée à l'intensité de la douleur : quand chaque mouvement fait mal, les techniques restent très douces.
### Faut-il faire une radio avant de venir ?
Non, aucun examen n'est nécessaire pour consulter. Si vous en avez déjà, apportez-les : ils complètent l'examen.
`,
  "2026-09-29T21:03:58.130Z",
);

const BILAN_PAGE = motifPageFromMarkdown(
  `
Pas besoin d'avoir mal pour consulter un ostéopathe. Un bilan préventif permet de faire le point sur votre mobilité, vos postures et vos habitudes, de repérer les raideurs ou les tensions qui s'installent, et de repartir avec des conseils adaptés à votre quotidien. Au cabinet de Dudelange, Patrice Tchikaya le propose aux actifs comme aux sportifs.
## Pourquoi faire un bilan sans avoir mal ?
Une raideur au réveil, un dos fatigué en fin de journée, une épaule qui tire sur certains gestes : ces petites gênes peuvent être les premiers signes qu'une contrainte s'installe. Les repérer tôt permet d'agir sur vos habitudes avant que la douleur ne s'impose.
## Pour qui ?
- Les personnes qui passent leurs journées assises, debout ou à porter des charges
- Les sportifs, avant une nouvelle saison ou un objectif (course, tournoi)
- Après un changement : nouveau poste, déménagement, reprise d'une activité physique
- Après une blessure guérie, pour vérifier que tout a retrouvé sa mobilité
- Tous ceux qui aiment faire le point régulièrement
## Comment se déroule le bilan
1. **Un entretien complet** : activité professionnelle, sport, sommeil, antécédents, gênes passées ou actuelles.
2. **Un examen global** : posture, mobilité de la colonne, du bassin, des épaules et des hanches, équilibre et appuis.
3. **Des techniques manuelles** si des raideurs ou des tensions le justifient.
4. **Un plan simple** : deux ou trois habitudes ou exercices à mettre en place, plutôt qu'une longue liste difficile à tenir.
## Ce qu'un bilan ostéopathique n'est pas
Il ne remplace ni un bilan de santé médical, ni les examens de dépistage, ni le suivi d'une maladie. Si l'examen révèle un signe qui relève d'un autre professionnel de santé, Patrice vous le dira et vous orientera.
## À quelle fréquence ?
Il n'y a pas de règle universelle. Certains patients font le point une fois par an, d'autres avant chaque saison sportive, d'autres seulement quand leur situation change. Patrice vous donne son avis à la fin du bilan, sans vous engager dans un suivi qui ne serait pas utile.
## Questions fréquentes
### En quoi le bilan diffère-t-il d'une consultation pour une douleur ?
Par son point de départ. Au lieu de partir d'une douleur précise, Patrice regarde l'ensemble de votre corps et de vos habitudes, pour repérer ce qui pourrait devenir douloureux.
### Que faut-il apporter ?
Vos examens ou comptes rendus récents s'il y en a, la liste de vos traitements en cours et, si vous êtes sportif, votre programme d'entraînement.
`,
  "2026-09-29T21:03:58.864Z",
);

/**
 * Snapshot du contenu Notion au 01/10/2026 (lignes relues avec le connecteur Notion et converties par
 * fetchSiteContent), sauf les URL des photos : voir `images`.
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
    // Ajouté le 28/09/2026 (clé Notion Telephone_Mobile) : ligne directe de Patrice, secondaire (il ne peut pas
    // décrocher en séance) ; le numéro du cabinet ci-dessus reste le principal.
    mobilePhone: { display: "+352 691 044 147", e164: "+352691044147" },
    // Vérifiées le 27/09/2026 (clic droit sur le bâtiment, Google Maps) : 49°28'52.3"N 6°05'03.7"E.
    geo: { latitude: 49.481194, longitude: 6.084361 },
    email: "patrice.tchikaya.pro@gmail.com",
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
    price: "90 €",
    reimbursement:
      "Consultations prises en charge par les mutuelles et assurances complémentaires de santé.",
  },
  // Transmis par Patrice (via Arthur, 28/09/2026) : règlement après la séance, Wero parmi les options.
  // Coordonnées Wero et autres moyens de paiement : saisis ensuite dans Notion.
  // Encart « Bon à savoir » : non souhaité pour l'instant (29/09/2026) -> null, activable depuis Notion.
  // `page` = instantané de la base Notion Page_Paiement (créée le 29/09/2026, relue le 01/10/2026).
  payment: {
    info: "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés.",
    wero: { recipient: { value: "+352 691 044 147", kind: "phone" }, recipientName: "Patrice Tchikaya" },
    otherMethods: "Revolut",
    page: {
      eyebrow: "Paiement",
      title: "Régler votre séance",
      intro: "Voici comment payer avec Wero, en quelques secondes depuis votre téléphone.",
      metaTitle: null,
      metaDescription: null,
      steps: {
        title: "Payer avec Wero, étape par étape",
        cards: [
          {
            title: "Ouvrez Wero",
            text: "Dans l'application Wero, ou dans l'application de votre banque si Wero y est intégré.",
          },
          {
            title: "Choisissez le destinataire",
            text: "Choisissez l'envoi d'argent, puis saisissez le numéro de mobile ou l'adresse e-mail Wero de Patrice Tchikaya.",
          },
          {
            title: "Indiquez le montant",
            text: "Saisissez le montant de votre séance. En message, précisez le nom du patient et la date de la séance.",
          },
          {
            title: "Vérifiez, puis validez",
            text: "Contrôlez le nom du bénéficiaire affiché et le montant, puis validez avec votre empreinte, votre visage ou votre code. L'argent arrive en quelques secondes.",
          },
        ],
      },
      caution: null,
      reassurance: {
        title: "Un paiement simple et sûr",
        cards: [
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
      },
      firstTime: {
        title: "Première utilisation de Wero ?",
        cards: [
          {
            title: "Votre banque est au Luxembourg",
            text: "Téléchargez l'application Wero, puis reliez-la à votre compte : votre identité est vérifiée via LuxTrust ou l'application de votre banque.\nWero est proposé notamment par Spuerkeess, BGL BNP Paribas, BIL, Banque Raiffeisen et POST.\nVous utilisiez Payconiq ? Wero le remplace au Luxembourg depuis septembre 2026.",
          },
          {
            title: "Votre banque est en France, en Belgique ou en Allemagne",
            text: "Wero y est proposé par de nombreuses banques, souvent directement dans leur application : cherchez « Wero » dans ses menus.",
          },
        ],
      },
      help: {
        title: "Pas de Wero, ou une question ?",
        text: "Votre banque ne propose pas encore Wero, ou vous avez une question sur le règlement ? Appelez le cabinet :",
      },
      labels: {
        phone: "Numéro Wero",
        email: "Adresse e-mail Wero",
        name: "Nom affiché par Wero",
        price: "Tarif de la consultation",
        caution: "Bon à savoir",
        otherMethods: "Autres moyens de paiement acceptés",
      },
    },
  },
  rating: { value: 5, count: 16 },
  openingHours: [
    { days: ["Mo"], opens: "08:30", closes: "19:00" },
    { days: ["Tu"], opens: "07:00", closes: "16:45" },
    { days: ["We"], opens: "08:30", closes: "19:00" },
    { days: ["Th"], opens: "08:30", closes: "19:00" },
    { days: ["Fr"], opens: "08:30", closes: "17:45" },
    { days: ["Sa"], opens: "08:30", closes: "12:30" },
  ],
  // Avec un jour fermé, les lignes affichées sont celles de Notion, telles quelles.
  openingHoursLines: [
    "Lundi : 08:30–19:00",
    "Mardi : 07:00–16:45",
    "Mercredi : 08:30–19:00",
    "Jeudi : 08:30–19:00",
    "Vendredi : 08:30–17:45",
    "Samedi : 08:30–12:30",
    "Dimanche : fermé",
  ],
  access: {
    train: "Gare CFL de Dudelange-Ville à 280 m, sur la même avenue (4 min à pied). Ligne CFL 60, via Bettembourg.",
    bus: "Arrêt « Gare Dudelange-Ville » à 280 m : bus de la ville 8, 9 et 10, lignes régionales RGTR 631, 633 et 651.",
    parking: "Parking à 150 mètres.",
    accessibility: "1er étage avec ascenseur.",
  },
  rowOrder: { infos: [...INFO_ROW_IDS], access: [...ACCESS_ROW_IDS] },
  languages: ["Français", "Anglais", "Italien", "Espagnol", "notions de Portugais"],
  about: {
    education: "London School of Osteopathy - 2010",
    continuingEducation: [],
    title: "Un parcours unique au service de votre santé",
    shortBio:
      "Ostéopathe installé au sein du cabinet de Dudelange, Patrice Tchikaya propose une prise en charge globale et personnalisée de la douleur.",
    longBio:
      "Ancien sportif en Première Division Française de Handball et ancien cadre en entreprise, Patrice Tchikaya dispose d'une compréhension fine des contraintes physiques et psychiques du corps humain. Son double parcours lui permet de traiter avec une précision particulière les traumatismes liés au sport, ainsi que les troubles musculo-squelettiques (TMS), le stress et les mauvaises postures générés par le monde professionnel.",
    expertises: [
      {
        title: "Ancien sportif en handball",
        text: "Maîtrise des pathologies mécaniques, des traumatismes sportifs, de la récupération et de la prévention.",
        icon: "Trophy",
      },
      {
        title: "Ancien cadre en entreprise",
        text: "Compréhension directe du stress, des troubles musculo-squelettiques (TMS) et des mauvaises postures liées au travail sur écran.",
        icon: "Briefcase",
      },
      {
        title: "Ostéopathe D.O.",
        text: "Une approche systémique, douce et globale du patient.",
        icon: "BadgeCheck",
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
      page: SPORT_PAGE,
    },
    {
      title: "Bilan Préventif",
      slug: "bilan-osteopathique-annuel",
      description: "Bilan postural global, ajustements préventifs et rééquilibrage du corps.",
      icon: "ShieldCheck",
      notionPageId: null,
      page: BILAN_PAGE,
    },
    {
      title: "Traumatologie & Douleurs",
      slug: "traitement-lumbago-sciatique-dudelange",
      description: "Lumbagos, sciatiques, blocages articulaires aigus ou chroniques.",
      icon: "Zap",
      notionPageId: null,
      page: TRAUMA_PAGE,
    },
    {
      title: "Posture & Vie Pro (TMS)",
      slug: "tms-ergonomie-bureau",
      description:
        "Mal de dos, cervicalgies, tensions sur écran, canal carpien et gestion du stress corporel.",
      icon: "Briefcase",
      notionPageId: null,
      page: TMS_PAGE,
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
      text: "Excellent ostéopathe ! Il travaille avec beaucoup de professionnalisme et prend vraiment le temps nécessaire avec ses patients. On se sent écouté et très bien pris en charge. En plus d’être très compétent, il a beaucoup d’humour, ce qui rend les séances vraiment agréables. Je le recommande vivement",
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
      question: "Faut-il une ordonnance médicale pour consulter ?",
      answer:
        "Non, l'ostéopathe est un praticien de première intention. Vous pouvez prendre rendez-vous directement sans ordonnance préalable.",
    },
    {
      question: "Les consultations sont-elles remboursées au Luxembourg ?",
      answer:
        "L'ostéopathie est prise en charge par la majorité des mutuelles et assurances complémentaires de santé. Une facture vous est remise à l'issue de la séance.",
    },
    {
      question: "Comment se déroule une séance d'ostéopathie ?",
      answer:
        "La séance dure 45 minutes. Elle débute par une anamnèse précise (questionnaire médical), suivie d'un examen clinique, du traitement manuel adapté et de conseils personnalisés.",
    },
    {
      question: "Comment et quand puis-je régler ma séance ?",
      answer:
        "Le règlement se fait après la séance. Wero fait partie des moyens de paiement acceptés : vous envoyez le montant de la consultation depuis votre téléphone, en quelques secondes. Pour toute question sur le règlement, appelez le cabinet.",
    },
  ],
  // Photos : URL Vercel Blob dans Notion, volontairement absentes ici. Sans NOTION_TOKEN (dev, CI), le site
  // affiche donc le placeholder (règle 3) et ne dépend d'aucun hôte d'images externe.
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
  legal: { authorizationNumber: "2026.04-00259-RTAUTO", vatStatus: null },
};
