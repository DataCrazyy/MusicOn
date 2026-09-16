import { supabase } from './supabase';
import { formatPrice } from './format';
import type { BookingWithArtist } from './bookings';

export type Contract = {
  id: string;
  booking_id: string;
  terms: string;
  client_signature_url: string | null;
  artist_signature_url: string | null;
  client_signed_name: string | null;
  artist_signed_name: string | null;
  client_signed_at: string | null;
  artist_signed_at: string | null;
  created_at: string;
};

/**
 * Arma el texto del contrato digital a partir de los datos ya cargados de la
 * solicitud (servicio, fecha, horario, dirección, invitados, precio, equipo,
 * condiciones y observaciones) — el cliente nunca tiene que volver a
 * escribirlos.
 */
export function buildContractTerms(booking: BookingWithArtist, clientName: string): string {
  const artist = booking.artist;
  const equipmentList =
    artist?.equipment && artist.equipment.length > 0
      ? artist.equipment.map((e) => (e === 'Otro' && artist.equipment_other ? artist.equipment_other : e)).join(', ')
      : 'No especificado';

  const priceNote =
    booking.total !== booking.subtotal
      ? `${formatPrice(booking.total)} (precio negociado; precio publicado original: ${formatPrice(booking.subtotal)})`
      : formatPrice(booking.total);

  return `CONTRATO DE PRESTACIÓN DE SERVICIO MUSICAL

Cliente: ${clientName}
Artista: ${artist?.name ?? '—'}

Servicio: ${booking.event_type}
Fecha del evento: ${booking.event_date}
Horario: ${booking.start_time ?? '—'}
Lugar: ${booking.venue ?? '—'}
Cantidad de invitados: ${booking.guest_range ?? '—'}

Equipamiento incluido: ${equipmentList}

Precio acordado: ${priceNote}

Observaciones del cliente: ${booking.notes?.trim() || 'Ninguna'}

Condiciones generales:
- La solicitud fue enviada por el cliente y aceptada por el artista a través de MusicOn.
- El precio acordado es el que figura arriba, resultado de la negociación (si la hubo) entre las partes.
- El artista se compromete a presentarse en la fecha, horario y lugar acordados con el equipamiento indicado.
- Cualquier cambio a estos términos debe acordarse por el chat de la solicitud antes de la fecha del evento.
- Este documento se genera automáticamente a partir de los datos de la solicitud y queda asociado a ella dentro de la plataforma.`;
}

export async function getContractByBooking(bookingId: string): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('booking_id', bookingId).maybeSingle();
  if (error) throw error;
  return data as Contract | null;
}

/**
 * Crea el contrato si todavía no existe para esta solicitud (idempotente).
 * Si cliente y artista lo abren casi al mismo tiempo, el segundo insert puede
 * chocar con la restricción unique(booking_id); en ese caso simplemente se
 * relee el contrato ya creado por el otro.
 */
export async function ensureContract(bookingId: string, terms: string): Promise<Contract> {
  const existing = await getContractByBooking(bookingId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('contracts')
    .insert({ booking_id: bookingId, terms })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const raceWinner = await getContractByBooking(bookingId);
      if (raceWinner) return raceWinner;
    }
    throw error;
  }
  return data as Contract;
}

export async function signContractAsClient(contractId: string, fullName: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ client_signed_name: fullName, client_signed_at: new Date().toISOString() })
    .eq('id', contractId);
  if (error) throw error;
}

export async function signContractAsArtist(contractId: string, fullName: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ artist_signed_name: fullName, artist_signed_at: new Date().toISOString() })
    .eq('id', contractId);
  if (error) throw error;
}

/** Pago simulado del MVP: no procesa dinero real, solo confirma la contratación. */
export async function markBookingPaidAndConfirmed(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'in_escrow', paid_at: new Date().toISOString() })
    .eq('id', bookingId);
  if (error) throw error;
}
