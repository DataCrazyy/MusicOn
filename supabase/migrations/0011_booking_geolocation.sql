-- Geolocalización del lugar del evento (para mapa y futuro contrato digital).
alter table bookings add column if not exists event_lat double precision;
alter table bookings add column if not exists event_lng double precision;
