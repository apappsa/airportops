-- AirportOps initial schema.
-- Apply in the Supabase SQL Editor after reviewing the project-specific policies.

create extension if not exists pgcrypto;

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Barcelona Operations Day',
  scenario text not null default 'normal',
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  simulated_time timestamptz not null default now(),
  game_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  flight_number text not null,
  airline text not null,
  origin text not null,
  destination text not null,
  direction text not null check (direction in ('arrival', 'departure')),
  scheduled_time text not null,
  estimated_time text not null,
  aircraft_type text not null,
  passengers integer not null default 0 check (passengers >= 0),
  terminal text,
  gate_id text,
  status text not null default 'Scheduled',
  delay_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  code text not null,
  terminal text not null,
  zone text,
  stand_type text not null check (stand_type in ('contact', 'remote')),
  max_aircraft_category text not null check (max_aircraft_category in ('C', 'D', 'E', 'F')),
  has_jet_bridge boolean not null default false,
  status text not null default 'Available',
  assigned_flight_id uuid references public.flights(id) on delete set null,
  unique (session_id, code)
);

create table if not exists public.turnarounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  flight_id uuid not null references public.flights(id) on delete cascade,
  task_name text not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'delayed', 'blocked')),
  progress integer not null default 0 check (progress between 0 and 100),
  started_at timestamptz,
  estimated_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  resource_type text not null,
  label text not null,
  status text not null default 'available',
  assigned_flight_id uuid references public.flights(id) on delete set null,
  available_at timestamptz
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists flights_session_time_idx on public.flights(session_id, scheduled_time);
create index if not exists gates_session_idx on public.gates(session_id);
create index if not exists turnarounds_session_flight_idx on public.turnarounds(session_id, flight_id);
create index if not exists resources_session_status_idx on public.resources(session_id, status);
create index if not exists incidents_session_status_idx on public.incidents(session_id, status);

alter table public.game_sessions enable row level security;
alter table public.flights enable row level security;
alter table public.gates enable row level security;
alter table public.turnarounds enable row level security;
alter table public.resources enable row level security;
alter table public.incidents enable row level security;

drop policy if exists "Owners manage their game sessions" on public.game_sessions;
create policy "Owners manage their game sessions" on public.game_sessions
for all to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- Child rows are accessible only when the referenced session belongs to the current user.
drop policy if exists "Owners manage session flights" on public.flights;
create policy "Owners manage session flights" on public.flights
for all to authenticated using (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
);

drop policy if exists "Owners manage session gates" on public.gates;
create policy "Owners manage session gates" on public.gates
for all to authenticated using (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
);

drop policy if exists "Owners manage session turnarounds" on public.turnarounds;
create policy "Owners manage session turnarounds" on public.turnarounds
for all to authenticated using (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
);

drop policy if exists "Owners manage session resources" on public.resources;
create policy "Owners manage session resources" on public.resources
for all to authenticated using (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
);

drop policy if exists "Owners manage session incidents" on public.incidents;
create policy "Owners manage session incidents" on public.incidents
for all to authenticated using (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
);
