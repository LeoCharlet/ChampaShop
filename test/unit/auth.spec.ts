import { describe, expect, it, vi } from 'vitest'
import type { User } from '../../app/types/dummyjson'
import { createSingleFlight, isUnauthorized, pickUser, safeRedirect } from '../../app/utils/auth'

/** Promesse contrôlable depuis le test */
function deferred<T>(): {
  promise: Promise<T>
  resolve: (v: T) => void
  reject: (e: unknown) => void
} {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('createSingleFlight', () => {
  it('3 appels simultanés -> une seule exécution, même résultat pour tous', async () => {
    const pending = deferred<string>()
    const refresh = vi.fn(() => pending.promise)
    const singleFlight = createSingleFlight(refresh)

    const calls = [singleFlight(), singleFlight(), singleFlight()]
    expect(refresh).toHaveBeenCalledTimes(1)

    pending.resolve('nouveau-token')
    await expect(Promise.all(calls)).resolves.toEqual([
      'nouveau-token',
      'nouveau-token',
      'nouveau-token',
    ])
  })

  it('relance une nouvelle exécution une fois la précédente terminée', async () => {
    const refresh = vi.fn(() => Promise.resolve('ok'))
    const singleFlight = createSingleFlight(refresh)
    await singleFlight()
    await singleFlight()
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('propage l’échec à tous les appelants puis se réinitialise', async () => {
    const pending = deferred<string>()
    const refresh = vi.fn(() => pending.promise)
    const singleFlight = createSingleFlight(refresh)

    const calls = [singleFlight(), singleFlight()]
    pending.reject(new Error('refresh expiré'))
    for (const call of calls) await expect(call).rejects.toThrow('refresh expiré')

    refresh.mockImplementation(() => Promise.resolve('ok'))
    await expect(singleFlight()).resolves.toBe('ok')
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})

describe('isUnauthorized', () => {
  it('reconnaît une 401 (statusCode ou status)', () => {
    expect(isUnauthorized({ statusCode: 401 })).toBe(true)
    expect(isUnauthorized({ status: 401 })).toBe(true)
  })

  it('ignore les autres erreurs', () => {
    expect(isUnauthorized({ statusCode: 500 })).toBe(false)
    expect(isUnauthorized(new Error('réseau'))).toBe(false)
    expect(isUnauthorized(null)).toBe(false)
    expect(isUnauthorized('401')).toBe(false)
  })
})

describe('safeRedirect', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirect('/compte')).toBe('/compte')
    expect(safeRedirect('/produits?q=phone')).toBe('/produits?q=phone')
    expect(safeRedirect(['/panier', '/autre'])).toBe('/panier')
  })

  it('refuse les URL externes (open redirect)', () => {
    expect(safeRedirect('https://pirate.example')).toBe('/compte')
    expect(safeRedirect('//pirate.example')).toBe('/compte')
    expect(safeRedirect('/\\pirate.example')).toBe('/compte')
    expect(safeRedirect('javascript:alert(1)')).toBe('/compte')
  })

  it('utilise la valeur par défaut si absent', () => {
    expect(safeRedirect(undefined)).toBe('/compte')
    expect(safeRedirect(undefined, '/')).toBe('/')
  })
})

describe('pickUser', () => {
  it('ne garde que les champs du type User', () => {
    const raw = {
      id: 1,
      username: 'emilys',
      email: 'emily@x.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'img.png',
      bank: { cardNumber: '1234' },
    } as User
    expect(pickUser(raw)).toEqual({
      id: 1,
      username: 'emilys',
      email: 'emily@x.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'img.png',
    })
  })
})
