/**
 * Écarts entre le contenu lu dans Notion et le contenu de secours (fallback.ts), pour savoir quand ce dernier
 * est en retard. Sert à `notion:check` (contrôle quotidien de la production) : un avertissement, jamais un échec.
 */

/**
 * Chemins non comparés : l'identifiant de page Notion et les URL des photos (volontairement absentes du secours),
 * et les pages d'information (`guides`), non recopiées dans le secours : texte de santé relu par Patrice dans
 * Notion seulement.
 */
const IGNORED = [/^motifs\.\d+\.notionPageId$/, /^images\.\w+\.src$/, /^guides(\.|$)/];

const show = (value: unknown) => {
  const text = JSON.stringify(value) ?? "absent";
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Une ligne par valeur différente, avec son chemin (« access.bus », « faq.2.answer »). */
export function contentDrift(fallback: unknown, live: unknown, path = ""): string[] {
  if (IGNORED.some((pattern) => pattern.test(path))) return [];
  if (isRecord(fallback) && isRecord(live) && Array.isArray(fallback) === Array.isArray(live)) {
    const keys = new Set([...Object.keys(fallback), ...Object.keys(live)]);
    return [...keys].flatMap((key) => contentDrift(fallback[key], live[key], path ? `${path}.${key}` : key));
  }
  return JSON.stringify(fallback) === JSON.stringify(live) ? [] : [`${path} : secours ${show(fallback)} ≠ Notion ${show(live)}`];
}
