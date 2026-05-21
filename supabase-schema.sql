-- ============================================================
-- DermaFlow CRM — Schema para Supabase
-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensión UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: centers (centros de micropigmentación)
-- ============================================================
create table if not exists public.centers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  address     text,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: clients (clientas)
-- ============================================================
create table if not exists public.clients (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  center_id       uuid references public.centers(id) on delete set null,
  full_name       text not null,
  email           text,
  phone           text,
  dni             text,
  birth_date      date,
  treatment_type  text check (treatment_type in ('cejas','labios','eyeliner','areola','capilar','otro')),
  notes           text,
  consent_signed  boolean default false,
  consent_date    timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================
-- TABLA: consent_forms (formularios de consentimiento)
-- ============================================================
create table if not exists public.consent_forms (
  id                          uuid primary key default uuid_generate_v4(),
  user_id                     uuid references auth.users(id) on delete cascade not null,
  client_id                   uuid references public.clients(id) on delete cascade not null,
  center_id                   uuid references public.centers(id) on delete set null,
  token                       text unique not null,
  -- Datos personales (rellenados por la clienta o pre-rellenados por admin)
  client_name                 text,
  client_dni                  text,
  client_email                text,
  client_phone                text,
  client_birth_date           date,
  client_address              text,
  treatment_type              text,
  -- Información médica
  allergies                   text,
  medical_conditions          text,
  medications                 text,
  pregnant_or_breastfeeding   boolean default false,
  previous_treatments         boolean default false,
  previous_treatments_details text,
  -- Firma y estado
  signature_data              text,
  signed                      boolean default false,
  signed_date                 timestamptz,
  created_at                  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.centers       enable row level security;
alter table public.clients       enable row level security;
alter table public.consent_forms enable row level security;

-- Solo el propietario puede gestionar sus centros
create policy "owners_centers" on public.centers
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Solo el propietario puede gestionar sus clientas
create policy "owners_clients" on public.clients
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Solo el propietario puede gestionar sus consentimientos
create policy "owners_consents" on public.consent_forms
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Cualquiera (anon) puede leer un consentimiento (para mostrar el formulario público)
create policy "public_read_consents" on public.consent_forms
  for select to anon using (true);

-- Cualquiera (anon) puede actualizar un consentimiento NO firmado (para que la clienta lo firme)
create policy "public_sign_consents" on public.consent_forms
  for update to anon
  using (signed = false)
  with check (true);

-- ============================================================
-- TRIGGER: cuando se firma un consentimiento, actualizar la clienta
-- ============================================================
create or replace function public.handle_consent_signed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.signed = true and (old.signed = false or old.signed is null) then
    update public.clients
    set
      consent_signed = true,
      consent_date   = new.signed_date
    where id = new.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_consent_form_signed on public.consent_forms;
create trigger on_consent_form_signed
  after update on public.consent_forms
  for each row
  execute procedure public.handle_consent_signed();

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================
create index if not exists idx_centers_user_id      on public.centers(user_id);
create index if not exists idx_clients_user_id       on public.clients(user_id);
create index if not exists idx_clients_center_id     on public.clients(center_id);
create index if not exists idx_consents_user_id      on public.consent_forms(user_id);
create index if not exists idx_consents_client_id    on public.consent_forms(client_id);
create index if not exists idx_consents_token        on public.consent_forms(token);
