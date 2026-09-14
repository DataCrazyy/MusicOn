-- MusicOn — esquema inicial
-- Correr esto en Supabase Dashboard → SQL Editor → New query → Run
-- Proyecto: zljwkwkkbonnpqizhiar

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extiende auth.users con rol: client / artist)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('client', 'artist', 'admin')),
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: cualquiera puede ver perfiles públicos"
  on profiles for select
  using (true);

create policy "profiles: el usuario edita solo su propio perfil"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles: el usuario crea solo su propio perfil"
  on profiles for insert
  with check (auth.uid() = id);

-- Crea el profile automáticamente cuando alguien se registra
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ARTISTS
-- ============================================================
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  genre text not null,
  city text not null,
  bio text,
  photo_url text,
  price_from numeric(10,2) not null,
  price_per text not null check (price_per in ('hour', 'event')),
  verified boolean not null default false,
  pro_tier boolean not null default false,
  members int not null default 1,
  travel_radius_km int not null default 50,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

alter table artists enable row level security;

create policy "artists: visibles para todos"
  on artists for select
  using (true);

create policy "artists: el dueño puede editar su propio perfil de artista"
  on artists for update
  using (auth.uid() = owner_id);

create policy "artists: el dueño puede crear su propio perfil de artista"
  on artists for insert
  with check (auth.uid() = owner_id);

-- El flag "verified" solo lo puede tocar un admin (ver policy aparte más abajo si se agrega panel admin).
-- Para MVP: revocar el update de esa columna vía función/trigger si hace falta más adelante.

-- ============================================================
-- BOOKINGS
-- ============================================================
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete restrict,
  event_type text not null,
  event_date date not null,
  start_time time,
  duration_hours int,
  venue text,
  notes text,
  extras jsonb not null default '[]',       -- [{ id, label, price }]
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  commission numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_escrow', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;

create policy "bookings: el cliente ve las suyas"
  on bookings for select
  using (auth.uid() = client_id);

create policy "bookings: el artista ve las que le hicieron a él"
  on bookings for select
  using (auth.uid() in (select owner_id from artists where artists.id = bookings.artist_id));

create policy "bookings: el cliente crea las suyas"
  on bookings for insert
  with check (auth.uid() = client_id);

create policy "bookings: el cliente o el artista dueño pueden actualizar status"
  on bookings for update
  using (
    auth.uid() = client_id
    or auth.uid() in (select owner_id from artists where artists.id = bookings.artist_id)
  );

-- ============================================================
-- PAYMENTS (registro de los movimientos de Stripe; el dinero real lo mueve Stripe)
-- ============================================================
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  stripe_payment_intent_id text,
  amount numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'authorized', 'captured', 'released', 'refunded', 'failed')),
  held_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "payments: el cliente ve los pagos de sus bookings"
  on payments for select
  using (auth.uid() in (select client_id from bookings where bookings.id = payments.booking_id));

create policy "payments: el artista ve los pagos de sus bookings"
  on payments for select
  using (
    auth.uid() in (
      select owner_id from artists
      join bookings on bookings.artist_id = artists.id
      where bookings.id = payments.booking_id
    )
  );

-- Los inserts/updates de payments los hace el backend (Edge Function) con la service_role key,
-- nunca el cliente directo, por eso no hay policy de insert/update para usuarios normales.

-- ============================================================
-- CONTRACTS (contrato digital + firma)
-- ============================================================
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  terms text not null,
  client_signature_url text,
  artist_signature_url text,
  client_signed_at timestamptz,
  artist_signed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table contracts enable row level security;

create policy "contracts: cliente y artista del booking pueden ver el contrato"
  on contracts for select
  using (
    auth.uid() in (select client_id from bookings where bookings.id = contracts.booking_id)
    or auth.uid() in (
      select owner_id from artists
      join bookings on bookings.artist_id = artists.id
      where bookings.id = contracts.booking_id
    )
  );

create policy "contracts: cliente y artista del booking pueden firmar (update)"
  on contracts for update
  using (
    auth.uid() in (select client_id from bookings where bookings.id = contracts.booking_id)
    or auth.uid() in (
      select owner_id from artists
      join bookings on bookings.artist_id = artists.id
      where bookings.id = contracts.booking_id
    )
  );

-- ============================================================
-- REVIEWS ("solo quien reservó puede reseñar" — se fuerza con este check)
-- ============================================================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "reviews: visibles para todos"
  on reviews for select
  using (true);

-- La clave de "reseña verificada": solo se puede insertar una review
-- si el booking referenciado existe, es del mismo cliente, y ya está 'completed'.
create policy "reviews: solo el cliente de un booking completado puede reseñar"
  on reviews for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from bookings
      where bookings.id = booking_id
        and bookings.client_id = auth.uid()
        and bookings.status = 'completed'
    )
  );

-- ============================================================
-- MESSAGES (chat entre cliente y artista, por booking)
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "messages: remitente o destinatario pueden ver"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "messages: el remitente puede enviar como sí mismo"
  on messages for insert
  with check (auth.uid() = sender_id);

create policy "messages: el destinatario puede marcar como leído"
  on messages for update
  using (auth.uid() = recipient_id);

-- Habilitar Realtime en esta tabla para el chat en vivo:
-- Supabase Dashboard → Database → Replication → activar "messages"

-- ============================================================
-- REFERRALS
-- ============================================================
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_email text not null,
  status text not null default 'registrado'
    check (status in ('registrado', 'primer_booking', 'credito_ganado')),
  amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table referrals enable row level security;

create policy "referrals: el usuario ve solo los suyos"
  on referrals for select
  using (auth.uid() = referrer_id);

create policy "referrals: el usuario crea solo los suyos"
  on referrals for insert
  with check (auth.uid() = referrer_id);

-- ============================================================
-- INDEXES útiles
-- ============================================================
create index if not exists idx_bookings_client on bookings(client_id);
create index if not exists idx_bookings_artist on bookings(artist_id);
create index if not exists idx_messages_booking on messages(booking_id);
create index if not exists idx_reviews_artist on reviews(artist_id);
