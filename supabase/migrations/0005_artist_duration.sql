-- MusicOn — duración estimada del show, para cuando el precio es por hora
-- Correr en Supabase Dashboard → SQL Editor → Run

alter table artists
  add column if not exists duration_hours numeric;
