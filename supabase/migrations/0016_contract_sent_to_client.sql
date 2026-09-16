-- Envio explicito del contrato del artista al cliente: el artista firma, y
-- recien cuando aprieta "Enviar contrato al cliente" el cliente puede verlo/
-- firmarlo -- en vez de que se le habilite solo con la firma del artista.
alter table contracts add column if not exists sent_to_client boolean not null default false;
