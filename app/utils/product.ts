import type { StockStatus } from '../types/product'

/** En dessous de ce seuil, on affiche "Plus que X en stock" */
export const LOW_STOCK_THRESHOLD = 5

/**
 * Lit l'identifiant de produit depuis l'URL (/produits/:id).
 * Retourne null si ce n'est pas un entier strictement positif ("abc", "0", "1.5"…).
 */
export function parseProductId(raw: unknown): number | null {
  const value: unknown = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return id >= 1 && Number.isSafeInteger(id) ? id : null
}

/** Détermine le message de stock à afficher */
export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return { kind: 'out-of-stock' }
  if (stock < LOW_STOCK_THRESHOLD) return { kind: 'low', remaining: stock }
  return { kind: 'in-stock' }
}
