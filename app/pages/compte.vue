<script setup lang="ts">
import type { User } from '~/types/dummyjson'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const testResult = ref<string | null>(null)

async function onLogout(): Promise<void> {
  auth.logout()
  await navigateTo('/')
}

/**
 * Démonstration du single-flight : 3 requêtes authentifiées en parallèle.
 * Avec un token expiré (session de test d'1 minute), elles reçoivent toutes une
 * 401 mais un seul POST /auth/refresh part, puis les 3 sont rejouées.
 */
async function runParallelTest(): Promise<void> {
  const before = auth.refreshCount
  testResult.value = 'Requêtes en cours…'
  try {
    await Promise.all([
      auth.authFetch<User>('/auth/me'),
      auth.authFetch<User>('/auth/me'),
      auth.authFetch<User>('/auth/me'),
    ])
    const refreshes = auth.refreshCount - before
    testResult.value = `3 requêtes réussies, ${refreshes} rafraîchissement(s) du token.`
  } catch {
    testResult.value = 'Session expirée : veuillez vous reconnecter.'
  }
}

useSeoMeta({ title: 'Mon compte', robots: 'noindex' })
</script>

<template>
  <section v-if="auth.user" class="account">
    <h1>Mon compte</h1>

    <div class="profile">
      <img :src="auth.user.image" alt="" width="96" height="96" />
      <div>
        <p class="name">{{ auth.user.firstName }} {{ auth.user.lastName }}</p>
        <p>{{ auth.user.email }}</p>
        <p class="muted">Identifiant : {{ auth.user.username }}</p>
      </div>
    </div>

    <button type="button" class="btn" @click="onLogout">Se déconnecter</button>

    <details class="debug">
      <summary>Tester le rafraîchissement du token</summary>
      <p>
        Connectez-vous avec la « session de test d’1 minute », attendez une minute, puis lancez le
        test : un seul rafraîchissement doit avoir lieu.
      </p>
      <button type="button" class="btn btn--ghost" @click="runParallelTest">
        Lancer 3 requêtes en parallèle
      </button>
      <p v-if="testResult" role="status">{{ testResult }}</p>
    </details>
  </section>
</template>

<style scoped>
.account h1 {
  margin-top: 0;
}

.profile {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.profile img {
  border-radius: 50%;
  background: #f1ede6;
}

.profile p {
  margin: 0.15rem 0;
}

.name {
  font-size: 1.2rem;
  font-weight: 700;
}

.muted {
  color: var(--color-muted);
}

.debug {
  margin-top: 2rem;
  color: var(--color-muted);
}

.debug summary {
  cursor: pointer;
  font-weight: 600;
}
</style>
