<script setup lang="ts">
useSeoMeta({
  title: 'Accueil',
  description: 'ChampaShop, la boutique en ligne : beauté, maison, high-tech et épicerie.',
  ogTitle: 'ChampaShop',
  ogDescription: 'La boutique en ligne : beauté, maison, high-tech et épicerie.',
})
</script>

<template>
  <section class="hero">
    <h1>Bienvenue sur ChampaShop</h1>
    <p>Beauté, maison, high-tech, épicerie : découvrez tout notre catalogue.</p>
    <NuxtLink to="/produits" class="btn">Voir le catalogue</NuxtLink>
  </section>
</template>

<style scoped>
.hero {
  padding: 4rem 0;
  text-align: center;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  margin: 0 0 1rem;
}

.hero p {
  color: var(--color-muted);
  margin-bottom: 2rem;
}
</style>
