import type { CatalogQuery, SortField, SortOrder } from '../types/catalog'

/** Nombre de produits par page */
export const PAGE_SIZE = 12

const SORT_FIELDS: readonly SortField[] = ['price', 'rating', 'title']
const MAX_SEARCH_LENGTH = 100
const CATEGORY_SLUG = /^[a-z0-9-]+$/

/** Récupère la première valeur texte d'un paramètre d'URL (?a=1&a=2 -> "1") */
function firstString(value: unknown): string {
  const first: unknown = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first.trim() : ''
}

function parsePage(value: unknown): number {
  const raw = firstString(value)
  if (!/^\d+$/.test(raw)) return 1
  const page = Number(raw)
  return page >= 1 ? page : 1
}

function parsePrice(value: unknown): number | null {
  const raw = firstString(value).replace(',', '.')
  if (raw === '') return null
  const price = Number(raw)
  return Number.isFinite(price) && price >= 0 ? price : null
}

function isSortField(value: string): value is SortField {
  return (SORT_FIELDS as readonly string[]).includes(value)
}

function parseOrder(value: unknown): SortOrder {
  return firstString(value) === 'desc' ? 'desc' : 'asc'
}

/**
 * Transforme les paramètres d'URL (non fiables) en un état de catalogue valide.
 * Toute valeur invalide est remplacée par la valeur par défaut.
 */
export function parseCatalogQuery(raw: Record<string, unknown>): CatalogQuery {
  const sortBy = firstString(raw.sortBy)
  const category = firstString(raw.category)
  let minPrice = parsePrice(raw.minPrice)
  let maxPrice = parsePrice(raw.maxPrice)

  // min > max : l'utilisateur a inversé les champs, on les remet dans l'ordre
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }

  return {
    page: parsePage(raw.page),
    q: firstString(raw.q).slice(0, MAX_SEARCH_LENGTH),
    category: CATEGORY_SLUG.test(category) ? category : '',
    sortBy: isSortField(sortBy) ? sortBy : null,
    order: parseOrder(raw.order),
    minPrice,
    maxPrice,
  }
}

/**
 * Inverse de parseCatalogQuery : produit les paramètres d'URL.
 * Les valeurs par défaut sont omises pour garder des URL courtes et uniques.
 */
export function toRouteQuery(query: CatalogQuery): Record<string, string> {
  const result: Record<string, string> = {}
  if (query.q) result.q = query.q
  if (query.category) result.category = query.category
  if (query.sortBy) {
    result.sortBy = query.sortBy
    result.order = query.order
  }
  if (query.minPrice !== null) result.minPrice = String(query.minPrice)
  if (query.maxPrice !== null) result.maxPrice = String(query.maxPrice)
  if (query.page > 1) result.page = String(query.page)
  return result
}
