-- MusicOn — fechas no disponibles del artista (calendario estilo Airbnb)
-- Correr en Supabase Dashboard → SQL Editor → Run

alter table artists
  add column if not exists blocked_dates date[] not null default '{}';
