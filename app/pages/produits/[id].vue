<script setup lang="ts">
const route = useRoute()
const productId = parseProductId(route.params.id)

// Identifiant invalide ("abc", "0"…) : vraie 404, sans appeler l'API
if (productId === null) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Produit introuvable',
    fatal: true,
  })
}

const { data: product, error } = await useProduct(productId)

// Produit inexistant (l'API répond 404) ou erreur réseau : vraie page d'erreur
if (error.value || !product.value) {
  const notFound = !error.value || error.value.statusCode === 404
  throw createError({
    statusCode: notFound ? 404 : 502,
    statusMessage: notFound ? 'Produit introuvable' : 'Impossible de charger le produit',
    fatal: true,
  })
}

// À partir d'ici, le produit existe forcément
const item = computed(() => product.value!)
const discount = computed(() => Math.round(item.value.discountPercentage))
const isOutOfStock = computed(() => item.value.stock <= 0)

useSeoMeta({
  title: () => item.value.title,
  description: () => item.value.description,
  ogTitle: () => item.value.title,
  ogDescription: () => item.value.description,
  ogImage: () => item.value.thumbnail,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <article class="product">
    <NuxtLink to="/produits" class="back">← Retour au catalogue</NuxtLink>

    <div class="product-layout">
      <ProductGallery :images="item.images" :title="item.title" />

      <div class="product-info">
        <p v-if="item.brand" class="brand">{{ item.brand }}</p>
        <h1>{{ item.title }}</h1>

        <p class="rating">
          <span class="sr-only">Note : </span>
          <span aria-hidden="true">★</span> {{ item.rating.toFixed(1) }}
          <span class="sr-only"> sur 5</span>
          <span class="muted">({{ item.reviews.length }} avis)</span>
        </p>

        <p class="price">
          {{ formatPrice(item.price) }}
          <span v-if="discount > 0" class="badge">
            <span class="sr-only">Remise : </span>-{{ discount }} %
          </span>
        </p>

        <ProductStock :stock="item.stock" />

        <!-- Le panier (F3) branchera l'ajout ici -->
        <button type="button" class="btn add-to-cart" :disabled="isOutOfStock">
          {{ isOutOfStock ? 'Indisponible' : 'Ajouter au panier' }}
        </button>

        <p class="description">{{ item.description }}</p>

        <dl class="details">
          <div>
            <dt>Garantie</dt>
            <dd>{{ item.warrantyInformation }}</dd>
          </div>
          <div>
            <dt>Livraison</dt>
            <dd>{{ item.shippingInformation }}</dd>
          </div>
          <div>
            <dt>Retours</dt>
            <dd>{{ item.returnPolicy }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <section v-if="item.reviews.length > 0" class="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Avis clients</h2>
      <ul>
        <li v-for="(review, index) in item.reviews" :key="index" class="review">
          <p class="review-head">
            <strong>{{ review.reviewerName }}</strong>
            <span>
              <span class="sr-only">Note : </span>
              <span aria-hidden="true">★</span> {{ review.rating }}
              <span class="sr-only"> sur 5</span>
            </span>
          </p>
          <p>{{ review.comment }}</p>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1.5rem;
}

.product-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
}

.product-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.9rem;
}

.product-info h1 {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.brand {
  margin: 0;
  color: var(--color-muted, #5c544a);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rating,
.price,
.description {
  margin: 0;
}

.muted {
  color: var(--color-muted, #5c544a);
}

.price {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.8rem;
  font-weight: 800;
}

.badge {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--color-danger, #a4161a);
  color: #fff;
  font-size: 0.9rem;
}

.add-to-cart {
  min-width: 14rem;
}

.details {
  display: grid;
  gap: 0.5rem;
  width: 100%;
  margin: 0;
  padding: 1rem;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3ddd2);
  border-radius: var(--radius, 10px);
}

.details div {
  display: flex;
  gap: 0.5rem;
}

.details dt {
  min-width: 6rem;
  font-weight: 700;
}

.details dd {
  margin: 0;
}

.reviews {
  margin-top: 3rem;
}

.reviews ul {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.review {
  padding: 1rem;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e3ddd2);
  border-radius: var(--radius, 10px);
}

.review p {
  margin: 0;
}

.review-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem !important;
}
</style>
