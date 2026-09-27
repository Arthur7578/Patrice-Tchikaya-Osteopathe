import { getCalApi } from "@calcom/embed-react";

/**
 * Détails d'intégration spécifiques à Cal.com. N'est utilisé que lorsque
 * `booking.provider === "cal"` (§ voir booking-link.tsx / booking-inline.tsx) : ce fichier
 * n'a aucune vocation à être générique, contrairement au reste de la couche de réservation.
 */

/** Namespaces distincts : le 1er `init` d'un namespace fige son origine (cf. code de embed-react). */
export const CAL_POPUP_NAMESPACE = "rdv-popup";
export const CAL_INLINE_NAMESPACE = "rdv-inline";
export const CAL_CONFIG = { layout: "month_view", theme: "light" } as const;

let popupApi: ReturnType<typeof getCalApi> | null = null;

/** Injecte embed.js (une seule fois) et renvoie l'API du namespace popup. */
export function loadCalPopup() {
  popupApi ??= getCalApi({ namespace: CAL_POPUP_NAMESPACE });
  return popupApi;
}

/**
 * getCalApi() se résout AVANT que embed.js soit exécuté (file d'attente).
 * embed.js pose window.Cal.version quand il est réellement chargé : on l'attend,
 * sinon (bloqueur, réseau) on rejette pour basculer sur le lien direct.
 */
export function waitForCalScript(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.Cal?.version) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("Cal.com embed indisponible"));
      setTimeout(tick, 100);
    };
    tick();
  });
}
