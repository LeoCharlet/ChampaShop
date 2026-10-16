<script setup lang="ts">
const auth = useAuthStore()

async function onLogout(): Promise<void> {
  auth.logout()
  await navigateTo('/')
}
</script>

<template>
  <div class="auth-menu">
    <template v-if="auth.user">
      <NuxtLink to="/compte">Mon compte ({{ auth.user.firstName }})</NuxtLink>
      <button type="button" class="logout" @click="onLogout">Déconnexion</button>
    </template>
    <NuxtLink v-else to="/connexion">Connexion</NuxtLink>
  </div>
</template>

<style scoped>
.auth-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
}

.auth-menu a {
  text-decoration: none;
}

.logout {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
