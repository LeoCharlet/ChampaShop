import type { AsyncData, NuxtError } from '#app'
import type { ComputedRef } from 'vue'
import type { CartProduct } from '~/types/cart'

const CART_PRODUCT_FIELDS = 'title,price,category,stock,thumbnail'

/**
 * Charge (côté serveur au premier rendu) les infos à jour des produits du panier.
 * On ne recharge que si un produit inconnu apparaît : changer une quantité ou
 * retirer une ligne ne relance pas d'appel réseau.
 */
export function useCartProducts(
  productIds: ComputedRef<number[]>,
): AsyncData<CartProduct[], NuxtError | undefined> {
  const asyncData = useAsyncData(
    'cart-products',
    async (_nuxtApp, { signal }) => {
      const results = await Promise.all(
        productIds.value.map((id) =>
          $fetch<CartProduct>(`${API_BASE}/products/${id}`, {
            query: { select: CART_PRODUCT_FIELDS },
            signal,
          }).catch((error: unknown) => {
            // Produit supprimé de l'API : on l'ignore au lieu de casser tout le panier
            if (error instanceof Error && 'statusCode' in error && error.statusCode === 404) {
              return null
            }
            throw error
          }),
        ),
      )
      return results.filter((product): product is CartProduct => product !== null)
    },
    { default: () => [] },
  )

  watch(productIds, (ids) => {
    const loaded = new Set(asyncData.data.value.map((product) => product.id))
    if (ids.some((id) => !loaded.has(id))) asyncData.refresh()
  })

  return asyncData
}
