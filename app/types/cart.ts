// ---------- Moteur de promotions (signature imposée par le sujet) ----------

/** Une ligne du panier, telle que la voit le moteur de promotions */
export interface CartLine {
  productId: number
  category: string
  unitPriceCents: number
  quantity: number
}

export interface AppliedDiscount {
  id: 'BEAUTY_3' | 'TROYES10'
  label: string
  amountCents: number
}

export interface CartSummary {
  grossCents: number
  discounts: AppliedDiscount[]
  shippingCents: number
  totalCents: number
  /** Explications à afficher, ex. pourquoi un code est refusé */
  messages: string[]
}

// ---------- Panier (store + cookie) ----------

/** Ce qui est stocké dans le cookie : le strict nécessaire */
export interface CartItem {
  productId: number
  quantity: number
}

/** Infos produit chargées depuis l'API pour afficher et calculer le panier */
export interface CartProduct {
  id: number
  title: string
  price: number
  category: string
  stock: number
  thumbnail: string
}

/** Résultat d'une modification du panier */
export interface CartUpdate {
  items: CartItem[]
  /** Message à afficher si la demande n'a pas pu être appliquée telle quelle */
  message: string | null
}
