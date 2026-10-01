<script setup lang="ts">
const { query, updateQuery } = useCatalogQuery()
const { data, status, error, refresh } = useCatalogProducts(query)
const { data: categories } = useCategories()

const skeletonCount = PAGE_SIZE
const totalPages = computed(() => getTotalPages(data.value?.total ?? 0))

/** Message annoncé aux lecteurs d'écran à chaque nouveau résultat */
const resultMessage = computed(() => {
  if (status.value === 'pending') return 'Chargement des produits…'
  if (error.value) return 'Erreur de chargement des produits.'
  const total = data.value?.total ?? 0
  return total > 1 ? `${total} produits trouvés` : `${total} produit trouvé`
})

function onSearch(q: string): void {
  // replace : on ne crée pas une entrée d'historique par frappe
  updateQuery({ q }, { replace: true })
}

useSeoMeta({
  title: () => (query.value.page > 1 ? `Catalogue – page ${query.value.page}` : 'Catalogue'),
  description: 'Parcourez tout le catalogue ChampaShop : recherche, filtres par catégorie et prix.',
  ogTitle: 'Catalogue ChampaShop',
  ogDescription: 'Parcourez tout le catalogue ChampaShop.',
})
</script>

<template>
  <section>
    <h1>Catalogue</h1>

    <CatalogFilters
      :query="query"
      :categories="categories"
      @update="updateQuery"
      @search="onSearch"
    />

    <p class="result-count" role="status">{{ resultMessage }}</p>

    <ul v-if="status === 'pending'" class="grid" aria-busy="true">
      <li v-for="n in skeletonCount" :key="n"><ProductCardSkeleton /></li>
    </ul>

    <div v-else-if="error" class="feedback" role="alert">
      <p>Impossible de charger les produits. Vérifiez votre connexion puis réessayez.</p>
      <button type="button" class="btn" @click="refresh()">Réessayer</button>
    </div>

    <div v-else-if="!data || data.products.length === 0" class="feedback">
      <p>Aucun produit ne correspond à votre recherche.</p>
      <NuxtLink to="/produits" class="btn btn--ghost">Réinitialiser les filtres</NuxtLink>
    </div>

    <template v-else>
      <ul class="grid">
        <li v-for="product in data.products" :key="product.id">
          <ProductCard :product="product" />
        </li>
      </ul>
      <CatalogPagination :query="query" :total-pages="totalPages" />
    </template>
  </section>
</template>

<style scoped>
h1 {
  margin-top: 0;
}

.result-count {
  color: var(--color-muted);
  margin: 0 0 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feedback {
  padding: 3rem 1rem;
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
</style>
