import { supabase } from './supabase';

export type Review = {
  id: string;
  booking_id: string;
  artist_id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  created_at: string;
  client: { full_name: string | null } | null;
};

export type RatingSummary = { avg: number; count: number };

export async function getReviewByBooking(bookingId: string): Promise<Review | null> {
  const { data, error } = await supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle();
  if (error) throw error;
  return data as Review | null;
}

export async function listReviewsByClient(clientId: string): Promise<Review[]> {
  const { data, error } = await supabase.from('reviews').select('*').eq('client_id', clientId);
  if (error) throw error;
  return data as unknown as Review[];
}

export async function listReviewsForArtist(artistId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, client:profiles(full_name)')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as Review[];
}

export async function createReview(input: {
  bookingId: string;
  artistId: string;
  clientId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    booking_id: input.bookingId,
    artist_id: input.artistId,
    client_id: input.clientId,
    rating: input.rating,
    comment: input.comment,
  });
  if (error) throw error;
}

/** Trae rating promedio y cantidad de reseñas para todos los artistas de una sola vez (para Explorar). */
export async function getAllArtistRatings(): Promise<Record<string, RatingSummary>> {
  const { data, error } = await supabase.from('reviews').select('artist_id, rating');
  if (error) throw error;

  const byArtist: Record<string, number[]> = {};
  for (const row of data ?? []) {
    const r = row as { artist_id: string; rating: number };
    (byArtist[r.artist_id] ??= []).push(r.rating);
  }

  const summary: Record<string, RatingSummary> = {};
  for (const [artistId, ratings] of Object.entries(byArtist)) {
    summary[artistId] = {
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      count: ratings.length,
    };
  }
  return summary;
}
