<script setup lang="ts">
const cart = useCartStore()
</script>

<template>
  <div class="layout">
    <a href="#contenu" class="skip-link">Aller au contenu</a>
    <header class="header">
      <div class="container header-inner">
        <NuxtLink to="/" class="logo">ChampaShop</NuxtLink>
        <nav aria-label="Navigation principale">
          <ul class="nav">
            <li><NuxtLink to="/produits">Catalogue</NuxtLink></li>
            <li>
              <NuxtLink to="/panier" class="cart-link">
                Panier
                <span class="cart-count" aria-hidden="true">{{ cart.count }}</span>
                <span class="sr-only"
                  >({{ cart.count }} article{{ cart.count > 1 ? 's' : '' }})</span
                >
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <AuthMenu />
      </div>
    </header>
    <main id="contenu" class="container main" tabindex="-1">
      <slot />
    </main>
    <footer class="footer">
      <div class="container">ChampaShop · boutique fictive · données DummyJSON</div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -3rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  border-radius: var(--radius);
  z-index: 10;
}

.skip-link:focus {
  top: 1rem;
}

.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  min-height: 4rem;
  padding-block: 0.75rem;
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav a {
  font-weight: 600;
  text-decoration: none;
}

.nav a.router-link-active {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.cart-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.cart-count {
  min-width: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: 0.85rem;
  text-align: center;
}

.main {
  flex: 1;
  padding-block: 2rem;
}

.main:focus {
  outline: none;
}

.footer {
  padding-block: 1.5rem;
  color: var(--color-muted);
  font-size: 0.9rem;
  border-top: 1px solid var(--color-border);
}
</style>
