-- Fuente de verdad estructurada para todo lo que se negocia en una solicitud.
-- El chat (tabla messages) sigue siendo solo conversación; ningún dato del
-- contrato se toma jamás de un mensaje de texto — siempre de bookings o de
-- esta tabla de eventos de negociación.

create table if not exists booking_negotiation_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  field text not null check (
    field in ('price', 'event_date', 'start_time', 'duration_hours', 'venue', 'guest_range', 'notes')
  ),
  old_value text,
  new_value text not null,
  message text,
  proposed_by uuid not null references profiles(id),
  proposed_role text not null check (proposed_role in ('client', 'artist')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'superseded')),
  after_signature boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table booking_negotiation_events enable row level security;

create policy "negotiation: cliente o artista del booking pueden ver los eventos"
  on booking_negotiation_events for select
  using (
    auth.uid() in (select client_id from bookings where bookings.id = booking_negotiation_events.booking_id)
    or auth.uid() in (
      select owner_id from artists
      join bookings on bookings.artist_id = artists.id
      where bookings.id = booking_negotiation_events.booking_id
    )
  );

create policy "negotiation: cliente o artista del booking pueden proponer cambios"
  on booking_negotiation_events for insert
  with check (
    auth.uid() = proposed_by
    and (
      auth.uid() in (select client_id from bookings where bookings.id = booking_negotiation_events.booking_id)
      or auth.uid() in (
        select owner_id from artists
        join bookings on bookings.artist_id = artists.id
        where bookings.id = booking_negotiation_events.booking_id
      )
    )
  );

create policy "negotiation: cliente o artista del booking pueden resolver eventos"
  on booking_negotiation_events for update
  using (
    auth.uid() in (select client_id from bookings where bookings.id = booking_negotiation_events.booking_id)
    or auth.uid() in (
      select owner_id from artists
      join bookings on bookings.artist_id = artists.id
      where bookings.id = booking_negotiation_events.booking_id
    )
  );

-- Referencia adicional del lugar (ej. "Condominio Las Palmas, bloque B, salón de eventos").
alter table bookings add column if not exists venue_reference text;

-- Versionado simple del contrato: se incrementa cada vez que se aprueba una
-- modificación después de que ambas partes ya habían firmado. Las versiones
-- reemplazadas se guardan completas en previous_versions, nunca se pierden.
alter table contracts add column if not exists version integer not null default 1;
alter table contracts add column if not exists previous_versions jsonb not null default '[]';
