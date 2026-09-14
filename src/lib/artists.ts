import { supabase } from './supabase';

export type DbArtist = {
  id: string;
  owner_id: string | null;
  name: string;
  genre: string;
  city: string;
  bio: string | null;
  photo_url: string | null;
  price_from: number;
  price_per: 'hour' | 'event';
  duration_hours: number | null;
  verified: boolean;
  pro_tier: boolean;
  members: number;
  travel_radius_km: number;
  tags: string[];
  blocked_dates: string[];
  weekly_off_days: number[];
  gallery_urls: string[];
  spotify_url: string | null;
  youtube_url: string | null;
  created_at: string;
};

export type ArtistInput = {
  name: string;
  genre: string;
  city: string;
  bio: string;
  photo_url: string;
  price_from: number;
  price_per: 'hour' | 'event';
  duration_hours: number | null;
  members: number;
  travel_radius_km: number;
  tags: string[];
  blocked_dates: string[];
  weekly_off_days: number[];
  gallery_urls: string[];
  spotify_url: string;
  youtube_url: string;
};

export async function listArtists(): Promise<DbArtist[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DbArtist[];
}

export async function getArtistById(id: string): Promise<DbArtist | null> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DbArtist | null;
}

export async function getArtistByOwner(ownerId: string): Promise<DbArtist | null> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data as DbArtist | null;
}

export async function createArtist(ownerId: string, input: ArtistInput): Promise<DbArtist> {
  // Por si el trigger que crea el profile al registrarse no llegó a correr para este usuario,
  // nos aseguramos de que exista antes de insertar el artista (si ya existe, no lo toca).
  await supabase.from('profiles').upsert({ id: ownerId }, { onConflict: 'id', ignoreDuplicates: true });

  const { data, error } = await supabase
    .from('artists')
    .insert({ owner_id: ownerId, ...input })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('profiles').update({ role: 'artist' }).eq('id', ownerId);

  return data as DbArtist;
}

export async function updateArtist(artistId: string, input: ArtistInput): Promise<DbArtist> {
  const { data, error } = await supabase
    .from('artists')
    .update(input)
    .eq('id', artistId)
    .select()
    .single();

  if (error) throw error;
  return data as DbArtist;
}

export async function addBlockedDate(artistId: string, dateStr: string): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('artists')
    .select('blocked_dates')
    .eq('id', artistId)
    .single();

  if (fetchError) throw fetchError;

  const existing: string[] = (current?.blocked_dates as string[]) ?? [];
  if (existing.includes(dateStr)) return;

  const { error } = await supabase
    .from('artists')
    .update({ blocked_dates: [...existing, dateStr].sort() })
    .eq('id', artistId);

  if (error) throw error;
}

export async function uploadArtistPhoto(ownerId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${ownerId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('artist-photos')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('artist-photos').getPublicUrl(path);
  return data.publicUrl;
}
