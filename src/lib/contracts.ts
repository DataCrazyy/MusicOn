import { supabase } from './supabase';
import { formatPrice, computeEndTime } from './format';
import type { BookingWithArtist } from './bookings';
import { CONTRACT_CLAUSES } from './contractClauses';

export type ContractVersionSnapshot = {
  version: number;
  terms: string;
  client_signed_name: string | null;
  artist_signed_name: string | null;
  client_signed_at: string | null;
  artist_signed_at: string | null;
  archived_at: string;
};

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
  version: number;
  previous_versions: ContractVersionSnapshot[];
  created_at: string;
};

export type ContractFields = {
  equipmentList: string;
  endTime: string | null;
  publishedPrice: number;
  originalProposed: number;
  negotiated: boolean;
  locationParts: string[];
};

/** Datos derivados de la reserva que tanto el texto plano del contrato como el
 * documento visual (ContractDocument) necesitan — una sola fuente para no duplicar
 * la lógica de armado en dos lugares distintos. */
export function getContractFields(
  booking: BookingWithArtist,
  opts?: { originalProposedPrice?: number }
): ContractFields {
  const artist = booking.artist;
  const equipmentList =
    artist?.equipment && artist.equipment.length > 0
      ? artist.equipment.map((e) => (e === 'Otro' && artist.equipment_other ? artist.equipment_other : e)).join(', ')
      : 'No especificado';

  const endTime = computeEndTime(booking.start_time, booking.duration_hours);
  const originalProposed = opts?.originalProposedPrice ?? booking.subtotal;
  const publishedPrice = artist?.price_from ?? booking.subtotal;
  const negotiated = booking.total !== originalProposed;

  const locationParts = [
    booking.venue ?? null,
    booking.venue_reference ? `Referencia: ${booking.venue_reference}` : null,
    booking.event_lat != null && booking.event_lng != null
      ? `Coordenadas: ${booking.event_lat.toFixed(5)}, ${booking.event_lng.toFixed(5)}`
      : null,
  ].filter((p): p is string => !!p);

  return { equipmentList, endTime, publishedPrice, originalProposed, negotiated, locationParts };
}

/** Número de contrato legible, derivado del id de la reserva (estable, sin contador aparte). */
export function contractNumberFor(bookingId: string): string {
  return `#RES-${bookingId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

/**
 * Arma el texto plano del contrato (guardado en contracts.terms) a partir de los
 * datos ya cargados de la solicitud y de la misma lista de cláusulas que usa el
 * documento visual — el cliente nunca tiene que volver a escribirlos, y las
 * cláusulas nunca quedan duplicadas entre el texto y la vista.
 */
export function buildContractTerms(
  booking: BookingWithArtist,
  clientName: string,
  opts?: { originalProposedPrice?: number }
): string {
  const artist = booking.artist;
  const { equipmentList, endTime, publishedPrice, originalProposed, negotiated, locationParts } =
    getContractFields(booking, opts);

  const clausesText = CONTRACT_CLAUSES.map((cl) => `CLÁUSULA ${cl.number} — ${cl.title}\n${cl.body}`).join('\n\n');

  return `CONTRATO DE PRESTACIÓN DE SERVICIOS MUSICALES
${contractNumberFor(booking.id)}

IDENTIFICACIÓN DE LAS PARTES
Cliente: ${clientName}
Artista/Grupo: ${artist?.name ?? '—'}${artist?.members ? ` (${artist.members} integrante(s))` : ''}

SERVICIO CONTRATADO
Servicio: ${booking.event_type}
Fecha: ${booking.event_date}
Horario: ${booking.start_time ?? '—'}
Duración estimada: ${booking.duration_hours ? `${booking.duration_hours} horas` : '—'}
Hora estimada de finalización: ${endTime ?? '—'}

LUGAR DEL EVENTO
${locationParts.length > 0 ? locationParts.join(' — ') : '—'}

CANTIDAD DE PERSONAS
Integrantes del artista: ${artist?.members ?? '—'}
Asistentes estimados: ${booking.guest_range ?? '—'}

EQUIPAMIENTO
${equipmentList}

CONDICIONES ECONÓMICAS
Precio publicado: ${formatPrice(publishedPrice)}
Precio inicialmente propuesto: ${formatPrice(originalProposed)}
Precio final acordado: ${formatPrice(booking.total)}${negotiated ? ' (resultado de la negociación entre las partes)' : ''}
Otros costos: Bs 0
TOTAL: ${formatPrice(booking.total)}

CONDICIONES DEL SERVICIO
${booking.notes?.trim() || 'Sin condiciones adicionales registradas.'}

${clausesText}

ACEPTACIÓN Y FIRMAS
Este documento se genera automáticamente a partir de los datos estructurados de la
solicitud. La aceptación se registra mediante la firma digital de cada parte dentro de
la plataforma (nombre completo, fecha y hora de la firma), visibles en la sección de
firmas de esta pantalla.`;
}

export async function getContractByBooking(bookingId: string): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('booking_id', bookingId).maybeSingle();
  if (error) throw error;
  return data as Contract | null;
}

/** Antes de que nadie haya firmado, es seguro mantener el texto del contrato
 * sincronizado con los datos vigentes de la reserva (p. ej. tras una negociación). */
export async function updateContractTerms(contractId: string, terms: string): Promise<Contract> {
  const { data, error } = await supabase.from('contracts').update({ terms }).eq('id', contractId).select().single();
  if (error) throw error;
  return data as Contract;
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

/** El artista firma primero (sección "Flujo de firma del contrato"): el cliente recién ve
 * su propio formulario de firma habilitado una vez que el artista ya firmó. */
export async function signContractAsArtist(contractId: string, fullName: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ artist_signed_name: fullName, artist_signed_at: new Date().toISOString() })
    .eq('id', contractId);
  if (error) throw error;
}

export async function signContractAsClient(contractId: string, fullName: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ client_signed_name: fullName, client_signed_at: new Date().toISOString() })
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

/**
 * Guarda la versión actual del contrato en su historial (previous_versions), la
 * reemplaza por el nuevo texto y limpia ambas firmas para forzar que se vuelva a
 * firmar bajo la nueva versión. Nunca se sobrescribe un contrato firmado en silencio.
 */
export async function archiveAndBumpContractVersion(contract: Contract, newTerms: string): Promise<Contract> {
  const snapshot: ContractVersionSnapshot = {
    version: contract.version,
    terms: contract.terms,
    client_signed_name: contract.client_signed_name,
    artist_signed_name: contract.artist_signed_name,
    client_signed_at: contract.client_signed_at,
    artist_signed_at: contract.artist_signed_at,
    archived_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('contracts')
    .update({
      version: contract.version + 1,
      previous_versions: [...(contract.previous_versions ?? []), snapshot],
      terms: newTerms,
      client_signed_name: null,
      artist_signed_name: null,
      client_signed_at: null,
      artist_signed_at: null,
    })
    .eq('id', contract.id)
    .select()
    .single();

  if (error) throw error;
  return data as Contract;
}

/** Aplica una modificación aprobada después de la firma: regenera el texto del
 * contrato con los datos ya actualizados de bookings y abre una nueva versión. */
export async function applyPostSignatureChange(
  contract: Contract,
  booking: BookingWithArtist,
  clientName: string
): Promise<Contract> {
  const newTerms = buildContractTerms(booking, clientName);
  return archiveAndBumpContractVersion(contract, newTerms);
}
