-- MusicOn — días de la semana en que el artista no atiende (recurrente)
-- 0 = domingo, 1 = lunes, ... 6 = sábado (igual que Date.getDay() en JS)
-- Correr en Supabase Dashboard → SQL Editor → Run

alter table artists
  add column if not exists weekly_off_days smallint[] not null default '{}';
