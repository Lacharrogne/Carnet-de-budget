/**
 * Brouillons de formulaires : sauvegarde la saisie en cours dans le téléphone
 * pour ne rien perdre si l'app est rechargée (typiquement quand on la quitte
 * puis qu'on y revient sur mobile).
 *
 * Générique et réutilisable par n'importe quel formulaire (transaction,
 * objectif, dette…). Un horodatage borne la durée de vie du brouillon pour
 * éviter de restaurer une saisie trop ancienne.
 */

type StoredDraft<T> = {
  savedAt: number
  values: T
}

/** 12 h : au-delà, un brouillon non repris est considéré comme abandonné. */
const DEFAULT_MAX_AGE_MS = 12 * 60 * 60 * 1000

export function loadFormDraft<T>(
  key: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredDraft<T>
    if (!parsed || typeof parsed.savedAt !== 'number') return null

    if (Date.now() - parsed.savedAt > maxAgeMs) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.values
  } catch {
    return null
  }
}

export function saveFormDraft<T>(key: string, values: T): void {
  try {
    const payload: StoredDraft<T> = { savedAt: Date.now(), values }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function clearFormDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
