import type { UiCopy } from "./ui-copy";

/**
 * Textes d'interface en luxembourgeois, traduits de COPY_FR (ui-copy.ts) : mêmes clés, même sens.
 * Relecture par une personne de langue maternelle luxembourgeoise recommandée (voir docs/DECISIONS.md).
 */
export const COPY_LB: UiCopy = {
  skipLink: "Op den Inhalt sprangen",
  home: "Startsäit",
  nav: { about: "Presentatioun", motifs: "Beschwerden", faq: "FAQ", infos: "Zougang & Präisser" },
  navLabel: "Haaptnavigatioun",
  ratingOn: "op",
  googleMaps: "Google Maps",
  starRating: (value) => `Bewäertung: ${value} vu 5`,
  cta: {
    book: "Online e Rendez-vous huelen",
    bookShort: "Rendez-vous",
    bookMobile: "Rendez-vous huelen",
    call: (phone) => `${phone} uruffen`,
    callCabinet: (phone) => `De Cabinet um ${phone} uruffen`,
  },
  hero: {
    location: (city) => `Cabinet zu ${city}`,
    points: {
      ordonnance: "Ouni Ordonnance",
      duree: (duration) => `Sëtzung vun ${duration}`,
      mutuelle: "Rechnung fir Är Mutuelle",
      tarif: (price) => `Präis: ${price}`,
      confirmation: "Confirmatioun per E-Mail",
    },
    cardTitle: (minutes) => `Konsultatioun ${minutes} Min.`,
    cardSubtitle: "Op Rendez-vous · ouni Ordonnance",
  },
  about: { eyebrow: "Presentatioun", training: "Formatioun" },
  motifs: {
    eyebrow: "Konsultatiounsgrënn",
    title: (city) => `Firwat bei en Osteopath zu ${city}?`,
    intro: (city) =>
      `Am Cabinet zu ${city} fänkt all Sëtzung mat engem komplette Bilan un, fir d'Ursaach vum Péng ze behandelen an net nëmmen de Symptom.`,
    helpLine: "Dir sidd net sécher, ob et fir Iech dat Richtegt ass? Rufft de Cabinet un:",
    discover: (title) => `Méi gewuer ginn: ${title}`,
  },
  motifPage: {
    breadcrumb: "Navigatiounswee",
    home: "Startsäit",
    h1: (title, city) => `${title} zu ${city}`,
    ctaTitle: (city) => `Konsultatioun am Cabinet zu ${city}`,
    ctaText: (duration) =>
      `Sëtzung vun ${duration}, ouni Ordonnance. Reservéiert online, oder rufft de Cabinet un, wann Dir virdrun eng Fro hutt.`,
    related: "Och interessant",
  },
  reviews: {
    eyebrow: "Patientebewäertungen",
    title: "Wat d'Patiente soen",
    source: "Google-Bewäertungen",
    ratingLabel: "Bewäertung",
    ratingCount: (count) => (count === 1 ? "1 Bewäertung" : `${count} Bewäertungen`),
    listLabel: "Patientebewäertungen",
    seeAll: "All d'Bewäertungen op Google",
    leaveReview: "Eng Bewäertung schreiwen",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Heefeg Froen iwwer d'Osteopathie",
    more: (n) => (n === 1 ? "Déi nächst Fro weisen" : `Déi ${n} aner Froe weisen`),
    helpTitle: "Dir fannt Är Äntwert net?",
    helpText: "Rufft de Cabinet un, mir äntwerten Iech gären.",
  },
  infos: {
    eyebrow: "Praktesch Informatiounen",
    title: "Praktesch Informatiounen, Zougang & Präisser",
    labels: {
      address: "Adress", phone: "Telefon", phoneOffice: "Cabinet:", phoneMobile: "Handy:", duration: "Dauer", price: "Präis", payment: "Bezuelen",
      reimbursement: "Remboursement", hours: "Ëffnungszäiten", languages: "Sproochen",
      train: "Zuch", bus: "Bus", parking: "Parking", accessibility: "Accessibilitéit",
    },
    transportTitle: "Wéi kommen ech an de Cabinet",
    moreTitle: "Gutt ze wëssen",
    directions: "Wee",
    map: "Op Google Maps kucken",
    paymentLink: "Wéi bezuelen ech mat Wero",
    bookingTitle: "Är Sëtzung online reservéieren",
    bookingText: "Wielt en Termin: d'Confirmatioun kritt Dir per E-Mail.",
    bookingFallback: "Den Agenda an engem neien Tab opmaachen",
  },
  bookingInline: {
    loading: "Den Agenda gëtt gelueden…",
    failed: "Den Agenda konnt hei net geluede ginn.",
    open: "De Reservatiounsagenda opmaachen",
  },
  payment: {
    metaTitle: "Är Sëtzung mat Wero bezuelen",
    metaDescription: (city) =>
      `Är Osteopathie-Sëtzung zu ${city} mat Wero bezuelen: d'Etappen, firwat et sécher ass a wat Dir maache kënnt, wann Dir nach kee Wero hutt.`,
    step: (n) => `Etapp ${n}: `,
  },
  articles: {
    metaTitle: "All d'Artikelen",
    metaDescription: (city) =>
      `All d'Artikele vum Osteopathie-Cabinet zu ${city}: Konsultatiounsgrënn a praktesch Informatiounen, fir Är Sëtzung virzebereeden.`,
    title: "All d'Artikelen",
    intro: (city) => `D'Konsultatiounsgrënn an déi praktesch Informatioune vum Osteopathie-Cabinet zu ${city}, alles op enger Plaz.`,
  },
  footer: {
    cabinet: "Cabinet",
    links: "Linken",
    googleProfile: "Google-Profil",
    legal: "Impressum",
    privacy: "Dateschutz",
    payment: "Är Sëtzung bezuelen",
    articles: "All d'Artikelen",
    cookies: "Cookien astellen",
  },
  cookies: {
    label: "Zoustëmmung zu de Cookien",
    text: "Dës Websäit benotzt Cookien fir d'Publikumsmoossung (Google Tag Manager) nëmme mat Ärer Zoustëmmung. Dir kënnt Är Meenung zu all Moment iwwer de Link „Cookien astellen“ ënnen op der Säit änneren.",
    refuse: "Refuséieren",
    accept: "Akzeptéieren",
  },
  notFound: {
    title: "Säit net fonnt",
    text: "D'Säit, déi Dir sicht, gëtt et net oder net méi. Dir kënnt op d'Startsäit zréckgoen oder direkt e Rendez-vous huelen.",
  },
  ogImage: { tagline: (city) => `Osteopath zu ${city} – Rendez-vous online` },
  backToHome: "Zréck op d'Startsäit",
  menu: { open: "Menü opmaachen", close: "Menü zoumaachen", label: "Haaptmenü" },
  llms: {
    practical: "Praktesch Informatiounen",
    motifs: "Konsultatiounsgrënn",
    guides: "Informatiounssäiten",
    faq: "Heefeg Froen",
    pages: "Säite vun der Websäit",
    booking: "Rendez-vous online",
    home: "Startsäit",
  },
  newTab: "(neien Tab)",
  languages: {
    label: "Sprooch vun der Websäit",
    frenchOnly: "(op Franséisch)",
  },
  meta: {
    homeTitle: (city, name) => `Osteopath zu ${city} – ${name}, D.O.`,
    homeDescription: (city, duration) =>
      `Osteopathie-Cabinet zu ${city} (Lëtzebuerg): Réck, Nacken, Gelenker, Sport a Belaaschtung op der Aarbecht. Sëtzung vun ${duration}. Rendez-vous online.`,
    titleTemplate: (name, city) => `%s | ${name}, Osteopath zu ${city}`,
    motifLocal: (city) => `Osteopath zu ${city}, ouni Ordonnance.`,
    imageAlt: (name, title, city) => `${name}, ${title} zu ${city}`,
    websiteName: (name, city) => `${name} – Osteopath zu ${city}`,
    knowsAbout: { osteopathy: "Osteopathie", msd: "Muskel- a Skelettbeschwerden", handball: "Handball" },
  },
};
