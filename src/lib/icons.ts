import {
  Activity, Baby, BadgeCheck, Bone, Brain, Briefcase, Dumbbell, Footprints, Hand, HandHeart, HeartPulse,
  Laptop, Leaf, PersonStanding, ShieldCheck, Sparkles, Stethoscope, Trophy, Wind, Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Icônes autorisées dans Notion (nom exact, sensible à la casse) : colonne « Icone_Lucide » des motifs
 * et clés « Expertise_N_Icone » de la section À propos.
 */
export const MOTIF_ICONS = {
  Activity, Baby, BadgeCheck, Bone, Brain, Briefcase, Dumbbell, Footprints, Hand, HandHeart, HeartPulse,
  Laptop, Leaf, PersonStanding, ShieldCheck, Sparkles, Stethoscope, Trophy, Wind, Zap,
} satisfies Record<string, LucideIcon>;

export type MotifIconName = keyof typeof MOTIF_ICONS;
export const DEFAULT_MOTIF_ICON: MotifIconName = "Sparkles";

/** Icône par défaut de la carte d'expertise N (index N - 1, en boucle) si « Expertise_N_Icone » est vide ou inconnue. */
export const DEFAULT_EXPERTISE_ICONS: MotifIconName[] = ["Trophy", "Briefcase", "BadgeCheck"];

export function resolveIconName(
  raw: string,
  onUnknown?: (raw: string) => void,
  fallback: MotifIconName = DEFAULT_MOTIF_ICON,
): MotifIconName {
  const name = raw.trim();
  // hasOwn et non `in` : « constructor » ou « toString » ne doivent pas passer pour des icônes.
  if (Object.hasOwn(MOTIF_ICONS, name)) return name as MotifIconName;
  if (name) onUnknown?.(name);
  return fallback;
}
