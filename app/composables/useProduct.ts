import type { AsyncData, NuxtError } from '#app'
import type { Product } from '~/types/dummyjson'

/** Charge un produit par son identifiant (rendu côté serveur) */
export function useProduct(id: number): AsyncData<Product | undefined, NuxtError | undefined> {
  return useAsyncData(`product:${id}`, (_nuxtApp, { signal }) =>
    $fetch<Product>(`${API_BASE}/products/${id}`, { signal }),
  )
}
