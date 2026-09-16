-- Equipamiento del artista (checklist + "otro" en texto libre) y redes sociales del perfil.
alter table artists add column if not exists equipment text[] not null default '{}';
alter table artists add column if not exists equipment_other text;
alter table artists add column if not exists instagram_url text;
alter table artists add column if not exists tiktok_url text;
alter table artists add column if not exists facebook_url text;
