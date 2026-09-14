-- MusicOn — bucket de Storage para fotos de artistas
-- Correr en Supabase Dashboard → SQL Editor → Run

insert into storage.buckets (id, name, public)
values ('artist-photos', 'artist-photos', true)
on conflict (id) do nothing;

-- Lectura pública (las fotos de artistas se muestran a cualquiera, logueado o no)
create policy "artist-photos: lectura publica"
on storage.objects for select
using (bucket_id = 'artist-photos');

-- Cada usuario solo puede subir dentro de su propia carpeta: artist-photos/<user_id>/...
create policy "artist-photos: usuario sube a su carpeta"
on storage.objects for insert
with check (
  bucket_id = 'artist-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "artist-photos: usuario actualiza su carpeta"
on storage.objects for update
using (
  bucket_id = 'artist-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "artist-photos: usuario borra su carpeta"
on storage.objects for delete
using (
  bucket_id = 'artist-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
