<script setup lang="ts">
import type { ProductSummary } from '~/types/dummyjson'

const props = defineProps<{ product: ProductSummary }>()

/** Badge "-X %" issu de discountPercentage (affichage uniquement, non appliqué au prix) */
const discount = computed(() => Math.round(props.product.discountPercentage))
const rating = computed(() => props.product.rating.toFixed(1))
</script>

<template>
  <article class="card">
    <NuxtLink :to="`/produits/${product.id}`" class="card-link">
      <div class="card-media">
        <img :src="product.thumbnail" alt="" width="300" height="300" loading="lazy" />
        <span v-if="discount > 0" class="badge">
          <span class="sr-only">Remise : </span>-{{ discount }} %
        </span>
      </div>
      <h2 class="card-title">{{ product.title }}</h2>
    </NuxtLink>
    <div class="card-footer">
      <p class="card-price">{{ formatPrice(product.price) }}</p>
      <p class="card-rating">
        <span class="sr-only">Note : </span>
        <span aria-hidden="true">★</span> {{ rating }}<span class="sr-only"> sur 5</span>
      </p>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.card-link {
  color: inherit;
  text-decoration: none;
}

/* Toute la carte est cliquable grâce au lien étendu */
.card-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.card:has(.card-link:focus-visible) {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}

.card-link:focus-visible {
  outline: none;
}

.card-media {
  position: relative;
  aspect-ratio: 1;
  background: #f1ede6;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
}

.card-title {
  margin: 0;
  padding: 0.75rem 1rem 0;
  font-size: 1rem;
  line-height: 1.3;
}

.card:hover .card-title {
  text-decoration: underline;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem 1rem;
}

.card-footer p {
  margin: 0;
}

.card-price {
  font-weight: 700;
  font-size: 1.1rem;
}

.card-rating {
  color: var(--color-muted);
}
</style>
