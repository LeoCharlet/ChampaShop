<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => (isNotFound.value ? 'Page introuvable' : 'Erreur'),
  robots: 'noindex',
})

function backToCatalog(): void {
  clearError({ redirect: '/produits' })
}
</script>

<template>
  <NuxtLayout>
    <section class="error-page">
      <p class="code">{{ error.statusCode }}</p>
      <h1>{{ isNotFound ? 'Page introuvable' : 'Une erreur est survenue' }}</h1>
      <p>
        {{
          isNotFound
            ? 'Ce produit ou cette page n’existe pas (ou plus).'
            : 'Merci de réessayer dans quelques instants.'
        }}
      </p>
      <button type="button" class="btn" @click="backToCatalog">Retour au catalogue</button>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.error-page {
  padding: 4rem 0;
  text-align: center;
}

.code {
  margin: 0;
  font-size: 4rem;
  font-weight: 800;
  color: var(--color-primary, #6b1d38);
}
</style>
