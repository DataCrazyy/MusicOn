-- MusicOn — galería de fotos y links de Spotify/YouTube en el perfil de artista
-- Correr en Supabase Dashboard → SQL Editor → Run

alter table artists
  add column if not exists gallery_urls text[] not null default '{}',
  add column if not exists spotify_url text,
  add column if not exists youtube_url text;
