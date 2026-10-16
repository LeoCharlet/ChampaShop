import type { AsyncData, NuxtError } from '#app'
import type { ComputedRef } from 'vue'
import type { Category, ProductSummary, ProductsResponse } from '~/types/dummyjson'
import type { CatalogPage, CatalogQuery } from '~/types/catalog'

interface CatalogQueryState {
  query: ComputedRef<CatalogQuery>
  updateQuery: (patch: Partial<CatalogQuery>, options?: { replace?: boolean }) => Promise<void>
}

/**
 * L'URL est la source de vérité : l'état du catalogue est TOUJOURS calculé
 * depuis route.query, et on le modifie en changeant l'URL.
 */
export function useCatalogQuery(): CatalogQueryState {
  const route = useRoute()
  const query = computed(() => parseCatalogQuery(route.query))

  async function updateQuery(
    patch: Partial<CatalogQuery>,
    options: { replace?: boolean } = {},
  ): Promise<void> {
    // Tout changement de filtre ramène à la page 1, sauf si on change de page
    const next: CatalogQuery = { ...query.value, page: 1, ...patch }
    await navigateTo({ path: route.path, query: toRouteQuery(next) }, { replace: options.replace })
  }

  return { query, updateQuery }
}

/**
 * Charge la page de produits correspondant à la query (rendu côté serveur).
 *
 * Anti "réponse obsolète" : la clé change avec la query. Chaque recherche a donc
 * son propre emplacement de données, et la requête précédente est annulée via
 * le signal (AbortController). Une ancienne réponse ne peut pas écraser la nouvelle.
 */
export function useCatalogProducts(
  query: ComputedRef<CatalogQuery>,
): AsyncData<CatalogPage | undefined, NuxtError | undefined> {
  return useAsyncData(
    () => `catalog:${JSON.stringify(toRouteQuery(query.value))}`,
    async (_nuxtApp, { signal }) => {
      const currentQuery = query.value
      const response = await $fetch<ProductsResponse<ProductSummary>>(
        buildCatalogUrl(currentQuery),
        { signal },
      )
      return toCatalogPage(response, currentQuery)
    },
  )
}

/** Liste des catégories, pour le filtre */
export function useCategories(): AsyncData<Category[], NuxtError | undefined> {
  return useAsyncData(
    'categories',
    (_nuxtApp, { signal }) => $fetch<Category[]>(`${API_BASE}/products/categories`, { signal }),
    { default: () => [] },
  )
}
