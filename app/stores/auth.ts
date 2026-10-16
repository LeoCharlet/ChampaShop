import { defineStore } from 'pinia'
import type { AuthTokens, LoginResponse, User } from '~/types/dummyjson'

/** Durée de vie demandée pour l'access token (en minutes) */
const DEFAULT_TOKEN_MINUTES = 30
const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7

interface AuthRequestOptions {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
}

/**
 * Store d'authentification DummyJSON.
 *
 * - Les tokens sont dans des cookies (useCookie) : lisibles côté serveur, donc
 *   l'utilisateur est chargé pendant le rendu serveur (plugin auth.server.ts),
 *   sans "flash" de l'état déconnecté au rechargement.
 * - Les tokens ne sont PAS renvoyés par le store : ils ne finissent donc pas
 *   dans le HTML (payload Pinia), seul `user` y est.
 */
export const useAuthStore = defineStore('auth', () => {
  const cookieOptions = { sameSite: 'lax' as const, path: '/', maxAge: SEVEN_DAYS_IN_SECONDS }
  const accessToken = useCookie<string | null>('champa_access', {
    ...cookieOptions,
    default: () => null,
  })
  const refreshToken = useCookie<string | null>('champa_refresh', {
    ...cookieOptions,
    default: () => null,
  })

  const user = ref<User | null>(null)
  const isLoggedIn = computed<boolean>(() => user.value !== null)
  /** Nombre de rafraîchissements effectués (pour démontrer le single-flight) */
  const refreshCount = ref(0)
  /** Durée de vie choisie à la connexion, réutilisée lors des refresh */
  const tokenMinutes = ref(DEFAULT_TOKEN_MINUTES)

  function setTokens(tokens: AuthTokens): void {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
  }

  function clearSession(): void {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  /**
   * Rafraîchit les tokens. Single-flight : plusieurs appels simultanés partagent
   * le même POST /auth/refresh. Défini ici (et non au niveau du module) pour qu'il
   * y en ait un par utilisateur : côté serveur, un module est partagé entre tous
   * les visiteurs.
   */
  const refreshSession = createSingleFlight(async (): Promise<void> => {
    if (!refreshToken.value) throw new Error('Aucun refresh token')
    try {
      const tokens = await $fetch<AuthTokens>(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        body: { refreshToken: refreshToken.value, expiresInMins: tokenMinutes.value },
      })
      refreshCount.value++
      setTokens(tokens)
    } catch (error) {
      clearSession() // refresh token expiré : on déconnecte
      throw error
    }
  })

  /**
   * Requête authentifiée. En cas de 401, rafraîchit le token (une seule fois,
   * même si plusieurs requêtes échouent en même temps) puis rejoue la requête.
   */
  async function authFetch<T>(path: string, options: AuthRequestOptions = {}): Promise<T> {
    const send = (): Promise<T> =>
      $fetch<T>(`${API_BASE}${path}`, {
        method: options.method ?? 'GET',
        body: options.body,
        // Lu à chaque envoi : le rejeu utilise donc le NOUVEAU token
        headers: accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {},
      })

    try {
      return await send()
    } catch (error) {
      if (!isUnauthorized(error) || !refreshToken.value) throw error
      await refreshSession()
      return await send()
    }
  }

  /** POST /auth/login puis stockage des tokens dans les cookies */
  async function login(
    username: string,
    password: string,
    expiresInMins = DEFAULT_TOKEN_MINUTES,
  ): Promise<void> {
    tokenMinutes.value = expiresInMins
    const response = await $fetch<LoginResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { username, password, expiresInMins },
    })
    const { accessToken: access, refreshToken: refresh, ...profile } = response
    setTokens({ accessToken: access, refreshToken: refresh })
    user.value = pickUser(profile)
  }

  /** GET /auth/me : charge l'utilisateur si des tokens existent */
  async function fetchUser(): Promise<void> {
    if (!accessToken.value && !refreshToken.value) {
      user.value = null
      return
    }
    try {
      user.value = pickUser(await authFetch<User>('/auth/me'))
    } catch {
      clearSession()
    }
  }

  function logout(): void {
    clearSession()
  }

  return { user, isLoggedIn, refreshCount, login, fetchUser, logout, authFetch }
})
