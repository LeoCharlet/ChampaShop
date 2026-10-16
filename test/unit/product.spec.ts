import { describe, expect, it } from 'vitest'
import { getStockStatus, LOW_STOCK_THRESHOLD, parseProductId } from '../../app/utils/product'

describe('parseProductId', () => {
  it('accepte un entier positif', () => {
    expect(parseProductId('1')).toBe(1)
    expect(parseProductId('194')).toBe(194)
  })

  it('prend la première valeur si le paramètre est un tableau', () => {
    expect(parseProductId(['7', '8'])).toBe(7)
  })

  it('refuse les identifiants invalides', () => {
    expect(parseProductId('abc')).toBeNull()
    expect(parseProductId('0')).toBeNull()
    expect(parseProductId('-3')).toBeNull()
    expect(parseProductId('1.5')).toBeNull()
    expect(parseProductId('12abc')).toBeNull()
    expect(parseProductId('')).toBeNull()
    expect(parseProductId(undefined)).toBeNull()
    expect(parseProductId('99999999999999999999')).toBeNull()
  })
})

describe('getStockStatus', () => {
  it('rupture de stock à 0', () => {
    expect(getStockStatus(0)).toEqual({ kind: 'out-of-stock' })
  })

  it('stock faible en dessous de 5', () => {
    expect(getStockStatus(1)).toEqual({ kind: 'low', remaining: 1 })
    expect(getStockStatus(LOW_STOCK_THRESHOLD - 1)).toEqual({
      kind: 'low',
      remaining: 4,
    })
  })

  it('en stock à partir de 5', () => {
    expect(getStockStatus(LOW_STOCK_THRESHOLD)).toEqual({ kind: 'in-stock' })
    expect(getStockStatus(120)).toEqual({ kind: 'in-stock' })
  })
})
