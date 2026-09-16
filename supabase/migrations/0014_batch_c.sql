-- Batch C: validación de duración a nivel de base de datos, negociación por
-- propuestas versionadas (una sola transacción por propuesta) y notificaciones.

-- 50. La duración en horas nunca puede ser negativa ni cero, en ningún lado de la
-- app. Se valida también en el frontend, pero la regla real vive aquí.
alter table bookings
  add constraint bookings_duration_hours_positive
  check (duration_hours is null or duration_hours > 0);

alter table artists
  add constraint artists_duration_hours_positive
  check (duration_hours is null or duration_hours > 0);

-- 51. El equipamiento pasa a ser negociable por reserva (independiente del listado
-- de equipamiento por defecto del perfil del artista, en artists.equipment).
alter table bookings add column if not exists equipment text;

-- 51/54. Se amplía el set de valores permitidos en booking_negotiation_events.field:
-- 'proposal' es una propuesta en bloque (varios campos a la vez, ver 54) y
-- 'equipment' es el nuevo campo negociable. Los valores antiguos (venue, event_date,
-- guest_range) se mantienen en el check por compatibilidad con filas históricas,
-- pero la aplicación ya no los usa: la ubicación y la fecha del evento dejan de ser
-- negociables (51).
alter table booking_negotiation_events drop constraint if exists booking_negotiation_events_field_check;
alter table booking_negotiation_events
  add constraint booking_negotiation_events_field_check
  check (field in ('proposal', 'price', 'event_date', 'start_time', 'duration_hours', 'venue', 'guest_range', 'notes', 'equipment'));

-- 54. Cada propuesta en bloque tiene un número de versión secuencial por reserva
-- (ej. "Propuesta #2"), para comparar la propuesta nueva contra la anterior como un
-- todo en vez de campo por campo.
alter table booking_negotiation_events add column if not exists proposal_number integer;

-- 55/56. Centro de notificaciones: un evento por usuario, con tipo, mensaje y un
-- enlace directo al contexto relevante (chat, solicitud, contrato o pago).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on notifications (user_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications: cada usuario ve solo las suyas"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: cada usuario marca como leídas solo las suyas"
  on notifications for update
  using (auth.uid() = user_id);

-- Las notificaciones las inserta la propia app (con el usuario autenticado como
-- destinatario en la mayoría de los casos, o el de la otra parte de la reserva).
create policy "notifications: se pueden crear para cualquiera de las partes de la reserva"
  on notifications for insert
  with check (
    user_id = auth.uid()
    or booking_id in (
      select id from bookings where client_id = auth.uid()
      union
      select bookings.id from bookings
      join artists on artists.id = bookings.artist_id
      where artists.owner_id = auth.uid()
    )
  );
