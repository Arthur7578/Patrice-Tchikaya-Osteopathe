import "server-only";
import { mkdirSync } from "node:fs";
import { open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Dossier des traductions sur disque. Au build : `.next/cache/translations`, que Vercel conserve d'un build à
 * l'autre (cache de build) ; à l'exécution, où le code est en lecture seule : le dossier temporaire de l'instance.
 */
export function translationCacheDir(): string {
  for (const dir of [process.env.TRANSLATION_CACHE_DIR, join(process.cwd(), ".next/cache/translations"), join(tmpdir(), "translations")]) {
    if (!dir) continue;
    try {
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // lecture seule : dossier suivant
    }
  }
  return tmpdir();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Valeur calculée une seule fois pour une clé, même par plusieurs processus en même temps (le build de Next répartit
 * les pages sur plusieurs processus : sans ce verrou, chacun appelait l'API pour les mêmes textes). Le premier pose un
 * verrou (fichier créé en exclusif), les autres attendent le résultat. Verrou de plus de `staleMs` (processus
 * arrêté) : ignoré. Une erreur n'est jamais écrite : l'appel suivant réessaie.
 */
export async function sharedOnDisk<T>(
  key: string,
  compute: () => Promise<T>,
  { dir = translationCacheDir(), staleMs = 10 * 60_000, pollMs = 500 } = {},
): Promise<T> {
  const file = join(dir, `${key}.json`);
  const lock = `${file}.lock`;
  for (;;) {
    const cached = await readJson<T>(file);
    if (cached !== null) return cached;
    try {
      const handle = await open(lock, "wx");
      await handle.close();
      break;
    } catch {
      const age = await stat(lock).then((s) => Date.now() - s.mtimeMs, () => 0);
      if (age > staleMs) await rm(lock, { force: true });
      else await sleep(pollMs);
    }
  }
  try {
    // Un autre processus a pu finir entre la lecture et la prise du verrou.
    const cached = await readJson<T>(file);
    if (cached !== null) return cached;
    const value = await compute();
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(value));
    await rename(tmp, file);
    return value;
  } finally {
    await rm(lock, { force: true });
  }
}
