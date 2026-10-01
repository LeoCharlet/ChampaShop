const priceFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Formate un prix en euros : 9.99 -> "9,99 €" */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount)
}
