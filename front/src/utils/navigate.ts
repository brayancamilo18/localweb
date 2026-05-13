/**
 * Indirection alrededor de `window.location` para navegaciones full-page
 * (típicamente saltos a un dominio externo: Stripe Checkout, Stripe Customer
 * Portal, etc.) que NO deben pasar por `react-router`.
 *
 * Existe principalmente porque jsdom 26 marca `window.location`,
 * `location.href` y `location.assign` como non-configurable, lo que impide
 * mockearlos directamente en tests con `vi.spyOn` o `Object.defineProperty`.
 * Al encapsularlos aquí, los tests pueden hacer `vi.mock('.../navigate')` y
 * verificar la URL recibida sin que jsdom intente una navegación real.
 *
 * En producción equivale a `window.location.assign(url)`.
 */
export function navigateExternal(url: string): void {
  window.location.assign(url)
}
