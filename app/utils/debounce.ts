export interface Debounced<Args extends unknown[]> {
  (...args: Args): void
  /** Annule l'appel en attente */
  cancel: () => void
}

/**
 * Retarde l'appel de `fn` : il n'est exécuté que `delay` ms après le DERNIER appel.
 * Ex. pour la recherche : on attend que l'utilisateur arrête de taper.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  const debounced = (...args: Args): void => {
    cancel()
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, delay)
  }

  return Object.assign(debounced, { cancel })
}
