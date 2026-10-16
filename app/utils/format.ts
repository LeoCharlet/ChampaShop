const priceFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Formate un prix en euros : 9.99 -> "9,99 €" */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount)
}

/** Formate un montant en centimes : 999 -> "9,99 €" */
export function formatCents(cents: number): string {
  return priceFormatter.format(cents / 100)
}

/** Convertit un prix en euros (API) en centimes entiers : 9.99 -> 999 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}
