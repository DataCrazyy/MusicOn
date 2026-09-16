import type { BookingStatus } from './bookings';

/** Etiquetas y estilos compartidos para el estado de una solicitud/contratación, usados en Solicitudes y en Chat. */
export const STATUS_LABELS: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente de aprobación', className: 'bg-amber/15 text-amber' },
  confirmed: { label: 'Aceptada', className: 'bg-lime/15 text-lime' },
  in_escrow: { label: 'Pago en garantía', className: 'bg-teal/15 text-teal' },
  completed: { label: 'Completada', className: 'bg-bg-raised text-ink-muted' },
  cancelled: { label: 'Rechazada', className: 'bg-red-500/15 text-red-400' },
};
