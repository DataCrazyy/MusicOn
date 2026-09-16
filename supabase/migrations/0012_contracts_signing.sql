-- Firma simple (nombre completo) del contrato digital y marca de pago (simulado en este MVP).
alter table contracts add column if not exists client_signed_name text;
alter table contracts add column if not exists artist_signed_name text;
alter table bookings add column if not exists paid_at timestamptz;

-- Faltaba la policy de insert: el cliente o el artista del booking deben poder
-- generar el contrato la primera vez que se abre "Confirmar contratación".
create policy "contracts: cliente o artista del booking pueden crear el contrato"
  on contracts for insert
  with check (
    auth.uid() in (select client_id from bookings where bookings.id = contracts.booking_id)
    or auth.uid() in (
      select owner_id from artists
      join bookings on bookings.artist_id = artists.id
      where bookings.id = contracts.booking_id
    )
  );
