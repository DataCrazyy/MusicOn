/** Formatea un monto en bolivianos, la moneda de toda la plataforma. */
export function formatPrice(amount: number): string {
  return `Bs ${amount.toLocaleString('es-BO')}`;
}
