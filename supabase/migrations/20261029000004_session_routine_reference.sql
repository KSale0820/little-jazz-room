-- Keep seed/local references and history labels without putting text IDs in a UUID FK.
-- Additive: legacy rows continue to fall back to routine_id when read.
alter table public.practice_sessions
  add column if not exists routine_ref text,
  add column if not exists routine_title text;

comment on column public.practice_sessions.routine_ref is
  'Original cloud UUID, seed ID, or device-local routine ID; retained after source deletion.';
comment on column public.practice_sessions.routine_title is
  'Routine title at completion, independent of subsequent source edits/deletion.';
