import { defineStore } from 'pinia'
import type { CartItem } from '~/types/cart'
import type { CartCookie } from '~/utils/cart'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

/**
 * Store du panier.
 *
 * Persistance par cookie (useCookie) : le cookie est envoyé au serveur à chaque
 * requête, donc le panier est présent dès le rendu serveur (pas de "flash" de
 * panier vide). Limite de 4 Ko : on ne stocke que [idProduit, quantité].
 * Titres, prix et stocks sont rechargés depuis l'API : on ne fait jamais
 * confiance à un prix stocké chez le client.
 */
export const useCartStore = defineStore('cart', () => {
  const cookieOptions = {
    maxAge: THIRTY_DAYS_IN_SECONDS,
    sameSite: 'lax' as const,
    path: '/',
  }
  const cartCookie = useCookie<CartCookie>(CART_COOKIE, {
    ...cookieOptions,
    default: () => [],
  })
  const promoCookie = useCookie<string>('champa_promo', { ...cookieOptions, default: () => '' })

  const items = computed<CartItem[]>(() => parseCartCookie(cartCookie.value))
  const count = computed<number>(() => cartCount(items.value))
  const promoCode = computed<string>(() =>
    typeof promoCookie.value === 'string' ? promoCookie.value : '',
  )

  function save(next: CartItem[]): void {
    cartCookie.value = serializeCart(next)
  }

  /** Ajoute au panier. Retourne un message si le stock limite l'ajout, sinon null. */
  function add(productId: number, stock: number, quantity = 1): string | null {
    const update = addToCart(items.value, productId, quantity, stock)
    save(update.items)
    return update.message
  }

  /** Change la quantité (0 = suppression). Retourne un message si le stock la limite. */
  function setQuantity(productId: number, quantity: number, stock: number): string | null {
    const update = setCartQuantity(items.value, productId, quantity, stock)
    save(update.items)
    return update.message
  }

  function remove(productId: number): void {
    save(removeFromCart(items.value, productId))
  }

  function clear(): void {
    save([])
  }

  function applyPromoCode(code: string): void {
    promoCookie.value = code.trim()
  }

  function removePromoCode(): void {
    promoCookie.value = ''
  }

  return {
    items,
    count,
    promoCode,
    add,
    setQuantity,
    remove,
    clear,
    applyPromoCode,
    removePromoCode,
  }
})
