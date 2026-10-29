-- Row Level Security — fail closed; explicit public reads only where noted.

alter table public.profiles enable row level security;
alter table public.user_exercises enable row level security;
alter table public.user_routines enable row level security;
alter table public.routine_steps enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.audio_assets enable row level security;

-- Profiles: self only
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Exercises: owner CRUD; no anonymous access
drop policy if exists user_exercises_owner_all on public.user_exercises;
create policy user_exercises_owner_all on public.user_exercises
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Routines: owner full access; others may read public only
drop policy if exists user_routines_owner_all on public.user_routines;
create policy user_routines_owner_all on public.user_routines
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists user_routines_select_public on public.user_routines;
create policy user_routines_select_public on public.user_routines
  for select to authenticated, anon
  using (visibility = 'public');

-- Unlisted: no direct anon/authenticated SELECT by id (Phase 3 token RPC only)
-- Private rows never match public policy.

-- Steps: readable when parent routine is readable; writable when owner of parent
drop policy if exists routine_steps_select on public.routine_steps;
create policy routine_steps_select on public.routine_steps
  for select to authenticated, anon
  using (
    exists (
      select 1
      from public.user_routines r
      where r.id = routine_steps.routine_id
        and (r.visibility = 'public' or r.owner_id = auth.uid())
    )
  );

drop policy if exists routine_steps_owner_write on public.routine_steps;
create policy routine_steps_owner_write on public.routine_steps
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_routines r
      where r.id = routine_steps.routine_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists routine_steps_owner_update on public.routine_steps;
create policy routine_steps_owner_update on public.routine_steps
  for update to authenticated
  using (
    exists (
      select 1 from public.user_routines r
      where r.id = routine_steps.routine_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_routines r
      where r.id = routine_steps.routine_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists routine_steps_owner_delete on public.routine_steps;
create policy routine_steps_owner_delete on public.routine_steps
  for delete to authenticated
  using (
    exists (
      select 1 from public.user_routines r
      where r.id = routine_steps.routine_id and r.owner_id = auth.uid()
    )
  );

-- Practice sessions: owner only
drop policy if exists practice_sessions_owner_all on public.practice_sessions;
create policy practice_sessions_owner_all on public.practice_sessions
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Audio metadata: owner only (Phase 2)
drop policy if exists audio_assets_owner_all on public.audio_assets;
create policy audio_assets_owner_all on public.audio_assets
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Table grants (RLS still applies)
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_exercises to authenticated;
grant select, insert, update, delete on public.user_routines to authenticated;
grant select, insert, update, delete on public.routine_steps to authenticated;
grant select, insert, update, delete on public.practice_sessions to authenticated;
grant select, insert, update, delete on public.audio_assets to authenticated;

grant select on public.user_routines to anon;
grant select on public.routine_steps to anon;
