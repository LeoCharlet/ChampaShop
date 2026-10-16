/**
 * Côté serveur, au premier chargement : si des tokens sont présents dans les
 * cookies, on charge l'utilisateur (GET /auth/me) AVANT le rendu.
 * La page arrive donc déjà dans l'état connecté : pas de "flash" déconnecté.
 */
export default defineNuxtPlugin(async () => {
  await useAuthStore().fetchUser()
})
