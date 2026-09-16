/** Formatea un monto en bolivianos, la moneda de toda la plataforma. */
export function formatPrice(amount: number): string {
  return `Bs ${amount.toLocaleString('es-BO')}`;
}


/** Calcula la hora estimada de finalización a partir de la hora de inicio y la
 * duración en horas (sección "Duración del show"). Devuelve null si falta algún dato. */
export function computeEndTime(startTime: string | null, durationHours: number | null): string | null {
  if (!startTime || !durationHours) return null;
  const [h, m] = startTime.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const totalMinutes = h * 60 + m + Math.round(durationHours * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}
