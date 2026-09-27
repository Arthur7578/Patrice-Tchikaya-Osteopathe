import {
  Activity, Baby, Bone, Brain, Briefcase, Dumbbell, Footprints, Hand, HandHeart, HeartPulse,
  Laptop, Leaf, PersonStanding, ShieldCheck, Sparkles, Stethoscope, Wind, Zap,
  type LucideIcon,
} from "lucide-react";

/** Icônes autorisées pour la colonne Notion « Icone_Lucide » (nom exact, sensible à la casse). */
export const MOTIF_ICONS = {
  Activity, Baby, Bone, Brain, Briefcase, Dumbbell, Footprints, Hand, HandHeart, HeartPulse,
  Laptop, Leaf, PersonStanding, ShieldCheck, Sparkles, Stethoscope, Wind, Zap,
} satisfies Record<string, LucideIcon>;

export type MotifIconName = keyof typeof MOTIF_ICONS;
export const DEFAULT_MOTIF_ICON: MotifIconName = "Sparkles";

export function resolveIconName(raw: string, onUnknown?: (raw: string) => void): MotifIconName {
  const name = raw.trim();
  if (name in MOTIF_ICONS) return name as MotifIconName;
  if (name) onUnknown?.(name);
  return DEFAULT_MOTIF_ICON;
}
