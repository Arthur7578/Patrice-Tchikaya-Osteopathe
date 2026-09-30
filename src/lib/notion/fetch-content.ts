import { collectPaginatedAPI, isFullBlock, isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { MOTIF_PAGES, NOTION_DATABASES, RESERVED_SLUGS, type NotionDatabaseKey } from "@/config/site";
import { isAllowedImageUrl } from "@/config/images";
import { countWords } from "@/lib/content/blocks";
import { FALLBACK_CONTENT } from "@/lib/content/fallback";
import { formatOpeningHours } from "@/lib/content/format";
import { buildPaymentPage, type PaymentRow } from "@/lib/content/payment-page";
import {
  cleanOptional,
  formatReviewAuthor,
  isPlaceholder,
  normalizeSlug,
  parseBookingUrl,
  parseGeo,
  parseInteger,
  parseList,
  parseOpeningHours,
  parsePhone,
  parsePostalLine,
  parseRating,
  parseWeroRecipient,
  splitOpeningLines,
  toE164,
} from "@/lib/content/parse";
import { ACCESS_ROW_IDS, INFO_ROW_IDS, resolveRowOrder } from "@/lib/content/rows";
import type { ImageSlot, Motif, MotifPage, SiteContent, SiteImage } from "@/lib/content/types";
import { DEFAULT_EXPERTISE_ICONS, resolveIconName } from "@/lib/icons";
import { normalizeNotionBlocks } from "./blocks";
import type { NotionClient } from "./client";
import { getCheckbox, getDateStart, getNumber, getText, getUrl } from "./properties";

type Rows = PageObjectResponse[];

/** Base Notion -> data source (API 2025-09-03) -> toutes les lignes (pages). */
async function queryDatabase(notion: NotionClient, databaseId: string): Promise<Rows> {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  if (!isFullDatabase(db) || db.data_sources.length === 0) {
    throw new Error(`Base Notion ${databaseId} inaccessible (intégration non connectée ?)`);
  }
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: db.data_sources[0].id,
    page_size: 100,
  });
  return results.filter(isFullPage).filter((row) => !row.in_trash);
}

/** Tri : propriété "Ordre" (number) si présente, sinon date de création croissante. */
function sortRows(rows: Rows): Rows {
  return [...rows].sort((a, b) => {
    const oa = getNumber(a.properties, "Ordre");
    const ob = getNumber(b.properties, "Ordre");
    if (oa !== null && ob !== null && oa !== ob) return oa - ob;
    if (oa !== null && ob === null) return -1;
    if (oa === null && ob !== null) return 1;
    return a.created_time.localeCompare(b.created_time);
  });
}

/** Ligne masquée si une case "Publié" existe et est décochée. */
const isPublished = (row: PageObjectResponse) => getCheckbox(row.properties, "Publié") !== false;

/** Bases clé/valeur (Variable -> Valeur). */
function toKeyValue(rows: Rows, valueProp = "Valeur") {
  const map = new Map<string, PageObjectResponse>();
  for (const row of rows) {
    const key = getText(row.properties, "Variable");
    if (key) map.set(key, row);
  }
  return {
    text: (key: string) => {
      const row = map.get(key);
      return row ? getText(row.properties, valueProp) : "";
    },
    url: (key: string) => {
      const row = map.get(key);
      return row ? getUrl(row.properties, valueProp) : null;
    },
    row: (key: string) => map.get(key),
    keys: () => [...map.keys()],
  };
}

const IMAGE_SIZES: Record<ImageSlot, { width: number; height: number; key: string }> = {
  hero: { width: 960, height: 1200, key: "Url_Photo_Hero" },
  portrait: { width: 800, height: 1000, key: "Url_Photo_Portrait" },
  cabinet: { width: 1200, height: 800, key: "Url_Photo_Cabinet" },
};

/**
 * Page détaillée d'un motif (phase 9) : corps de sa page Notion, lu seulement si la case
 * « Page_Validée » est cochée (relecture de Patrice), publié seulement s'il atteint le seuil de mots.
 */
async function loadMotifPage(
  notion: NotionClient,
  row: PageObjectResponse,
  motif: { title: string; slug: string },
  warnings: string[],
): Promise<MotifPage | null> {
  if (getCheckbox(row.properties, MOTIF_PAGES.validatedProperty) !== true) return null;
  const label = `Page « ${motif.title} »`;
  if (RESERVED_SLUGS.has(motif.slug)) {
    warnings.push(`${label} : slug « ${motif.slug} » déjà utilisé par le site, page non publiée`);
    return null;
  }
  const raw = await collectPaginatedAPI(notion.blocks.children.list, { block_id: row.id, page_size: 100 });
  const { blocks, warnings: blockWarnings } = normalizeNotionBlocks(raw.filter(isFullBlock));
  for (const w of blockWarnings) warnings.push(`${label} : ${w}`);
  const wordCount = countWords(blocks);
  if (wordCount < MOTIF_PAGES.minWords) {
    warnings.push(`${label} validée mais trop courte (${wordCount} mots, minimum ${MOTIF_PAGES.minWords}) : non publiée`);
    return null;
  }
  return { blocks, wordCount, lastEdited: row.last_edited_time };
}

export type ContentResult = { content: SiteContent; warnings: string[] };

export async function fetchSiteContent(notion: NotionClient): Promise<ContentResult> {
  const warnings: string[] = [];
  const entries = await Promise.all(
    (Object.keys(NOTION_DATABASES) as NotionDatabaseKey[]).map(async (key) => {
      try {
        return [key, await queryDatabase(notion, NOTION_DATABASES[key])] as const;
      } catch (error) {
        // Pages d'information : facultatives, leur base inaccessible ne doit pas faire retomber tout le site.
        if (key !== "guides") throw error;
        warnings.push(`Pages_Guides illisible, aucune page d'information publiée : ${String(error)}`);
        return [key, [] as Rows] as const;
      }
    }),
  );
  const db = Object.fromEntries(entries) as Record<NotionDatabaseKey, Rows>;
  const F = FALLBACK_CONTENT;

  /** Champ obligatoire : valeur Notion, sinon snapshot + avertissement. */
  const required = (value: string, fallback: string, label: string) => {
    if (!isPlaceholder(value)) return value.trim();
    warnings.push(`Champ obligatoire vide dans Notion : ${label} (valeur de secours utilisée)`);
    return fallback;
  };

  // --- Informations_generales
  const g = toKeyValue(db.general);
  const postal = parsePostalLine(g.text("Code_Postal_Ville"));
  if (!postal) warnings.push("Code_Postal_Ville illisible (attendu : « 3440 Dudelange, Luxembourg »)");
  // Url_Booking : générique et configurable (§ voir docs/DECISIONS.md) — n'importe quel prestataire
  // de RDV fonctionne ; seuls les hôtes Cal.com connus activent l'intégration embarquée (popup + agenda inline).
  const booking = parseBookingUrl(g.url("Url_Booking") ?? "");
  if (!booking) warnings.push("Url_Booking manquante ou invalide (valeur de secours utilisée)");
  const price = cleanOptional(g.text("Tarif_Consultation"));
  if (!price) warnings.push("Tarif_Consultation non renseigné : la ligne « Tarif » sera masquée");
  const ratingValue = parseRating(g.text("Note_Google"));
  const openingRaw = g.text("Horaires");
  const openingHours = parseOpeningHours(openingRaw);
  if (!isPlaceholder(openingRaw) && !openingHours)
    warnings.push(`Horaires non structurés (affichés tels quels, absents du JSON-LD) : « ${openingRaw} »`);
  const phoneDisplay = required(g.text("Telephone_Display"), F.contact.phoneDisplay, "Telephone_Display");
  // Numéro secondaire optionnel (mobile du praticien) : une seule clé, le lien tel: en est dérivé.
  const mobileRaw = g.text("Telephone_Mobile");
  const mobilePhone = parsePhone(mobileRaw);
  if (!isPlaceholder(mobileRaw) && !mobilePhone) warnings.push(`Telephone_Mobile illisible : « ${mobileRaw} » (attendu : « +352 6XX XXX XXX ») — numéro masqué`);
  const durationLabel = required(g.text("Duree_Consultation"), F.consultation.durationLabel, "Duree_Consultation");
  const geoRaw = g.text("GPS_Coordonnees");
  const geo = parseGeo(geoRaw);
  if (geoRaw && !isPlaceholder(geoRaw) && !geo) warnings.push(`GPS_Coordonnees illisible : « ${geoRaw} »`);
  if (!geo) warnings.push("GPS_Coordonnees non renseigné dans Notion (valeur de secours utilisée)");
  // Règlement (page /paiement) : les coordonnées Wero ne sont publiées que si elles sont lisibles.
  const weroRaw = g.text("Wero_Numero_Ou_Email");
  const weroRecipient = parseWeroRecipient(weroRaw);
  if (!weroRecipient)
    warnings.push(
      isPlaceholder(weroRaw)
        ? "Wero_Numero_Ou_Email non renseigné : /paiement explique Wero sans afficher de numéro"
        : `Wero_Numero_Ou_Email illisible : « ${weroRaw} » (numéro de mobile ou e-mail attendu) — non publié`,
    );

  // --- Page_Paiement (textes de /paiement) : base vide => instantané de secours ; sinon Notion fait foi
  // (une section sans ligne est masquée, une ligne « Texte » facultative vide masque son élément).
  const paymentRows: PaymentRow[] = sortRows(db.payment.filter(isPublished)).map((row) => ({
    name: getText(row.properties, "Name"),
    type: getText(row.properties, "Type"),
    text: getText(row.properties, "Texte"),
  }));
  if (paymentRows.length === 0) warnings.push("Page_Paiement vide : texte de secours utilisé pour /paiement");
  const paymentPage =
    paymentRows.length > 0
      ? buildPaymentPage(paymentRows, FALLBACK_CONTENT.payment.page, (message) => warnings.push(message))
      : FALLBACK_CONTENT.payment.page;

  // --- Section A_Propos (+ expertises optionnelles Expertise_1_Titre / Expertise_1_Texte / Expertise_1_Icone …)
  const a = toKeyValue(db.about);
  const expertises = [1, 2, 3, 4].flatMap((i) => {
    const title = a.text(`Expertise_${i}_Titre`);
    const text = a.text(`Expertise_${i}_Texte`);
    if (isPlaceholder(title) || isPlaceholder(text)) return [];
    const icon = resolveIconName(
      cleanOptional(a.text(`Expertise_${i}_Icone`)) ?? "",
      (bad) => warnings.push(`Icône Lucide inconnue « ${bad} » pour Expertise_${i}_Icone (icône par défaut)`),
      DEFAULT_EXPERTISE_ICONS[(i - 1) % DEFAULT_EXPERTISE_ICONS.length],
    );
    return [{ title, text, icon }];
  });

  // --- Medias_Images : colonne URL uniquement (jamais le fichier Notion : URL S3 temporaire ~1 h)
  const m = toKeyValue(db.images);
  const images = Object.fromEntries(
    (Object.keys(IMAGE_SIZES) as ImageSlot[]).map((slot) => {
      const { key, width, height } = IMAGE_SIZES[slot];
      const row = m.row(key);
      const url = row ? getUrl(row.properties, "URL") : null;
      const alt = row ? getText(row.properties, "Alt_description") : "";
      let src: string | null = null;
      if (url && isAllowedImageUrl(url)) src = url;
      else if (url) warnings.push(`${key} : hôte d'image non autorisé (${url}) — voir src/config/images.ts`);
      else if (row?.properties["Image"]?.type === "files" && row.properties["Image"].files.length > 0)
        warnings.push(`${key} : fichier téléversé dans Notion ignoré (URL temporaire). Coller une URL publique dans la colonne URL.`);
      if (!alt) warnings.push(`${key} : Alt_description vide (alt de secours utilisé)`);
      const image: SiteImage = { src, alt: alt || F.images[slot].alt, width, height };
      return [slot, image];
    }),
  ) as Record<ImageSlot, SiteImage>;

  // --- Motifs_Consultation (+ page détaillée si validée, phase 9)
  if (db.motifs.length > 0 && getCheckbox(db.motifs[0].properties, MOTIF_PAGES.validatedProperty) === null) {
    warnings.push(`Motifs_Consultation : colonne « ${MOTIF_PAGES.validatedProperty} » absente, aucune page motif publiée`);
  }
  /** Lignes Notion -> entrées à page détaillée (motifs et guides : mêmes colonnes, titre nommé `titleProp`). */
  const loadEntries = async (rows: Rows, titleProp: string): Promise<Motif[]> =>
    (
      await Promise.all(
        sortRows(rows.filter(isPublished)).map(async (row): Promise<Motif | null> => {
          const title = getText(row.properties, titleProp);
          const slug = normalizeSlug(getText(row.properties, "slug URL") || title);
          if (!title || !slug) return null;
          return {
            title,
            slug,
            description: getText(row.properties, "Description_Courte"),
            icon: resolveIconName(getText(row.properties, "Icone_Lucide"), (bad) =>
              warnings.push(`Icône Lucide inconnue « ${bad} » pour « ${title} » (icône par défaut)`),
            ),
            notionPageId: row.id,
            page: await loadMotifPage(notion, row, { title, slug }, warnings),
          };
        }),
      )
    ).filter((entry): entry is Motif => entry !== null);

  const motifs = await loadEntries(db.motifs, "Motif");
  // Un guide ne peut pas reprendre l'adresse d'un motif (ni d'un autre guide) : le premier publié l'emporte.
  const takenSlugs = new Set(motifs.map((m) => m.slug));
  const guides = (await loadEntries(db.guides, "Titre")).filter((g) => {
    if (!takenSlugs.has(g.slug)) {
      takenSlugs.add(g.slug);
      return true;
    }
    if (g.page) warnings.push(`Page « ${g.title} » : slug « ${g.slug} » déjà pris par un motif ou un autre guide, page non publiée`);
    return false;
  });

  // --- Avis_Patients (du plus récent au plus ancien)
  const reviews = db.reviews
    .filter(isPublished)
    .map((row) => ({
      author: formatReviewAuthor(getText(row.properties, "Nom_Patient")),
      rating: parseRating(getText(row.properties, "Note")),
      text: getText(row.properties, "Avis_Texte"),
      date: getDateStart(row.properties, "Date"),
    }))
    .filter((r) => r.text.length > 0)
    .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));

  // --- FAQ_SEO
  const faq = sortRows(db.faq.filter(isPublished))
    .map((row) => ({ question: getText(row.properties, "Name"), answer: getText(row.properties, "Reponse") }))
    .filter((f) => f.question && f.answer);

  const gbp = g.url("Url_Google_My_Business");
  const profiles = g
    .keys()
    .filter((k) => k.startsWith("Url_Profil_"))
    .map((k) => g.url(k))
    .filter((u): u is string => Boolean(u));
  const languages = (cleanOptional(g.text("Langues_Parlees")) ?? "")
    .split(/[,;]/)
    .map((l) => l.trim())
    .filter(Boolean);
  const content: SiteContent = {
    practitioner: {
      name: required(g.text("Nom_Praticien"), F.practitioner.name, "Nom_Praticien"),
      title: required(g.text("Metier_Titre"), F.practitioner.title, "Metier_Titre"),
    },
    seo: {
      h1: required(g.text("Titre_SEO_H1"), F.seo.h1, "Titre_SEO_H1"),
      heroSubtitle: required(g.text("Sous_Titre_Hero"), F.seo.heroSubtitle, "Sous_Titre_Hero"),
      metaTitle: cleanOptional(g.text("Meta_Title")),
      metaDescription: cleanOptional(g.text("Meta_Description")),
    },
    contact: {
      street: required(g.text("Adresse_Rue"), F.contact.street, "Adresse_Rue"),
      postalCode: postal?.postalCode ?? F.contact.postalCode,
      locality: postal?.locality ?? F.contact.locality,
      countryName: postal?.countryName ?? F.contact.countryName,
      countryCode: "LU",
      phoneDisplay,
      phoneE164: toE164(g.text("Telephone_RAW") || phoneDisplay),
      mobilePhone,
      geo: geo ?? F.contact.geo,
      email: cleanOptional(g.text("Email_Contact")),
    },
    booking: booking ?? F.booking,
    googleBusinessUrl: gbp,
    consultation: {
      durationLabel,
      durationMinutes: parseInteger(durationLabel),
      price,
      reimbursement: required(g.text("Info_Remboursement"), F.consultation.reimbursement, "Info_Remboursement"),
    },
    payment: {
      info: required(g.text("Info_Paiement"), F.payment.info, "Info_Paiement"),
      wero: {
        recipient: weroRecipient,
        recipientName: cleanOptional(g.text("Wero_Nom_Beneficiaire")),
      },
      otherMethods: cleanOptional(g.text("Autres_Moyens_Paiement")),
      page: paymentPage,
    },
    rating: ratingValue === null ? null : { value: ratingValue, count: parseInteger(g.text("Nombre_Avis_Google")) },
    openingHours,
    openingHoursLines: openingHours ? formatOpeningHours(openingHours) : splitOpeningLines(openingRaw),
    access: {
      train: cleanOptional(g.text("Acces_Train")),
      bus: cleanOptional(g.text("Acces_Bus")),
      parking: cleanOptional(g.text("Acces_Parking")),
      accessibility: cleanOptional(g.text("Acces_PMR")),
    },
    rowOrder: {
      infos: resolveRowOrder(g.text("Infos_Ordre"), INFO_ROW_IDS, (bad) =>
        warnings.push(`Infos_Ordre : identifiant inconnu « ${bad} » (attendus : ${INFO_ROW_IDS.join(", ")})`),
      ),
      access: resolveRowOrder(g.text("Acces_Ordre"), ACCESS_ROW_IDS, (bad) =>
        warnings.push(`Acces_Ordre : identifiant inconnu « ${bad} » (attendus : ${ACCESS_ROW_IDS.join(", ")})`),
      ),
    },
    languages,
    about: {
      education: cleanOptional(a.text("Formation")),
      continuingEducation: parseList(a.text("Formations_Continues")),
      title: required(a.text("Titre"), F.about.title, "A_Propos.Titre"),
      shortBio: required(a.text("Bio_Courte"), F.about.shortBio, "A_Propos.Bio_Courte"),
      longBio: required(a.text("Bio_Detaillee"), F.about.longBio, "A_Propos.Bio_Detaillee"),
      expertises: expertises.length > 0 ? expertises : F.about.expertises,
    },
    // Cartes de secours sans page détaillée : jamais de texte de santé non relu dans Notion en production.
    motifs: motifs.length > 0 ? motifs : F.motifs.map((m) => ({ ...m, page: null })),
    guides,
    reviews,
    faq,
    images,
    sameAs: [gbp, ...profiles].filter((u): u is string => Boolean(u)),
    legal: {
      authorizationNumber: cleanOptional(g.text("Numero_Autorisation_Exercer")),
      vatStatus: cleanOptional(g.text("Statut_TVA")),
    },
  };
  return { content, warnings };
}
