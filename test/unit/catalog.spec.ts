import { describe, expect, it } from 'vitest'
import type { ProductSummary } from '../../app/types/dummyjson'
import type { CatalogQuery } from '../../app/types/catalog'
import {
  applyLocalProcessing,
  buildCatalogUrl,
  getPageItems,
  getTotalPages,
  needsLocalProcessing,
  sortProducts,
  toCatalogPage,
} from '../../app/utils/catalog'

const BASE = 'https://api.test'

function makeQuery(patch: Partial<CatalogQuery> = {}): CatalogQuery {
  return {
    page: 1,
    q: '',
    category: '',
    sortBy: null,
    order: 'asc',
    minPrice: null,
    maxPrice: null,
    ...patch,
  }
}

function makeProduct(id: number, patch: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id,
    title: `Produit ${id}`,
    price: id * 10,
    discountPercentage: 0,
    rating: 4,
    thumbnail: '',
    category: 'beauty',
    ...patch,
  }
}

function params(url: string): URLSearchParams {
  return new URL(url).searchParams
}

describe('needsLocalProcessing', () => {
  it("laisse l'API paginer sans filtre prix", () => {
    expect(needsLocalProcessing(makeQuery())).toBe(false)
    expect(needsLocalProcessing(makeQuery({ q: 'a' }))).toBe(false)
    expect(needsLocalProcessing(makeQuery({ category: 'beauty' }))).toBe(false)
  })

  it('passe en mode local avec un filtre prix', () => {
    expect(needsLocalProcessing(makeQuery({ minPrice: 0 }))).toBe(true)
    expect(needsLocalProcessing(makeQuery({ maxPrice: 50 }))).toBe(true)
  })

  it('passe en mode local avec recherche + catégorie', () => {
    expect(needsLocalProcessing(makeQuery({ q: 'a', category: 'beauty' }))).toBe(true)
  })
})

describe('buildCatalogUrl', () => {
  it('liste paginée par défaut', () => {
    const url = buildCatalogUrl(makeQuery({ page: 3 }), BASE)
    expect(url.startsWith(`${BASE}/products?`)).toBe(true)
    expect(params(url).get('limit')).toBe('12')
    expect(params(url).get('skip')).toBe('24')
    expect(params(url).get('select')).toContain('discountPercentage')
    expect(params(url).has('sortBy')).toBe(false)
  })

  it('utilise /products/search pour une recherche', () => {
    const url = buildCatalogUrl(makeQuery({ q: 'phone', sortBy: 'price', order: 'desc' }), BASE)
    expect(url.startsWith(`${BASE}/products/search?`)).toBe(true)
    expect(params(url).get('q')).toBe('phone')
    expect(params(url).get('sortBy')).toBe('price')
    expect(params(url).get('order')).toBe('desc')
  })

  it('utilise /products/category/:slug pour une catégorie', () => {
    const url = buildCatalogUrl(makeQuery({ category: 'home-decoration' }), BASE)
    expect(url.startsWith(`${BASE}/products/category/home-decoration?`)).toBe(true)
  })

  it('récupère toute la liste en mode local (limit=0, sans skip ni tri)', () => {
    const url = buildCatalogUrl(makeQuery({ maxPrice: 20, sortBy: 'price', page: 2 }), BASE)
    expect(params(url).get('limit')).toBe('0')
    expect(params(url).has('skip')).toBe(false)
    expect(params(url).has('sortBy')).toBe(false)
  })

  it("utilise l'API DummyJSON par défaut", () => {
    expect(buildCatalogUrl(makeQuery())).toMatch(/^https:\/\/dummyjson\.com\/products\?/)
  })
})

describe('sortProducts', () => {
  const list = [
    makeProduct(1, { title: 'Banane', price: 5, rating: 3 }),
    makeProduct(2, { title: 'abricot', price: 2, rating: 5 }),
    makeProduct(3, { title: 'Cerise', price: 9, rating: 1 }),
  ]

  it('trie par prix croissant et décroissant', () => {
    expect(sortProducts(list, 'price', 'asc').map((p) => p.id)).toEqual([2, 1, 3])
    expect(sortProducts(list, 'price', 'desc').map((p) => p.id)).toEqual([3, 1, 2])
  })

  it('trie par note', () => {
    expect(sortProducts(list, 'rating', 'desc').map((p) => p.id)).toEqual([2, 1, 3])
  })

  it('trie par titre sans tenir compte de la casse', () => {
    expect(sortProducts(list, 'title', 'asc').map((p) => p.id)).toEqual([2, 1, 3])
  })

  it('ne modifie pas la liste d’origine', () => {
    sortProducts(list, 'price', 'desc')
    expect(list.map((p) => p.id)).toEqual([1, 2, 3])
  })
})

describe('applyLocalProcessing', () => {
  const products = Array.from({ length: 30 }, (_, i) =>
    makeProduct(i + 1, { category: i % 2 === 0 ? 'beauty' : 'groceries' }),
  )

  it('filtre par prix min et max (bornes incluses)', () => {
    const page = applyLocalProcessing(products, makeQuery({ minPrice: 50, maxPrice: 100 }))
    expect(page.products.map((p) => p.price)).toEqual([50, 60, 70, 80, 90, 100])
    expect(page.total).toBe(6)
  })

  it('filtre par catégorie (cas recherche + catégorie)', () => {
    const page = applyLocalProcessing(products, makeQuery({ q: 'x', category: 'groceries' }))
    expect(page.total).toBe(15)
    expect(page.products.every((p) => p.category === 'groceries')).toBe(true)
  })

  it('pagine par 12', () => {
    const query = makeQuery({ minPrice: 0 })
    expect(applyLocalProcessing(products, query).products).toHaveLength(12)
    expect(applyLocalProcessing(products, { ...query, page: 3 }).products).toHaveLength(6)
    expect(applyLocalProcessing(products, { ...query, page: 4 }).products).toHaveLength(0)
  })

  it('trie avant de paginer', () => {
    const page = applyLocalProcessing(
      products,
      makeQuery({ minPrice: 0, sortBy: 'price', order: 'desc' }),
    )
    expect(page.products[0]?.price).toBe(300)
  })
})

describe('toCatalogPage', () => {
  const response = { products: [makeProduct(1), makeProduct(2)], total: 194, skip: 0, limit: 12 }

  it("garde le total de l'API en mode API", () => {
    expect(toCatalogPage(response, makeQuery())).toEqual({
      products: response.products,
      total: 194,
    })
  })

  it('recalcule le total en mode local', () => {
    expect(toCatalogPage(response, makeQuery({ maxPrice: 10 })).total).toBe(1)
  })
})

describe('pagination', () => {
  it('calcule le nombre de pages (au moins 1)', () => {
    expect(getTotalPages(0)).toBe(1)
    expect(getTotalPages(12)).toBe(1)
    expect(getTotalPages(13)).toBe(2)
    expect(getTotalPages(194)).toBe(17)
  })

  it('affiche toutes les pages quand il y en a peu', () => {
    expect(getPageItems(1, 3)).toEqual([1, 2, 3])
  })

  it('ajoute des ellipses autour de la page courante', () => {
    expect(getPageItems(6, 10)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 10])
    expect(getPageItems(1, 10)).toEqual([1, 2, 'ellipsis', 10])
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis', 9, 10])
  })

  it('gère une seule page', () => {
    expect(getPageItems(1, 1)).toEqual([1])
  })
})
