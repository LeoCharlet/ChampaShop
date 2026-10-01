<script setup lang="ts">
import type { CatalogQuery } from '~/types/catalog'

const props = defineProps<{
  query: CatalogQuery
  totalPages: number
}>()

const items = computed(() => getPageItems(props.query.page, props.totalPages))

/** Lien vers une page : on garde tous les filtres, seule la page change */
function pageLink(page: number): { query: Record<string, string> } {
  return { query: toRouteQuery({ ...props.query, page }) }
}
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Pagination" class="pagination">
    <NuxtLink v-if="query.page > 1" :to="pageLink(query.page - 1)" class="page-link" rel="prev">
      ← <span class="sr-only">Page </span>précédente
    </NuxtLink>

    <ol class="pages">
      <li v-for="(item, index) in items" :key="`${item}-${index}`">
        <span v-if="item === 'ellipsis'" class="ellipsis" aria-hidden="true">…</span>
        <span v-else-if="item === query.page" class="page-link is-current" aria-current="page">
          <span class="sr-only">Page </span>{{ item }}
        </span>
        <NuxtLink v-else :to="pageLink(item)" class="page-link">
          <span class="sr-only">Page </span>{{ item }}
        </NuxtLink>
      </li>
    </ol>

    <NuxtLink
      v-if="query.page < totalPages"
      :to="pageLink(query.page + 1)"
      class="page-link"
      rel="next"
    >
      <span class="sr-only">Page </span>suivante →
    </NuxtLink>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pages {
  display: flex;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.page-link {
  display: inline-block;
  min-width: 2.5rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  text-align: center;
  text-decoration: none;
}

.page-link.is-current {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
  font-weight: 700;
}

.ellipsis {
  display: inline-block;
  padding: 0.45rem 0.25rem;
  color: var(--color-muted);
}
</style>
