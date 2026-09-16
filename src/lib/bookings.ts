import { supabase } from './supabase';

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
  total: number;
  status: BookingStatus;
  created_at: string;
  artist: { name: string; photo_url: string | null; owner_id: string | null } | null;
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
  total: number;
  status: BookingStatus;
  created_at: string;
  client: { full_name: string | null } | null;
};

export type NewBookingInput = {
  event_type: string;
  event_date: string;
  start_time: string;
  venue: string;
  event_lat: number | null;
  event_lng: number | null;
  guest_range: string;
  notes: string;
};

export async function createBookingRequest(
  clientId: string,
  artistId: string,
  referencePrice: number,
  input: NewBookingInput
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
      event_lat: input.event_lat,
      event_lng: input.event_lng,
      guest_range: input.guest_range,
      notes: input.notes,
      subtotal: referencePrice,
      total: referencePrice,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listBookingsAsClient(clientId: string): Promise<BookingWithArtist[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artist:artists(name, photo_url, owner_id)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as BookingWithArtist[];
}

export async function listBookingsForArtist(artistId: string): Promise<BookingWithClient[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, client:profiles(full_name)')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as BookingWithClient[];
}

export async function respondToBooking(
  bookingId: string,
  status: BookingStatus,
  artistResponse?: string
) {
  const { error } = await supabase
    .from('bookings')
    .update({ status, artist_response: artistResponse || null })
    .eq('id', bookingId);
  if (error) throw error;
}
