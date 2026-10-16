<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()

const username = ref('')
const password = ref('')
/** Session courte pour tester le rafraîchissement du token */
const shortSession = ref(false)
const errorMessage = ref<string | null>(null)
const submitting = ref(false)

// Déjà connecté : inutile d'afficher le formulaire
if (auth.isLoggedIn) {
  await navigateTo(safeRedirect(route.query.redirect))
}

async function onSubmit(): Promise<void> {
  errorMessage.value = null
  submitting.value = true
  try {
    await auth.login(username.value.trim(), password.value, shortSession.value ? 1 : undefined)
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    errorMessage.value =
      status === 400 || status === 401
        ? 'Identifiant ou mot de passe incorrect.'
        : 'Connexion impossible pour le moment. Réessayez plus tard.'
  } finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: 'Connexion',
  description: 'Connectez-vous à votre compte ChampaShop.',
  robots: 'noindex',
})
</script>

<template>
  <section class="login">
    <h1>Connexion</h1>

    <p v-if="route.query.redirect" class="notice">Connectez-vous pour accéder à cette page.</p>

    <form class="form" novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="username">Identifiant</label>
        <input
          id="username"
          v-model="username"
          type="text"
          name="username"
          autocomplete="username"
          required
        />
      </div>

      <div class="field">
        <label for="password">Mot de passe</label>
        <input
          id="password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </div>

      <label class="checkbox">
        <input v-model="shortSession" type="checkbox" />
        Session de test d’1 minute (pour tester le rafraîchissement du token)
      </label>

      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

      <button type="submit" class="btn" :disabled="submitting">
        {{ submitting ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>

    <p class="demo">Compte de démonstration : <code>emilys</code> / <code>emilyspass</code></p>
  </section>
</template>

<style scoped>
.login {
  max-width: 420px;
  margin: 0 auto;
}

.notice {
  padding: 0.75rem 1rem;
  background: #fdf3e7;
  border-radius: var(--radius);
}

.form {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.field {
  display: grid;
  gap: 0.3rem;
}

.field label {
  font-weight: 600;
}

.field input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #b9b0a2;
  border-radius: var(--radius);
  font: inherit;
}

.checkbox {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.9rem;
}

.error {
  margin: 0;
  color: var(--color-danger);
  font-weight: 600;
}

.demo {
  color: var(--color-muted);
  text-align: center;
}
</style>
