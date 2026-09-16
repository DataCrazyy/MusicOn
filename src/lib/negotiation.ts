import { supabase } from './supabase';

// Campos que se pueden negociar antes de firmar el contrato. La ubicación del evento
// (venue) y la fecha NO se negocian aquí — son datos fijos de la solicitud original;
// cambiarlos requiere un flujo aparte de "Solicitar cambio de ubicación" (todavía no
// construido). La cantidad de personas tampoco es negociable.
export type NegotiableField = 'price' | 'start_time' | 'duration_hours' | 'equipment' | 'notes';

export const FIELD_LABELS: Record<NegotiableField, string> = {
  price: 'Precio',
  start_time: 'Horario',
  duration_hours: 'Duración (horas)',
  equipment: 'Equipamiento',
  notes: 'Condiciones adicionales',
};

export type NegotiationRole = 'client' | 'artist';
export type NegotiationStatus = 'pending' | 'accepted' | 'rejected' | 'superseded';

/** Los cuatro campos que viajan juntos en una propuesta en bloque del panel de
 * negociación (antes de firmar). Cada propuesta se guarda como UNA sola fila/
 * transacción — nunca una fila independiente por campo — para poder comparar
 * "propuesta anterior" vs "nueva propuesta" como un todo. */
export type ProposalBundle = {
  price: number;
  duration_hours: number | null;
  start_time: string | null;
  equipment: string | null;
};

export type NegotiationEvent = {
  id: string;
  booking_id: string;
  // 'proposal' = propuesta en bloque (ver ProposalBundle). Los demás valores son el
  // modelo antiguo de un campo a la vez, que sigue usándose solo para solicitar
  // modificaciones puntuales después de que el contrato ya fue firmado.
  field: NegotiableField | 'proposal';
  old_value: string | null;
  new_value: string;
  message: string | null;
  proposed_by: string;
  proposed_role: NegotiationRole;
  status: NegotiationStatus;
  after_signature: boolean;
  proposal_number: number | null;
  created_at: string;
  resolved_at: string | null;
};

function parseBundle(json: string | null): ProposalBundle | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as ProposalBundle;
  } catch {
    return null;
  }
}

/** La propuesta (nuevos valores) de un evento de tipo 'proposal'. */
export function getProposalBundle(e: NegotiationEvent): ProposalBundle | null {
  return e.field === 'proposal' ? parseBundle(e.new_value) : null;
}

/** Los valores que tenía la reserva justo antes de esta propuesta — para mostrar
 * "Propuesta anterior" vs "Nueva propuesta" como dos bloques comparables. */
export function getPreviousBundle(e: NegotiationEvent): ProposalBundle | null {
  return e.field === 'proposal' ? parseBundle(e.old_value) : null;
}

function validateBundle(bundle: ProposalBundle) {
  if (!(bundle.price > 0)) {
    throw new Error('El precio debe ser mayor a 0.');
  }
  // 50. La duración en horas nunca puede ser negativa ni cero, se valide donde se
  // valide — este es el punto único por el que pasa toda propuesta de negociación.
  if (bundle.duration_hours != null && !(bundle.duration_hours > 0)) {
    throw new Error('La duración debe ser mayor a 0 horas.');
  }
}

/**
 * Todo lo que puede afectar al contrato se maneja como dato estructurado en esta
 * tabla — nunca se infiere del texto de un mensaje de chat. El chat solo muestra
 * estos eventos para que las partes vean la conversación y la negociación juntas.
 */
export async function listNegotiationEvents(bookingId: string): Promise<NegotiationEvent[]> {
  const { data, error } = await supabase
    .from('booking_negotiation_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as NegotiationEvent[];
}

/** Envía una propuesta en bloque (Precio, Duración, Horario, Equipamiento) como una
 * única transacción. Reemplaza cualquier propuesta pendiente anterior de la misma
 * reserva — nunca hay dos propuestas abiertas a la vez — y queda numerada de forma
 * secuencial ("Propuesta #2", "Propuesta #3", ...) para poder compararla contra la
 * anterior. */
export async function proposeBundle(input: {
  bookingId: string;
  previous: ProposalBundle;
  next: ProposalBundle;
  message?: string;
  proposedBy: string;
  proposedRole: NegotiationRole;
  afterSignature?: boolean;
}): Promise<NegotiationEvent> {
  validateBundle(input.next);

  const { error: supersedeError } = await supabase
    .from('booking_negotiation_events')
    .update({ status: 'superseded', resolved_at: new Date().toISOString() })
    .eq('booking_id', input.bookingId)
    .eq('field', 'proposal')
    .eq('status', 'pending');
  if (supersedeError) throw supersedeError;

  const { data: last } = await supabase
    .from('booking_negotiation_events')
    .select('proposal_number')
    .eq('booking_id', input.bookingId)
    .eq('field', 'proposal')
    .order('proposal_number', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const proposalNumber = (last?.proposal_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('booking_negotiation_events')
    .insert({
      booking_id: input.bookingId,
      field: 'proposal',
      old_value: JSON.stringify(input.previous),
      new_value: JSON.stringify(input.next),
      message: input.message?.trim() || null,
      proposed_by: input.proposedBy,
      proposed_role: input.proposedRole,
      status: 'pending',
      after_signature: input.afterSignature ?? false,
      proposal_number: proposalNumber,
    })
    .select()
    .single();
  if (error) throw error;
  return data as NegotiationEvent;
}

/** Propone un cambio puntual de un solo campo — se usa solo para solicitar
 * modificaciones después de que el contrato ya fue firmado (ContractPage). */
export async function proposeChange(input: {
  bookingId: string;
  field: NegotiableField;
  oldValue: string | null;
  newValue: string;
  message?: string;
  proposedBy: string;
  proposedRole: NegotiationRole;
  afterSignature?: boolean;
}): Promise<NegotiationEvent> {
  if (input.field === 'duration_hours' && !(Number(input.newValue) > 0)) {
    throw new Error('La duración debe ser mayor a 0 horas.');
  }
  if (input.field === 'price' && !(Number(input.newValue) > 0)) {
    throw new Error('El precio debe ser mayor a 0.');
  }

  const { error: supersedeError } = await supabase
    .from('booking_negotiation_events')
    .update({ status: 'superseded', resolved_at: new Date().toISOString() })
    .eq('booking_id', input.bookingId)
    .eq('field', input.field)
    .eq('status', 'pending');
  if (supersedeError) throw supersedeError;

  const { data, error } = await supabase
    .from('booking_negotiation_events')
    .insert({
      booking_id: input.bookingId,
      field: input.field,
      old_value: input.oldValue,
      new_value: input.newValue,
      message: input.message || null,
      proposed_by: input.proposedBy,
      proposed_role: input.proposedRole,
      status: 'pending',
      after_signature: input.afterSignature ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as NegotiationEvent;
}

/** Aplica el valor aceptado directamente a la columna correspondiente de bookings —
 * esta es la única forma en la que un valor negociado pasa a ser el dato oficial. */
async function applySingleField(bookingId: string, field: NegotiableField, newValue: string) {
  let update: Record<string, unknown>;
  switch (field) {
    case 'price':
      update = { total: Number(newValue) };
      break;
    case 'duration_hours':
      update = { duration_hours: Number(newValue) };
      break;
    case 'start_time':
      update = { start_time: newValue };
      break;
    case 'equipment':
      update = { equipment: newValue };
      break;
    case 'notes':
      update = { notes: newValue };
      break;
  }
  const { error } = await supabase.from('bookings').update(update).eq('id', bookingId);
  if (error) throw error;
}

async function applyBundle(bookingId: string, bundle: ProposalBundle) {
  const { error } = await supabase
    .from('bookings')
    .update({
      total: bundle.price,
      duration_hours: bundle.duration_hours,
      start_time: bundle.start_time,
      equipment: bundle.equipment,
    })
    .eq('id', bookingId);
  if (error) throw error;
}

/** Acepta una propuesta: la marca como aceptada y aplica el/los valor(es) a
 * bookings — esta es "la última propuesta aceptada por ambas partes" que, a partir
 * de ese momento, es también el precio/duración/horario/equipamiento vigente. */
export async function acceptNegotiationEvent(event: NegotiationEvent): Promise<void> {
  const { error } = await supabase
    .from('booking_negotiation_events')
    .update({ status: 'accepted', resolved_at: new Date().toISOString() })
    .eq('id', event.id);
  if (error) throw error;

  if (event.field === 'proposal') {
    const bundle = getProposalBundle(event);
    if (bundle) await applyBundle(event.booking_id, bundle);
  } else {
    await applySingleField(event.booking_id, event.field, event.new_value);
  }
}

/** Rechaza una propuesta sin tocar el valor vigente en bookings. */
export async function rejectNegotiationEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('booking_negotiation_events')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;
}
