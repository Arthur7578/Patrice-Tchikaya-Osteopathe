/**
 * Opérations Vercel Blob « avancées » (facturées : `list`, `put`) de ce processus, journalisées une à une : les logs
 * d'un build donnent leur nombre exact (le quota Hobby est de 2 000 par mois pour tout le compte, voir
 * docs/blob-usage.md). Chaque ligne porte le total du processus et son pid (le build de Next en lance plusieurs).
 */
let total = 0;

export function countBlobOp(op: "list" | "put", path: string, count = 1): void {
  if (count <= 0) return;
  total += count;
  console.info(`[blob] ${op} ${path}${count > 1 ? ` ×${count}` : ""} (total de ce processus : ${total}, pid ${process.pid})`);
}
