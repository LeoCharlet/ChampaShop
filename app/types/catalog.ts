import type { ProductSummary } from './dummyjson'

export type SortField = 'price' | 'rating' | 'title'
export type SortOrder = 'asc' | 'desc'

/** État complet du catalogue, lu depuis l'URL (source de vérité) */
export interface CatalogQuery {
  page: number
  q: string
  category: string
  sortBy: SortField | null
  order: SortOrder
  minPrice: number | null
  maxPrice: number | null
}

/** Une page de résultats prête à afficher */
export interface CatalogPage {
  products: ProductSummary[]
  total: number
}

/** Élément de la pagination : un numéro de page ou une ellipse "…" */
export type PageItem = number | 'ellipsis'
