<script setup lang="ts">
import type { CartProduct } from '~/types/cart'

const props = defineProps<{
  product: CartProduct
  quantity: number
  message: string | null
}>()

const emit = defineEmits<{
  'update:quantity': [quantity: number]
  remove: []
}>()

const lineTotal = computed(() => formatCents(toCents(props.product.price) * props.quantity))
const canIncrease = computed(() => props.quantity < props.product.stock)
const inputId = computed(() => `quantity-${props.product.id}`)

function onInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) emit('update:quantity', value)
}
</script>

<template>
  <li class="line">
    <img :src="product.thumbnail" alt="" width="96" height="96" class="line-image" />

    <div class="line-info">
      <NuxtLink :to="`/produits/${product.id}`" class="line-title">{{ product.title }}</NuxtLink>
      <p class="line-unit">{{ formatPrice(product.price) }} l’unité</p>
      <p v-if="message" class="line-message" role="alert">{{ message }}</p>
    </div>

    <div class="line-quantity">
      <label :for="inputId" class="sr-only">Quantité de {{ product.title }}</label>
      <button
        type="button"
        class="qty-btn"
        :aria-label="`Retirer un ${product.title}`"
        @click="emit('update:quantity', quantity - 1)"
      >
        −
      </button>
      <input
        :id="inputId"
        :value="quantity"
        type="number"
        min="1"
        :max="product.stock"
        inputmode="numeric"
        @change="onInput"
      />
      <button
        type="button"
        class="qty-btn"
        :aria-label="`Ajouter un ${product.title}`"
        :disabled="!canIncrease"
        @click="emit('update:quantity', quantity + 1)"
      >
        +
      </button>
    </div>

    <p class="line-total">{{ lineTotal }}</p>

    <button type="button" class="line-remove" @click="emit('remove')">
      Supprimer<span class="sr-only"> {{ product.title }} du panier</span>
    </button>
  </li>
</template>

<style scoped>
.line {
  display: grid;
  grid-template-columns: 96px 1fr auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.line-image {
  width: 96px;
  height: 96px;
  object-fit: contain;
  background: #f1ede6;
  border-radius: 8px;
}

.line-info p {
  margin: 0.2rem 0 0;
}

.line-title {
  font-weight: 700;
}

.line-unit {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.line-message {
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 600;
}

.line-quantity {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.line-quantity input {
  width: 3.5rem;
  padding: 0.4rem;
  text-align: center;
  border: 1px solid #b9b0a2;
  border-radius: 8px;
  font: inherit;
}

.qty-btn {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.line-total {
  min-width: 6rem;
  margin: 0;
  text-align: right;
  font-weight: 700;
}

.line-remove {
  border: 0;
  background: none;
  color: var(--color-danger);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

@media (max-width: 700px) {
  .line {
    grid-template-columns: 72px 1fr;
  }

  .line-image {
    width: 72px;
    height: 72px;
  }

  .line-total {
    text-align: left;
  }
}
</style>
