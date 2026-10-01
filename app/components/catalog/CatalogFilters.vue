<script setup lang="ts">
import type { Category } from '~/types/dummyjson'
import type { CatalogQuery, SortField, SortOrder } from '~/types/catalog'

const props = defineProps<{
  query: CatalogQuery
  categories: Category[]
}>()

const emit = defineEmits<{
  /** Changement d'un ou plusieurs filtres */
  update: [patch: Partial<CatalogQuery>]
  /** Nouvelle recherche (déjà "debouncée") */
  search: [q: string]
}>()

const SEARCH_DEBOUNCE_MS = 300

const sortOptions: { value: SortField | ''; label: string }[] = [
  { value: '', label: 'Pertinence' },
  { value: 'price', label: 'Prix' },
  { value: 'rating', label: 'Note' },
  { value: 'title', label: 'Nom' },
]

// --- Recherche avec debounce de 300 ms ---
const search = ref(props.query.q)
let lastEmittedSearch = props.query.q

const emitSearch = debounce((value: string) => {
  lastEmittedSearch = value
  emit('search', value)
}, SEARCH_DEBOUNCE_MS)

watch(search, (value) => {
  const term = value.trim()
  if (term === lastEmittedSearch) emitSearch.cancel()
  else emitSearch(term)
})

// L'URL a changé sans nous (bouton retour, lien partagé) : on resynchronise le champ
watch(
  () => props.query.q,
  (q) => {
    if (q === lastEmittedSearch) return
    emitSearch.cancel()
    lastEmittedSearch = q
    search.value = q
  },
)

onBeforeUnmount(() => emitSearch.cancel())

// --- Filtre prix (appliqué à la validation du formulaire) ---
const minPrice = ref<string | number>(props.query.minPrice ?? '')
const maxPrice = ref<string | number>(props.query.maxPrice ?? '')

watch(
  () => [props.query.minPrice, props.query.maxPrice] as const,
  ([min, max]) => {
    minPrice.value = min ?? ''
    maxPrice.value = max ?? ''
  },
)

function toPrice(value: string | number): number | null {
  if (value === '') return null
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : null
}

// --- Gestionnaires ---
function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function onCategoryChange(event: Event): void {
  emit('update', { category: selectValue(event) })
}

function onSortChange(event: Event): void {
  const value = selectValue(event)
  const sortBy: SortField | null =
    value === 'price' || value === 'rating' || value === 'title' ? value : null
  emit('update', { sortBy })
}

function onOrderChange(event: Event): void {
  const order: SortOrder = selectValue(event) === 'desc' ? 'desc' : 'asc'
  emit('update', { order })
}

/** Validation du formulaire (bouton "Appliquer" ou touche Entrée) */
function onSubmit(): void {
  emitSearch.cancel()
  lastEmittedSearch = search.value.trim()
  emit('update', {
    q: lastEmittedSearch,
    minPrice: toPrice(minPrice.value),
    maxPrice: toPrice(maxPrice.value),
  })
}
</script>

<template>
  <!-- Vrai formulaire GET : fonctionne aussi sans JavaScript -->
  <form
    class="filters"
    method="get"
    action="/produits"
    role="search"
    aria-label="Filtrer les produits"
    @submit.prevent="onSubmit"
  >
    <div class="field field--search">
      <label for="filter-q">Rechercher</label>
      <input
        id="filter-q"
        v-model="search"
        type="search"
        name="q"
        placeholder="Ex. : mascara, iPhone…"
        autocomplete="off"
      />
    </div>

    <div class="field">
      <label for="filter-category">Catégorie</label>
      <select id="filter-category" name="category" @change="onCategoryChange">
        <option value="" :selected="query.category === ''">Toutes</option>
        <option
          v-for="category in categories"
          :key="category.slug"
          :value="category.slug"
          :selected="category.slug === query.category"
        >
          {{ category.name }}
        </option>
      </select>
    </div>

    <div class="field">
      <label for="filter-sort">Trier par</label>
      <select id="filter-sort" name="sortBy" @change="onSortChange">
        <option
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
          :selected="option.value === (query.sortBy ?? '')"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="field">
      <label for="filter-order">Ordre</label>
      <select id="filter-order" name="order" @change="onOrderChange">
        <option value="asc" :selected="query.order === 'asc'">Croissant</option>
        <option value="desc" :selected="query.order === 'desc'">Décroissant</option>
      </select>
    </div>

    <fieldset class="field field--price">
      <legend>Prix (€)</legend>
      <label for="filter-min" class="sr-only">Prix minimum</label>
      <input
        id="filter-min"
        v-model="minPrice"
        type="number"
        name="minPrice"
        min="0"
        step="0.01"
        placeholder="Min"
        inputmode="decimal"
      />
      <span aria-hidden="true">–</span>
      <label for="filter-max" class="sr-only">Prix maximum</label>
      <input
        id="filter-max"
        v-model="maxPrice"
        type="number"
        name="maxPrice"
        min="0"
        step="0.01"
        placeholder="Max"
        inputmode="decimal"
      />
    </fieldset>

    <div class="actions">
      <button type="submit" class="btn">Appliquer</button>
      <NuxtLink to="/produits" class="btn btn--ghost">Réinitialiser</NuxtLink>
    </div>
  </form>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field--search {
  flex: 1 1 220px;
}

.field label,
.field legend {
  font-size: 0.9rem;
  font-weight: 600;
}

.field--price {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.field--price legend {
  width: 100%;
  padding: 0;
  margin-bottom: 0.25rem;
}

.field--price input {
  width: 6rem;
}

input,
select {
  padding: 0.55rem 0.7rem;
  border: 1px solid #b9b0a2;
  border-radius: var(--radius);
  background: #fff;
  font: inherit;
}

.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
