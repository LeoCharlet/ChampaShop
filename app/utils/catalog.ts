import type { ProductSummary, ProductsResponse } from '../types/dummyjson'
import type { CatalogPage, CatalogQuery, PageItem, SortField, SortOrder } from '../types/catalog'
import { API_BASE } from './api'
import { PAGE_SIZE } from './catalog-query'

/** Champs demandés à l'API (?select=) : uniquement ce qu'affiche une carte */
const SUMMARY_FIELDS = ['title', 'price', 'discountPercentage', 'rating', 'thumbnail', 'category']

/**
 * L'API ne sait pas filtrer par prix, ni combiner recherche + catégorie.
 * Dans ces cas on récupère toute la liste concernée (limit=0) et on filtre,
 * trie et pagine nous-mêmes. Sinon on laisse l'API paginer (12 produits par appel).
 */
export function needsLocalProcessing(query: CatalogQuery): boolean {
  const hasPriceFilter = query.minPrice !== null || query.maxPrice !== null
  const searchAndCategory = query.q !== '' && query.category !== ''
  return hasPriceFilter || searchAndCategory
}

/** Construit l'URL DummyJSON correspondant à l'état du catalogue */
export function buildCatalogUrl(query: CatalogQuery, base: string = API_BASE): string {
  const params = new URLSearchParams()
  let path = '/products'

  if (query.q) {
    path = '/products/search'
    params.set('q', query.q)
  } else if (query.category) {
    path = `/products/category/${encodeURIComponent(query.category)}`
  }

  if (needsLocalProcessing(query)) {
    params.set('limit', '0')
  } else {
    params.set('limit', String(PAGE_SIZE))
    params.set('skip', String((query.page - 1) * PAGE_SIZE))
    if (query.sortBy) {
      params.set('sortBy', query.sortBy)
      params.set('order', query.order)
    }
  }

  params.set('select', SUMMARY_FIELDS.join(','))
  return `${base}${path}?${params.toString()}`
}

/** Trie une copie de la liste (la liste d'origine n'est pas modifiée) */
export function sortProducts(
  products: readonly ProductSummary[],
  field: SortField,
  order: SortOrder,
): ProductSummary[] {
  const direction = order === 'asc' ? 1 : -1
  return [...products].sort((a, b) => {
    const diff = field === 'title' ? a.title.localeCompare(b.title, 'fr') : a[field] - b[field]
    return diff * direction
  })
}

/** Filtre, trie et pagine côté application (mode "local") */
export function applyLocalProcessing(
  products: readonly ProductSummary[],
  query: CatalogQuery,
): CatalogPage {
  const { category, minPrice, maxPrice } = query
  let list = products.filter(
    (product) =>
      (category === '' || product.category === category) &&
      (minPrice === null || product.price >= minPrice) &&
      (maxPrice === null || product.price <= maxPrice),
  )
  if (query.sortBy) list = sortProducts(list, query.sortBy, query.order)

  const start = (query.page - 1) * PAGE_SIZE
  return { products: list.slice(start, start + PAGE_SIZE), total: list.length }
}

/** Transforme la réponse de l'API en page affichable, selon le mode utilisé */
export function toCatalogPage(
  response: ProductsResponse<ProductSummary>,
  query: CatalogQuery,
): CatalogPage {
  if (needsLocalProcessing(query)) return applyLocalProcessing(response.products, query)
  return { products: response.products, total: response.total }
}

export function getTotalPages(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}

/**
 * Numéros de pages à afficher : la première, la dernière, la page courante
 * et ses voisines, avec "…" pour les trous. Ex. (6, 10) -> [1, …, 5, 6, 7, …, 10]
 */
export function getPageItems(current: number, totalPages: number): PageItem[] {
  const pages = new Set([1, totalPages, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const items: PageItem[] = []
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (previous !== undefined && page - previous > 1) items.push('ellipsis')
    items.push(page)
  })
  return items
}
