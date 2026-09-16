import type { Step, StepStatus } from '@/components/Stepper';
import type { BookingStatus } from './bookings';

/** Los 7 pasos del flujo completo de una reserva, en el orden en el que ocurren.
 * Se usan tanto en el Chat (vista resumida) como en la página del contrato (vista
 * completa) para que el usuario siempre sepa exactamente en qué etapa está y cuál es
 * el siguiente paso (57, 60). */
export const FLOW_STEP_DEFS: { key: string; label: string }[] = [
  { key: 'solicitud', label: 'Solicitud' },
  { key: 'negociacion', label: 'Negociación' },
  { key: 'contrato', label: 'Contrato' },
  { key: 'firma_artista', label: 'Firma del artista' },
  { key: 'firma_cliente', label: 'Firma del cliente' },
  { key: 'pago', label: 'Pago' },
  { key: 'confirmada', label: 'Reserva confirmada' },
];

export function computeFlowSteps(opts: {
  bookingStatus: BookingStatus;
  artistSigned: boolean;
  clientSigned: boolean;
  isPaidAndConfirmed: boolean;
}): Step[] {
  const { bookingStatus, artistSigned, clientSigned, isPaidAndConfirmed } = opts;

  const negotiationDone = bookingStatus !== 'pending' && bookingStatus !== 'cancelled';
  const statuses: StepStatus[] = [
    'done', // Solicitud — ya se envió, siempre completada en este punto del flujo
    negotiationDone ? 'done' : 'active', // Negociación
    !negotiationDone ? 'pending' : artistSigned ? 'done' : 'active', // Contrato
    !negotiationDone ? 'pending' : artistSigned ? 'done' : 'pending', // Firma del artista
    !artistSigned ? 'pending' : clientSigned ? 'done' : 'active', // Firma del cliente
    !clientSigned ? 'pending' : isPaidAndConfirmed ? 'done' : 'active', // Pago
    isPaidAndConfirmed ? 'done' : 'pending', // Reserva confirmada
  ];

  return FLOW_STEP_DEFS.map((def, i) => ({ ...def, status: statuses[i] }));
}
