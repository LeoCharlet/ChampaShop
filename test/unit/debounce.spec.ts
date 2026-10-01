import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce } from '../../app/utils/debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("n'appelle la fonction qu'après le délai", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('ne garde que le dernier appel en cas de frappe rapide', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('p')
    vi.advanceTimersByTime(100)
    debounced('ph')
    vi.advanceTimersByTime(100)
    debounced('pho')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('pho')
  })

  it("cancel annule l'appel en attente", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced.cancel()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })
})
