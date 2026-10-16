<script setup lang="ts">
import type { CartProduct } from '~/types/cart'

const cart = useCartStore()
const productIds = computed(() => cart.items.map((item) => item.productId))
const { data: products, status, error, refresh } = useCartProducts(productIds)

/** Lignes affichables : article du panier + infos à jour du produit */
const lines = computed(() => {
  const byId = new Map(products.value.map((product) => [product.id, product]))
  return cart.items.flatMap((item) => {
    const product = byId.get(item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  })
})

const summary = computed(() => computeCart(toCartLines(cart.items, products.value), cart.promoCode))

/** Message par ligne (ex. stock insuffisant) */
const lineMessages = ref<Record<number, string>>({})

function updateQuantity(product: CartProduct, quantity: number): void {
  const message = cart.setQuantity(product.id, quantity, product.stock)
  lineMessages.value = { ...lineMessages.value, [product.id]: message ?? '' }
}

function removeLine(product: CartProduct): void {
  cart.remove(product.id)
}

// Si le stock a baissé depuis l'ajout, on ramène la quantité au stock disponible
watch(
  products,
  (loaded) => {
    for (const product of loaded) {
      const item = cart.items.find((cartItem) => cartItem.productId === product.id)
      if (item && item.quantity > product.stock) updateQuantity(product, item.quantity)
    }
  },
  { immediate: true },
)

useSeoMeta({
  title: 'Panier',
  description: 'Votre panier ChampaShop.',
  robots: 'noindex',
})
</script>

<template>
  <section>
    <h1>Mon panier</h1>

    <div v-if="cart.items.length === 0" class="feedback">
      <p>Votre panier est vide.</p>
      <NuxtLink to="/produits" class="btn">Découvrir le catalogue</NuxtLink>
    </div>

    <div v-else-if="error" class="feedback" role="alert">
      <p>Impossible de charger votre panier. Vérifiez votre connexion puis réessayez.</p>
      <button type="button" class="btn" @click="refresh()">Réessayer</button>
    </div>

    <p v-else-if="status === 'pending' && lines.length === 0" class="feedback" role="status">
      Chargement du panier…
    </p>

    <div v-else class="cart-layout">
      <ul class="lines" aria-label="Articles du panier">
        <CartLineItem
          v-for="line in lines"
          :key="line.product.id"
          :product="line.product"
          :quantity="line.quantity"
          :message="lineMessages[line.product.id] || null"
          @update:quantity="updateQuantity(line.product, $event)"
          @remove="removeLine(line.product)"
        />
      </ul>

      <CartSummaryPanel
        :summary="summary"
        :promo-code="cart.promoCode"
        @apply-code="cart.applyPromoCode"
        @remove-code="cart.removePromoCode"
      />
    </div>
  </section>
</template>

<style scoped>
h1 {
  margin-top: 0;
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
  gap: 1.5rem;
}

.lines {
  display: grid;
  gap: 1rem;
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

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
}
</style>
