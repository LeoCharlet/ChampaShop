/**
 * Middleware de route "auth" : à déclarer dans les pages protégées avec
 * definePageMeta({ middleware: 'auth' }).
 * Redirige vers /connexion?redirect=<page demandée> si personne n'est connecté.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }
})
