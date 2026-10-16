import { describe, expect, it } from 'vitest'
import { computeCart, type CartLine, type CartSummary } from '../../app/utils/promotions'

let nextId = 1

/** Crée une ligne de panier : line(3, 'beauty', 999) = 3 × beauty à 9,99 € */
function line(quantity: number, category: string, unitPriceCents: number): CartLine {
  return { productId: nextId++, category, unitPriceCents, quantity }
}

function discountOf(summary: CartSummary, id: 'BEAUTY_3' | 'TROYES10'): number | undefined {
  return summary.discounts.find((discount) => discount.id === id)?.amountCents
}

interface Scenario {
  name: string
  lines: CartLine[]
  code?: string
  gross: number
  beauty?: number
  promo?: number
  promoRefused?: boolean
  shipping: number
  total: number
}

// Les 8 scénarios d'acceptation du sujet, reproduits tels quels (montants en centimes)
const scenarios: Scenario[] = [
  {
    name: '1 — 3 × beauty à 9,99, sans code',
    lines: [line(3, 'beauty', 999)],
    gross: 2997,
    beauty: 300,
    shipping: 490,
    total: 3187,
  },
  {
    name: '2 — 3 × beauty à 19,99 + TROYES10 (plafond 25 % : code réduit)',
    lines: [line(3, 'beauty', 1999)],
    code: 'TROYES10',
    gross: 5997,
    beauty: 600,
    promo: 899,
    shipping: 490,
    total: 4988,
  },
  {
    name: '3 — 1 × beauty à 39,00 + 1 × groceries à 15,00 + TROYES10',
    lines: [line(1, 'beauty', 3900), line(1, 'groceries', 1500)],
    code: 'TROYES10',
    gross: 5400,
    promo: 1000,
    shipping: 490,
    total: 4890,
  },
  {
    name: '4 — 1 × furniture à 89,99 + TROYES10',
    lines: [line(1, 'furniture', 8999)],
    code: 'TROYES10',
    gross: 8999,
    promo: 1000,
    shipping: 490,
    total: 8489,
  },
  {
    name: '5 — 2 × laptops à 45,00 + TROYES10 (livraison offerte à 80,00 pile)',
    lines: [line(2, 'laptops', 4500)],
    code: 'TROYES10',
    gross: 9000,
    promo: 1000,
    shipping: 0,
    total: 8000,
  },
  {
    name: '6 — 4 × beauty à 12,50 + TROYES10 (refusé : 45,00 après remise beauté)',
    lines: [line(4, 'beauty', 1250)],
    code: 'TROYES10',
    gross: 5000,
    beauty: 500,
    promoRefused: true,
    shipping: 490,
    total: 4990,
  },
  {
    name: '7 — 2 × groceries à 30,00 + " troyes10 " (casse et espaces ignorés)',
    lines: [line(2, 'groceries', 3000)],
    code: ' troyes10 ',
    gross: 6000,
    promo: 1000,
    shipping: 490,
    total: 5490,
  },
  {
    name: '8 — 1 × groceries à 79,99, sans code (livraison payante sous 80,00)',
    lines: [line(1, 'groceries', 7999)],
    gross: 7999,
    shipping: 490,
    total: 8489,
  },
]

describe('computeCart — scénarios d’acceptation', () => {
  it.each(scenarios)('$name', (scenario) => {
    const summary = computeCart(scenario.lines, scenario.code)

    expect(summary.grossCents).toBe(scenario.gross)
    expect(discountOf(summary, 'BEAUTY_3')).toBe(scenario.beauty)
    expect(discountOf(summary, 'TROYES10')).toBe(scenario.promo)
    expect(summary.shippingCents).toBe(scenario.shipping)
    expect(summary.totalCents).toBe(scenario.total)

    if (scenario.promoRefused) {
      expect(summary.messages.some((message) => message.includes('refusé'))).toBe(true)
    }
  })
})

describe('computeCart — cas limites', () => {
  it('panier vide : tout à 0, sans frais de livraison', () => {
    expect(computeCart([])).toEqual({
      grossCents: 0,
      discounts: [],
      shippingCents: 0,
      totalCents: 0,
      messages: [],
    })
  })

  it('panier vide avec un code : code refusé, total à 0', () => {
    const summary = computeCart([], 'TROYES10')
    expect(summary.totalCents).toBe(0)
    expect(summary.discounts).toEqual([])
    expect(summary.messages).toHaveLength(1)
  })

  it('ignore les lignes à quantité 0 ou négative', () => {
    const summary = computeCart([
      line(0, 'furniture', 50000),
      line(-2, 'beauty', 1000),
      line(1, 'groceries', 1000),
    ])
    expect(summary.grossCents).toBe(1000)
    expect(summary.totalCents).toBe(1490)
  })

  it('un meuble à quantité 0 ne bloque pas la livraison offerte', () => {
    const summary = computeCart([line(0, 'furniture', 9000), line(1, 'laptops', 9000)])
    expect(summary.shippingCents).toBe(0)
  })

  it('code inconnu : refusé avec un message qui le cite', () => {
    const summary = computeCart([line(1, 'groceries', 9000)], 'PROMO50')
    expect(discountOf(summary, 'TROYES10')).toBeUndefined()
    expect(summary.messages[0]).toContain('PROMO50')
    expect(summary.totalCents).toBe(9000)
  })

  it('code vide ou composé d’espaces : ignoré sans message', () => {
    expect(computeCart([line(1, 'groceries', 9000)], '   ').messages).toEqual([])
    expect(computeCart([line(1, 'groceries', 9000)], '').messages).toEqual([])
  })

  it('seuil TROYES10 strict : refusé à exactement 50,00', () => {
    const summary = computeCart([line(1, 'groceries', 5000)], 'TROYES10')
    expect(discountOf(summary, 'TROYES10')).toBeUndefined()
    expect(summary.messages[0]).toContain('refusé')
  })

  it('seuil TROYES10 : accepté à 50,01', () => {
    const summary = computeCart([line(1, 'groceries', 5001)], 'TROYES10')
    expect(discountOf(summary, 'TROYES10')).toBe(1000)
  })

  it('remise beauté : pas de remise à 2 articles beauté', () => {
    expect(discountOf(computeCart([line(2, 'beauty', 1000)]), 'BEAUTY_3')).toBeUndefined()
  })

  it('remise beauté : quantités cumulées sur plusieurs lignes', () => {
    const summary = computeCart([line(1, 'beauty', 1000), line(2, 'beauty', 2000)])
    expect(discountOf(summary, 'BEAUTY_3')).toBe(100 + 400)
  })

  it('remise beauté : ne s’applique pas aux autres catégories', () => {
    const summary = computeCart([line(3, 'beauty', 1000), line(1, 'groceries', 5000)])
    expect(discountOf(summary, 'BEAUTY_3')).toBe(300)
  })

  it('remise beauté : arrondi ligne par ligne, demi vers le haut', () => {
    // 1 × 0,05 -> 0,005 -> arrondi à 0,01 ; trois lignes -> 3 centimes (et non 2)
    const summary = computeCart([line(1, 'beauty', 5), line(1, 'beauty', 5), line(1, 'beauty', 5)])
    expect(discountOf(summary, 'BEAUTY_3')).toBe(3)
  })

  it('plafond : un message explique la réduction du code', () => {
    const summary = computeCart([line(3, 'beauty', 1999)], 'TROYES10')
    expect(summary.messages.some((message) => message.includes('réduit'))).toBe(true)
  })

  it('livraison : un meuble rend la livraison payante même au-delà de 80,00', () => {
    const summary = computeCart([line(1, 'furniture', 20000)])
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(20490)
    expect(summary.messages.some((message) => message.includes('meuble'))).toBe(true)
  })

  it('livraison : offerte au-delà de 80,00 sans meuble', () => {
    expect(computeCart([line(1, 'laptops', 120000)]).shippingCents).toBe(0)
  })

  it('les remises sont listées dans l’ordre d’application, avec un libellé', () => {
    const summary = computeCart([line(3, 'beauty', 3000)], 'troyes10')
    expect(summary.discounts.map((discount) => discount.id)).toEqual(['BEAUTY_3', 'TROYES10'])
    expect(summary.discounts.every((discount) => discount.label.length > 0)).toBe(true)
  })
})
