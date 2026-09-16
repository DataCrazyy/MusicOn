import { supabase } from './supabase';
import { formatPrice, computeEndTime } from './format';
import type { BookingWithArtist } from './bookings';

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

/**
 * Arma el texto del contrato digital con la estructura completa de 11 secciones,
 * a partir de los datos ya cargados de la solicitud — el cliente nunca tiene que
 * volver a escribirlos. El precio final es siempre bookings.total (el acordado
 * tras la negociación estructurada), nunca un valor tomado del chat.
 */
export function buildContractTerms(
  booking: BookingWithArtist,
  clientName: string,
  opts?: { originalProposedPrice?: number }
): string {
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

  return `CONTRATO DE PRESTACIÓN DE SERVICIO MUSICAL

1. IDENTIFICACIÓN DE LAS PARTES
Cliente: ${clientName}
Artista/Grupo: ${artist?.name ?? '—'}${artist?.members ? ` (${artist.members} integrante(s))` : ''}

2. OBJETO DEL CONTRATO
El artista se compromete a prestar un servicio de presentación musical en vivo para el
evento tipo "${booking.event_type}" del cliente, bajo las condiciones detalladas en este documento.

3. FECHA Y HORARIO
Fecha: ${booking.event_date}
Hora de inicio: ${booking.start_time ?? '—'}
Duración estimada: ${booking.duration_hours ? `${booking.duration_hours} horas` : '—'}
Hora estimada de finalización: ${endTime ?? '—'}

4. LUGAR
${locationParts.length > 0 ? locationParts.join(' — ') : '—'}

5. CANTIDAD DE PERSONAS
Integrantes del artista: ${artist?.members ?? '—'}
Asistentes estimados: ${booking.guest_range ?? '—'}

6. EQUIPAMIENTO
${equipmentList}

7. PRECIO
Precio publicado: ${formatPrice(publishedPrice)}
Precio originalmente solicitado: ${formatPrice(originalProposed)}
Precio final acordado: ${formatPrice(booking.total)}${negotiated ? ' (resultado de la negociación entre las partes)' : ''}
Otros costos: Ninguno
Total a pagar: ${formatPrice(booking.total)}

8. CONDICIONES DEL SERVICIO
${booking.notes?.trim() || 'Sin condiciones adicionales registradas.'}

9. CANCELACIONES
La cancelación se rige por las políticas generales de la plataforma MusicOn. Cualquier
cancelación debe comunicarse a la otra parte a través del chat de esta solicitud lo antes posible.

10. MODIFICACIONES
Una vez firmado por ambas partes, este contrato no puede editarse directamente. Cualquier
cambio debe solicitarse formalmente desde la plataforma ("Solicitar modificación del
contrato"), requiere la aprobación expresa de la otra parte, y genera una nueva versión de
este documento que ambas partes deben volver a firmar. Las versiones anteriores quedan
guardadas como historial y nunca se pierden.

11. ACEPTACIÓN Y FIRMAS
Este documento se genera automáticamente a partir de los datos estructurados de la
solicitud. La aceptación se registra mediante la firma digital de cada parte dentro de la
plataforma (nombre completo, fecha y hora de la firma), visibles en la sección de firmas
de esta pantalla.`;
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
/** Antes de que nadie haya firmado, es seguro mantener el texto del contrato
 * sincronizado con los datos vigentes de la reserva (p. ej. tras una negociación). */
export async function updateContractTerms(contractId: string, terms: string): Promise<Contract> {
  const { data, error } = await supabase.from('contracts').update({ terms }).eq('id', contractId).select().single();
  if (error) throw error;
  return data as Contract;
}

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
