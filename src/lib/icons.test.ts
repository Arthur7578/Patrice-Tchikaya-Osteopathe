import { describe, expect, it, vi } from "vitest";
import { DEFAULT_MOTIF_ICON, resolveIconName } from "./icons";

describe("resolveIconName (icône Lucide saisie dans Notion)", () => {
  it("nom connu, espaces autour compris : gardé tel quel", () => {
    expect(resolveIconName("  Activity ")).toBe("Activity");
  });

  it("nom inconnu : icône par défaut et signalement ; sans fonction de signalement : pas d'erreur", () => {
    const onUnknown = vi.fn();
    expect(resolveIconName("IconeInexistante", onUnknown, "Dumbbell")).toBe("Dumbbell");
    expect(onUnknown).toHaveBeenCalledWith("IconeInexistante");
    expect(resolveIconName("IconeInexistante")).toBe(DEFAULT_MOTIF_ICON);
  });

  it("valeur vide : icône par défaut, sans signalement (rien n'a été saisi)", () => {
    const onUnknown = vi.fn();
    expect(resolveIconName("   ", onUnknown)).toBe(DEFAULT_MOTIF_ICON);
    expect(onUnknown).not.toHaveBeenCalled();
  });

  it("propriétés héritées d'un objet (« constructor », « toString ») : jamais prises pour des icônes", () => {
    expect(resolveIconName("constructor")).toBe(DEFAULT_MOTIF_ICON);
    expect(resolveIconName("toString")).toBe(DEFAULT_MOTIF_ICON);
  });
});
