import { PHASE_PRODUCTION_BUILD } from "next/constants";

/** Build en cours (`next build`) : rien n'y est purgé, un résultat lu peut servir jusqu'à la fin du processus. */
export const isBuild = () => process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

/**
 * Un seul appel en cours par clé : les appels simultanés reçoivent la même promesse. `unstable_cache` ne le fait pas
 * (sur un cache vide, chaque page rendue en parallèle exécute la fonction : voir
 * `next/dist/server/web/spec-extension/unstable-cache.js`) ; au build, chaque page × langue relançait ainsi sa propre
 * liste Blob facturée (DECISIONS 22/11). `keep()` vrai quand l'appel réussit : le résultat est gardé pour la suite du
 * processus (au build, où rien n'est purgé) ; sinon la promesse est oubliée dès qu'elle est réglée. Une erreur n'est
 * jamais gardée : l'appel suivant réessaie.
 */
export function shareInFlight<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  { key = () => "", keep = () => false }: { key?: (...args: A) => string; keep?: () => boolean } = {},
): (...args: A) => Promise<T> {
  const pending = new Map<string, Promise<T>>();
  return (...args) => {
    const k = key(...args);
    let promise = pending.get(k);
    if (!promise) {
      promise = fn(...args);
      pending.set(k, promise);
      const current = promise;
      const forget = () => {
        if (pending.get(k) === current) pending.delete(k);
      };
      current.then(() => (keep() ? undefined : forget()), forget);
    }
    return promise;
  };
}
