-- Little Jazz Room — Phase 2 core schema (team beta)
-- Apply with Supabase CLI: supabase db push  OR paste in SQL Editor in order.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.visibility as enum ('private', 'public', 'unlisted');
exception
  when duplicate_object then null;
end $$;

-- Profiles (one row per auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  cat_id text not null default 'luna'
    check (cat_id in ('luna', 'milo', 'maple', 'mochi', 'pepper', 'patches', 'chai', 'biscuit')),
  practice_milestone_minutes integer not null default 300 check (practice_milestone_minutes between 30 and 10000),
  gentle_motion_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  category text not null default 'Technique',
  level text not null default 'Beginner',
  duration_minutes integer not null check (duration_minutes > 0),
  instructions text not null check (char_length(trim(instructions)) > 0),
  suggested_material text not null default '',
  applicable_instruments text[] not null default array['All'],
  suggested_bpm integer,
  chart_id text,
  visibility public.visibility not null default 'private',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_exercises_owner_idx on public.user_exercises (owner_id);

create table if not exists public.user_routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  level text not null default 'Beginner',
  duration_minutes integer not null check (duration_minutes > 0),
  visibility public.visibility not null default 'private',
  applicable_instruments text[] not null default array['All'],
  share_token text unique,
  remixed_from_routine_id uuid references public.user_routines (id) on delete set null,
  remixed_from_owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint share_token_unlisted_only check (
    (visibility = 'unlisted' and share_token is not null)
    or (visibility <> 'unlisted' and share_token is null)
  )
);

create index if not exists user_routines_owner_idx on public.user_routines (owner_id);
create index if not exists user_routines_visibility_idx on public.user_routines (visibility);

create table if not exists public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.user_routines (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  snapshot_title text not null,
  snapshot_instructions text not null,
  snapshot_duration_minutes integer not null check (snapshot_duration_minutes > 0),
  snapshot_chart_id text,
  source_exercise_id uuid references public.user_exercises (id) on delete set null,
  seed_exercise_id text,
  unique (routine_id, sort_order)
);

create index if not exists routine_steps_routine_idx on public.routine_steps (routine_id);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  duration_seconds integer not null check (duration_seconds >= 0),
  routine_id uuid references public.user_routines (id) on delete set null,
  exercise_ref text,
  finished_at timestamptz not null default timezone('utc', now())
);

create index if not exists practice_sessions_owner_idx on public.practice_sessions (owner_id);

-- Metadata only in Phase 2 (no bundled recordings)
create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled recording',
  storage_path text,
  notes text not null default '',
  visibility public.visibility not null default 'private',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audio_assets_owner_idx on public.audio_assets (owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_exercises_set_updated_at on public.user_exercises;
create trigger user_exercises_set_updated_at
before update on public.user_exercises
for each row execute function public.set_updated_at();

drop trigger if exists user_routines_set_updated_at on public.user_routines;
create trigger user_routines_set_updated_at
before update on public.user_routines
for each row execute function public.set_updated_at();

-- Auto profile on team account creation (dashboard or admin script)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

grant usage on schema public to postgres, anon, authenticated, service_role;
