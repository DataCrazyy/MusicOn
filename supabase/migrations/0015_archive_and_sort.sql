-- Batch E: archivar solicitudes/reservas (por cada lado, independiente uno del
-- otro) para poder limpiar Solicitudes y Chat sin afectar lo que ve la otra parte.

alter table bookings add column if not exists archived_by_client boolean not null default false;
alter table bookings add column if not exists archived_by_artist boolean not null default false;
