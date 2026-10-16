import type { CartItem, CartLine, CartProduct, CartUpdate } from '../types/cart'
import { toCents } from './format'

/** Nom du cookie du panier */
export const CART_COOKIE = 'champa_cart'
/** Garde-fou : quantité maximale acceptée depuis le cookie (valeur non fiable) */
const MAX_QUANTITY = 999
/** Garde-fou : nombre maximal de lignes (le cookie est limité à 4 Ko) */
const MAX_LINES = 100

/** Format du cookie : [[idProduit, quantité], …] -> ~8 octets par ligne */
export type CartCookie = [number, number][]

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * Lit le cookie (valeur non fiable : l'utilisateur peut la modifier).
 * Ignore les entrées invalides et fusionne les doublons.
 */
export function parseCartCookie(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return []
  const quantities = new Map<number, number>()
  for (const entry of raw) {
    if (!Array.isArray(entry)) continue
    const [productId, quantity] = entry as unknown[]
    if (!isPositiveInteger(productId) || !isPositiveInteger(quantity)) continue
    const total = (quantities.get(productId) ?? 0) + quantity
    quantities.set(productId, Math.min(total, MAX_QUANTITY))
  }
  return [...quantities]
    .slice(0, MAX_LINES)
    .map(([productId, quantity]) => ({ productId, quantity }))
}

export function serializeCart(items: CartItem[]): CartCookie {
  return items.map((item) => [item.productId, item.quantity])
}

/** Nombre total d'articles (pour le badge du header) */
export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

function stockLimitMessage(stock: number): string {
  return stock === 1
    ? 'Stock insuffisant : il ne reste qu’un seul exemplaire de ce produit.'
    : `Stock insuffisant : il ne reste que ${stock} exemplaires de ce produit.`
}

function withQuantity(items: CartItem[], productId: number, quantity: number): CartItem[] {
  const exists = items.some((item) => item.productId === productId)
  if (!exists) return [...items, { productId, quantity }]
  return items.map((item) => (item.productId === productId ? { ...item, quantity } : item))
}

export function removeFromCart(items: CartItem[], productId: number): CartItem[] {
  return items.filter((item) => item.productId !== productId)
}

/**
 * Change la quantité d'une ligne. 0 ou moins : la ligne est supprimée.
 * Au-delà du stock : la quantité est limitée au stock et un message l'explique.
 */
export function setCartQuantity(
  items: CartItem[],
  productId: number,
  quantity: number,
  stock: number,
): CartUpdate {
  const wanted = Math.floor(quantity)
  if (!Number.isFinite(wanted) || wanted <= 0) {
    return { items: removeFromCart(items, productId), message: null }
  }
  if (stock <= 0) {
    return {
      items: removeFromCart(items, productId),
      message: 'Ce produit est en rupture de stock, il a été retiré du panier.',
    }
  }
  if (wanted > stock) {
    return { items: withQuantity(items, productId, stock), message: stockLimitMessage(stock) }
  }
  return { items: withQuantity(items, productId, wanted), message: null }
}

/** Ajoute `quantity` exemplaires, sans jamais dépasser le stock */
export function addToCart(
  items: CartItem[],
  productId: number,
  quantity: number,
  stock: number,
): CartUpdate {
  if (stock <= 0) {
    return { items, message: 'Ce produit est en rupture de stock.' }
  }
  const current = items.find((item) => item.productId === productId)?.quantity ?? 0
  if (current >= stock) {
    return {
      items,
      message: `Vous avez déjà tout le stock disponible (${stock}) dans votre panier.`,
    }
  }
  return setCartQuantity(items, productId, current + quantity, stock)
}

/**
 * Prépare les lignes pour le moteur de promotions.
 * Les produits introuvables (supprimés de l'API) sont ignorés.
 */
export function toCartLines(items: CartItem[], products: CartProduct[]): CartLine[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  return items.flatMap((item) => {
    const product = byId.get(item.productId)
    if (!product) return []
    return [
      {
        productId: product.id,
        category: product.category,
        unitPriceCents: toCents(product.price),
        quantity: item.quantity,
      },
    ]
  })
}
