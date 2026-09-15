-- Onboarding: nickname + rol (cliente/artista) al primer ingreso.
-- Los usuarios existentes quedan marcados como ya "onboarded" para no interrumpirlos;
-- las cuentas nuevas (via el trigger handle_new_user) entran con onboarded = false.
alter table profiles add column if not exists onboarded boolean not null default true;
alter table profiles alter column onboarded set default false;
