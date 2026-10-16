import type { AppliedDiscount, CartLine, CartSummary } from '../types/cart'
import { formatCents } from './format'

// Signature imposée : les types sont définis dans types/cart.ts et ré-exportés ici
export type { AppliedDiscount, CartLine, CartSummary } from '../types/cart'

/*
 * Moteur de promotions : fonction PURE (ni Vue, ni Pinia, ni API).
 * Tous les montants sont en centimes (entiers) pour éviter les erreurs d'arrondi
 * des nombres à virgule (0.1 + 0.2 !== 0.3).
 *
 * ⚠️ Logique front pour le projet : en production, ce calcul doit être fait
 * côté serveur, sinon un client peut modifier les montants.
 */

const BEAUTY_CATEGORY = 'beauty'
const BEAUTY_MIN_ITEMS = 3
const BEAUTY_RATE_PERCENT = 10

const PROMO_CODE = 'TROYES10'
const PROMO_AMOUNT_CENTS = 1000
const PROMO_MIN_SUBTOTAL_CENTS = 5000

const MAX_DISCOUNT_RATE_PERCENT = 25

const SHIPPING_CENTS = 490
const FREE_SHIPPING_MIN_CENTS = 8000
const NO_FREE_SHIPPING_CATEGORY = 'furniture'

/**
 * Pourcentage d'un montant en centimes, arrondi au centime
 * (arrondi commercial : la moitié est arrondie vers le haut).
 */
function percentOf(amountCents: number, percent: number): number {
  return Math.round((amountCents * percent) / 100)
}

function lineTotal(line: CartLine): number {
  return line.unitPriceCents * line.quantity
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/** "  troyes10 " -> "TROYES10" ; chaîne vide si aucun code */
function normalizeCode(code: string | undefined): string {
  return (code ?? '').trim().toUpperCase()
}

/** Règle 1 : -10 % sur chaque ligne beauté dès 3 articles beauté (quantités cumulées) */
function beautyDiscount(lines: CartLine[]): number {
  const beautyLines = lines.filter((line) => line.category === BEAUTY_CATEGORY)
  const beautyCount = sum(beautyLines.map((line) => line.quantity))
  if (beautyCount < BEAUTY_MIN_ITEMS) return 0
  // Arrondi ligne par ligne, puis somme
  return sum(beautyLines.map((line) => percentOf(lineTotal(line), BEAUTY_RATE_PERCENT)))
}

export function computeCart(lines: CartLine[], promoCode?: string): CartSummary {
  // Les lignes à quantité nulle ou négative sont ignorées
  const validLines = lines.filter((line) => line.quantity > 0)
  const grossCents = sum(validLines.map(lineTotal))
  const discounts: AppliedDiscount[] = []
  const messages: string[] = []

  // 1. Remise beauté
  const beautyCents = beautyDiscount(validLines)
  if (beautyCents > 0) {
    discounts.push({
      id: 'BEAUTY_3',
      label: `-${BEAUTY_RATE_PERCENT} % sur les articles beauté (${BEAUTY_MIN_ITEMS} articles beauté ou plus)`,
      amountCents: beautyCents,
    })
  }

  // 2. Code TROYES10, sur le sous-total APRÈS remise beauté
  const code = normalizeCode(promoCode)
  if (code !== '') {
    if (code !== PROMO_CODE) {
      messages.push(`Le code « ${promoCode?.trim()} » n'existe pas.`)
    } else {
      const subtotalCents = grossCents - beautyCents
      if (subtotalCents <= PROMO_MIN_SUBTOTAL_CENTS) {
        messages.push(
          `Le code ${PROMO_CODE} est refusé : il faut un sous-total après remises strictement supérieur à ${formatCents(PROMO_MIN_SUBTOTAL_CENTS)} (actuellement ${formatCents(subtotalCents)}).`,
        )
      } else {
        // 3. Plafond : total des remises <= 25 % du brut. En cas de dépassement, on réduit le code.
        const capCents = percentOf(grossCents, MAX_DISCOUNT_RATE_PERCENT)
        const codeCents = Math.min(PROMO_AMOUNT_CENTS, capCents - beautyCents)
        if (codeCents < PROMO_AMOUNT_CENTS) {
          messages.push(
            `Le code ${PROMO_CODE} est réduit à ${formatCents(codeCents)} : le total des remises ne peut pas dépasser ${MAX_DISCOUNT_RATE_PERCENT} % du panier.`,
          )
        }
        discounts.push({
          id: 'TROYES10',
          label: `Code ${PROMO_CODE}`,
          amountCents: codeCents,
        })
      }
    }
  }

  // 4. Livraison : offerte dès 80 € après remises, sauf s'il y a un meuble
  const afterDiscountsCents = grossCents - sum(discounts.map((d) => d.amountCents))
  const hasFurniture = validLines.some((line) => line.category === NO_FREE_SHIPPING_CATEGORY)
  let shippingCents = SHIPPING_CENTS
  if (validLines.length === 0) {
    shippingCents = 0 // panier vide : rien à livrer
  } else if (afterDiscountsCents >= FREE_SHIPPING_MIN_CENTS) {
    if (hasFurniture) {
      messages.push(
        `Livraison payante : la livraison n'est jamais offerte lorsque le panier contient un meuble.`,
      )
    } else {
      shippingCents = 0
    }
  }

  return {
    grossCents,
    discounts,
    shippingCents,
    totalCents: afterDiscountsCents + shippingCents,
    messages,
  }
}
