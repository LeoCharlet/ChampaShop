import { describe, expect, it } from 'vitest'
import type { CartItem, CartProduct } from '../../app/types/cart'
import {
  addToCart,
  cartCount,
  parseCartCookie,
  removeFromCart,
  serializeCart,
  setCartQuantity,
  toCartLines,
} from '../../app/utils/cart'

const items: CartItem[] = [
  { productId: 1, quantity: 2 },
  { productId: 2, quantity: 1 },
]

describe('cookie du panier', () => {
  it('fait un aller-retour sans perte', () => {
    expect(parseCartCookie(serializeCart(items))).toEqual(items)
  })

  it('reste compact : [id, quantité] par ligne', () => {
    expect(JSON.stringify(serializeCart(items))).toBe('[[1,2],[2,1]]')
  })

  it('ignore une valeur qui n’est pas un tableau', () => {
    expect(parseCartCookie('n’importe quoi')).toEqual([])
    expect(parseCartCookie(null)).toEqual([])
    expect(parseCartCookie({ 1: 2 })).toEqual([])
  })

  it('ignore les entrées invalides', () => {
    expect(
      parseCartCookie([[1, 2], 'x', [2, 0], [3, -1], [4, 1.5], ['5', 1], [6], [7, 3]]),
    ).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 7, quantity: 3 },
    ])
  })

  it('fusionne les doublons et plafonne les quantités absurdes', () => {
    expect(
      parseCartCookie([
        [1, 2],
        [1, 3],
      ]),
    ).toEqual([{ productId: 1, quantity: 5 }])
    expect(parseCartCookie([[1, 1_000_000]])).toEqual([{ productId: 1, quantity: 999 }])
  })

  it('limite le nombre de lignes', () => {
    const many = Array.from({ length: 150 }, (_, i) => [i + 1, 1])
    expect(parseCartCookie(many)).toHaveLength(100)
  })
})

describe('cartCount', () => {
  it('additionne les quantités', () => {
    expect(cartCount(items)).toBe(3)
    expect(cartCount([])).toBe(0)
  })
})

describe('addToCart', () => {
  it('ajoute un nouveau produit', () => {
    const update = addToCart(items, 3, 1, 10)
    expect(update.items).toContainEqual({ productId: 3, quantity: 1 })
    expect(update.message).toBeNull()
  })

  it('incrémente un produit déjà présent', () => {
    const update = addToCart(items, 1, 1, 10)
    expect(update.items).toContainEqual({ productId: 1, quantity: 3 })
  })

  it('ne dépasse jamais le stock et explique pourquoi', () => {
    const update = addToCart(items, 1, 5, 4)
    expect(update.items).toContainEqual({ productId: 1, quantity: 4 })
    expect(update.message).toContain('4 exemplaires')
  })

  it('refuse si tout le stock est déjà dans le panier', () => {
    const update = addToCart(items, 1, 1, 2)
    expect(update.items).toEqual(items)
    expect(update.message).toContain('déjà tout le stock')
  })

  it('refuse un produit en rupture de stock', () => {
    const update = addToCart(items, 3, 1, 0)
    expect(update.items).toEqual(items)
    expect(update.message).toContain('rupture')
  })

  it('ne modifie pas le tableau d’origine', () => {
    const copy = structuredClone(items)
    addToCart(items, 1, 1, 10)
    expect(items).toEqual(copy)
  })
})

describe('setCartQuantity', () => {
  it('change la quantité', () => {
    expect(setCartQuantity(items, 1, 5, 10).items).toContainEqual({ productId: 1, quantity: 5 })
  })

  it('supprime la ligne à 0 ou moins', () => {
    expect(setCartQuantity(items, 1, 0, 10).items).toEqual([{ productId: 2, quantity: 1 }])
    expect(setCartQuantity(items, 1, -3, 10).items).toEqual([{ productId: 2, quantity: 1 }])
  })

  it('arrondit une quantité décimale à l’entier inférieur', () => {
    expect(setCartQuantity(items, 1, 2.7, 10).items).toContainEqual({ productId: 1, quantity: 2 })
  })

  it('ignore une quantité non numérique en supprimant la ligne', () => {
    expect(setCartQuantity(items, 1, Number.NaN, 10).items).toEqual([{ productId: 2, quantity: 1 }])
  })

  it('limite au stock avec un message (singulier)', () => {
    const update = setCartQuantity(items, 1, 3, 1)
    expect(update.items).toContainEqual({ productId: 1, quantity: 1 })
    expect(update.message).toContain('un seul exemplaire')
  })

  it('retire un produit devenu en rupture', () => {
    const update = setCartQuantity(items, 1, 2, 0)
    expect(update.items).toEqual([{ productId: 2, quantity: 1 }])
    expect(update.message).toContain('rupture')
  })
})

describe('removeFromCart', () => {
  it('supprime la ligne', () => {
    expect(removeFromCart(items, 2)).toEqual([{ productId: 1, quantity: 2 }])
  })
})

describe('toCartLines', () => {
  const products: CartProduct[] = [
    { id: 1, title: 'A', price: 9.99, category: 'beauty', stock: 10, thumbnail: '' },
  ]

  it('convertit les prix en centimes et ignore les produits introuvables', () => {
    expect(toCartLines(items, products)).toEqual([
      { productId: 1, category: 'beauty', unitPriceCents: 999, quantity: 2 },
    ])
  })
})
