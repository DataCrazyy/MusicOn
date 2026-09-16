-- Las modificaciones posteriores a la firma ahora se piden en bloque (precio,
-- duracion, horario, equipamiento, ubicacion, referencia y condiciones juntos en
-- una sola solicitud), no campo por campo -- nuevo valor 'modification' en el
-- check de booking_negotiation_events.field.
alter table booking_negotiation_events drop constraint if exists booking_negotiation_events_field_check;
alter table booking_negotiation_events
  add constraint booking_negotiation_events_field_check
  check (field in ('proposal', 'modification', 'price', 'event_date', 'start_time', 'duration_hours', 'venue', 'guest_range', 'notes', 'equipment'));
