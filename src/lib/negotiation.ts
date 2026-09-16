import { supabase } from './supabase';

export type NegotiableField =
  | 'price'
  | 'event_date'
  | 'start_time'
  | 'duration_hours'
  | 'venue'
  | 'guest_range'
  | 'notes';

export const FIELD_LABELS: Record<NegotiableField, string> = {
  price: 'Precio',
  event_date: 'Fecha',
  start_time: 'Hora de inicio',
  duration_hours: 'Duración (horas)',
  venue: 'Lugar',
  guest_range: 'Cantidad de personas',
  notes: 'Condiciones adicionales',
};

export type NegotiationRole = 'client' | 'artist';
export type NegotiationStatus = 'pending' | 'accepted' | 'rejected' | 'superseded';

export type NegotiationEvent = {
  id: string;
  booking_id: string;
  field: NegotiableField;
  old_value: string | null;
  new_value: string;
  message: string | null;
  proposed_by: string;
  proposed_role: NegotiationRole;
  status: NegotiationStatus;
  after_signature: boolean;
  created_at: string;
  resolved_at: string | null;
};

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

/** Propone un cambio en un campo negociable. Si ya había una propuesta pendiente para
 * ese mismo campo, se marca como reemplazada (superseded) para no dejar dos abiertas. */
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
async function applyAcceptedValue(bookingId: string, field: NegotiableField, newValue: string) {
  let update: Record<string, unknown>;
  switch (field) {
    case 'price':
      update = { total: Number(newValue) };
      break;
    case 'duration_hours':
      update = { duration_hours: Number(newValue) };
      break;
    case 'event_date':
      update = { event_date: newValue };
      break;
    case 'start_time':
      update = { start_time: newValue };
      break;
    case 'venue':
      update = { venue: newValue };
      break;
    case 'guest_range':
      update = { guest_range: newValue };
      break;
    case 'notes':
      update = { notes: newValue };
      break;
  }
  const { error } = await supabase.from('bookings').update(update).eq('id', bookingId);
  if (error) throw error;
}

/** Acepta una propuesta: la marca como aceptada y aplica el valor a bookings. */
export async function acceptNegotiationEvent(event: NegotiationEvent): Promise<void> {
  const { error } = await supabase
    .from('booking_negotiation_events')
    .update({ status: 'accepted', resolved_at: new Date().toISOString() })
    .eq('id', event.id);
  if (error) throw error;
  await applyAcceptedValue(event.booking_id, event.field, event.new_value);
}

/** Rechaza una propuesta sin tocar el valor vigente en bookings. */
export async function rejectNegotiationEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('booking_negotiation_events')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;
}
