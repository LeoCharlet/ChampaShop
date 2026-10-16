import type { User } from '../types/dummyjson'

/**
 * "Single-flight" : si plusieurs appels arrivent pendant qu'une exécution est en
 * cours, ils reçoivent TOUS la même promesse au lieu de relancer `fn`.
 * Utilisé pour le rafraîchissement du token : 3 requêtes reçoivent une 401 en même
 * temps -> un seul POST /auth/refresh, puis les 3 requêtes sont rejouées.
 */
export function createSingleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null

  return () => {
    if (inFlight) return inFlight
    inFlight = fn().finally(() => {
      // Une fois terminée (succès ou échec), le prochain appel relancera `fn`
      inFlight = null
    })
    return inFlight
  }
}

/** Vrai si l'erreur est une réponse HTTP 401 (token expiré ou invalide) */
export function isUnauthorized(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { statusCode, status } = error as { statusCode?: unknown; status?: unknown }
  return statusCode === 401 || status === 401
}

/**
 * Sécurise le paramètre ?redirect= de la page de connexion :
 * seuls les chemins internes sont acceptés ("/compte"), jamais une URL externe
 * ("https://pirate.com" ou "//pirate.com"), pour éviter une "open redirect".
 */
export function safeRedirect(raw: unknown, fallback = '/compte'): string {
  const value: unknown = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback
  }
  return value
}

/**
 * Ne garde que les champs utiles de l'utilisateur. GET /auth/me renvoie beaucoup
 * plus (adresse, banque…) : inutile de l'envoyer dans le HTML de chaque page.
 */
export function pickUser(raw: User): User {
  const { id, username, email, firstName, lastName, gender, image } = raw
  return { id, username, email, firstName, lastName, gender, image }
}
