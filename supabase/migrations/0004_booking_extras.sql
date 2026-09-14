-- MusicOn — campos extra para la solicitud de booking
-- Correr en Supabase Dashboard → SQL Editor → Run

alter table bookings
  add column if not exists guest_range text,
  add column if not exists artist_response text;
