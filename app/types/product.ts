/** État du stock d'un produit, pour l'affichage sur la fiche */
export type StockStatus =
  { kind: 'in-stock' } | { kind: 'low'; remaining: number } | { kind: 'out-of-stock' }
