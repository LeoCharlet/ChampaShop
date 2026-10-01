import { describe, expect, it } from 'vitest'
import { parseCatalogQuery, toRouteQuery } from '../../app/utils/catalog-query'

describe('parseCatalogQuery', () => {
  it('retourne les valeurs par défaut pour une URL vide', () => {
    expect(parseCatalogQuery({})).toEqual({
      page: 1,
      q: '',
      category: '',
      sortBy: null,
      order: 'asc',
      minPrice: null,
      maxPrice: null,
    })
  })

  it('lit tous les paramètres valides', () => {
    const query = parseCatalogQuery({
      page: '3',
      q: ' phone ',
      category: 'smartphones',
      sortBy: 'price',
      order: 'desc',
      minPrice: '10',
      maxPrice: '99,5',
    })
    expect(query).toEqual({
      page: 3,
      q: 'phone',
      category: 'smartphones',
      sortBy: 'price',
      order: 'desc',
      minPrice: 10,
      maxPrice: 99.5,
    })
  })

  it('ignore les valeurs invalides', () => {
    const query = parseCatalogQuery({
      page: '-2',
      category: '../admin',
      sortBy: 'stock',
      order: 'random',
      minPrice: 'abc',
      maxPrice: '-5',
    })
    expect(query.page).toBe(1)
    expect(query.category).toBe('')
    expect(query.sortBy).toBeNull()
    expect(query.order).toBe('asc')
    expect(query.minPrice).toBeNull()
    expect(query.maxPrice).toBeNull()
  })

  it('refuse une page non entière', () => {
    expect(parseCatalogQuery({ page: '2abc' }).page).toBe(1)
    expect(parseCatalogQuery({ page: '0' }).page).toBe(1)
  })

  it('prend la première valeur si un paramètre est répété', () => {
    expect(parseCatalogQuery({ q: ['a', 'b'] }).q).toBe('a')
  })

  it('remet min et max dans le bon ordre', () => {
    const query = parseCatalogQuery({ minPrice: '100', maxPrice: '20' })
    expect(query.minPrice).toBe(20)
    expect(query.maxPrice).toBe(100)
  })

  it('tronque une recherche trop longue', () => {
    expect(parseCatalogQuery({ q: 'a'.repeat(300) }).q).toHaveLength(100)
  })
})

describe('toRouteQuery', () => {
  it("omet les valeurs par défaut pour garder l'URL courte", () => {
    expect(toRouteQuery(parseCatalogQuery({}))).toEqual({})
  })

  it("n'écrit order que si un tri est choisi", () => {
    expect(toRouteQuery(parseCatalogQuery({ order: 'desc' }))).toEqual({})
    expect(toRouteQuery(parseCatalogQuery({ sortBy: 'rating', order: 'desc' }))).toEqual({
      sortBy: 'rating',
      order: 'desc',
    })
  })

  it('fait un aller-retour sans perte', () => {
    const raw = {
      q: 'phone',
      category: 'smartphones',
      sortBy: 'title',
      order: 'asc',
      minPrice: '0',
      maxPrice: '500',
      page: '2',
    }
    expect(toRouteQuery(parseCatalogQuery(raw))).toEqual(raw)
  })
})
