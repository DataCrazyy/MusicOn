import { supabase } from './supabase';
import { createNotification } from './notifications';

export type BookingStatus = 'pending' | 'confirmed' | 'in_escrow' | 'completed' | 'cancelled';

export type BookingWithArtist = {
  id: string;
  client_id: string;
  artist_id: string;
  event_type: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
  guest_range: string | null;
  notes: string | null;
  artist_response: string | null;
  subtotal: number;
  total: number;
  status: BookingStatus;
  event_lat: number | null;
  event_lng: number | null;
  venue_reference: string | null;
  duration_hours: number | null;
  /** Equipamiento negociado para esta reserva puntual (distinto del listado por
   * defecto del perfil del artista) — se define/ajusta desde el panel de negociación. */
  equipment: string | null;
  paid_at: string | null;
  created_at: string;
  archived_by_client: boolean;
  archived_by_artist: boolean;
  artist: {
    name: string;
    photo_url: string | null;
    owner_id: string | null;
    city?: string;
    genre?: string;
    members?: number;
    equipment?: string[];
    equipment_other?: string | null;
    price_from?: number;
    price_per?: 'hour' | 'event';
  } | null;
  client?: { full_name: string | null } | null;
};

export type BookingWithClient = {
  id: string;
  client_id: string;
  artist_id: string;
  event_type: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
  guest_range: string | null;
  notes: string | null;
  artist_response: string | null;
  subtotal: number;
  total: number;
  status: BookingStatus;
  venue_reference: string | null;
  duration_hours: number | null;
  equipment: string | null;
  created_at: string;
  archived_by_client: boolean;
  archived_by_artist: boolean;
  client: { full_name: string | null } | null;
};

export type NewBookingInput = {
  event_type: string;
  event_date: string;
  start_time: string;
  venue: string;
  venue_reference: string;
  event_lat: number | null;
  event_lng: number | null;
  /** Duración estimada del show en horas — solo se pide cuando aplica al tipo de evento. */
  duration_hours: number | null;
  guest_range: string;
  notes: string;
};

export async function createBookingRequest(
  clientId: string,
  artistId: string,
  referencePrice: number,
  input: NewBookingInput,
  artistOwnerId?: string | null
) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      client_id: clientId,
      artist_id: artistId,
      event_type: input.event_type,
      event_date: input.event_date,
      start_time: input.start_time,
      venue: input.venue,
      venue_reference: input.venue_reference || null,
      event_lat: input.event_lat,
      event_lng: input.event_lng,
      duration_hours: input.duration_hours,
      guest_range: input.guest_range,
      notes: input.notes,
      subtotal: referencePrice,
      total: referencePrice,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  if (artistOwnerId) {
    await createNotification({
      userId: artistOwnerId,
      bookingId: data.id,
      type: 'request_received',
      message: 'Recibiste una nueva solicitud.',
      link: `/chat?b=${data.id}`,
    });
  }

  return data;
}

export async function getBookingById(bookingId: string): Promise<BookingWithArtist> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      '*, artist:artists(name, photo_url, owner_id, city, genre, members, equipment, equipment_other, price_from, price_per), client:profiles(full_name)'
    )
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data as unknown as BookingWithArtist;
}

export async function listBookingsAsClient(clientId: string): Promise<BookingWithArtist[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artist:artists(name, photo_url, owner_id)')
    .eq('client_id', clientId)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data as unknown as BookingWithArtist[];
}

export async function listBookingsForArtist(artistId: string): Promise<BookingWithClient[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, client:profiles(full_name)')
    .eq('artist_id', artistId)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data as unknown as BookingWithClient[];
}

export async function markBookingCompleted(bookingId: string, clientId?: string | null) {
  const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
  if (error) throw error;

  if (clientId) {
    await createNotification({
      userId: clientId,
      bookingId,
      type: 'service_completed',
      message: 'Tu servicio fue marcado como realizado. Ya puedes dejar una reseña.',
      link: `/solicitudes`,
    });
  }
}

export async function respondToBooking(
  bookingId: string,
  status: BookingStatus,
  artistResponse?: string,
  clientId?: string | null
) {
  const { error } = await supabase
    .from('bookings')
    .update({ status, artist_response: artistResponse || null })
    .eq('id', bookingId);
  if (error) throw error;

  if (clientId) {
    await createNotification({
      userId: clientId,
      bookingId,
      type: 'request_responded',
      message:
        status === 'confirmed'
          ? 'El artista respondió a tu solicitud: la aceptó.'
          : 'El artista respondió a tu solicitud: la rechazó.',
      link: `/chat?b=${bookingId}`,
    });
  }
}

/** Archivar/desarchivar una solicitud o reserva -- es independiente por lado: el
 * cliente puede archivarla de su vista sin afectar lo que ve el artista, y
 * viceversa. Sirve para limpiar Solicitudes y Chat sin perder el historial. */
export async function setBookingArchived(bookingId: string, role: 'client' | 'artist', archived: boolean) {
  const column = role === 'client' ? 'archived_by_client' : 'archived_by_artist';
  const { error } = await supabase.from('bookings').update({ [column]: archived }).eq('id', bookingId);
  if (error) throw error;
}
