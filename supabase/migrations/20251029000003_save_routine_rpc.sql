-- Atomic routine + step save (single transaction). Old steps remain if this function errors.
create or replace function public.save_user_routine_with_steps(
  p_routine jsonb,
  p_steps jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_owner uuid;
  v_vis public.visibility;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_routine is null or p_steps is null or jsonb_typeof(p_steps) <> 'array' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  v_id := coalesce(nullif(p_routine->>'id', '')::uuid, gen_random_uuid());
  v_vis := coalesce(nullif(p_routine->>'visibility', ''), 'private')::public.visibility;

  if nullif(p_routine->>'id', '') is not null then
    select owner_id into v_owner from public.user_routines where id = v_id;
    if not found then
      raise exception 'routine not found' using errcode = 'P0002';
    end if;
    if v_owner <> v_uid then
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;

  insert into public.user_routines (
    id,
    owner_id,
    title,
    description,
    level,
    duration_minutes,
    visibility,
    applicable_instruments
  )
  values (
    v_id,
    v_uid,
    coalesce(nullif(trim(p_routine->>'title'), ''), 'Untitled routine'),
    coalesce(p_routine->>'description', ''),
    coalesce(nullif(p_routine->>'level', ''), 'Beginner'),
    greatest(1, coalesce((p_routine->>'duration_minutes')::int, 1)),
    v_vis,
    coalesce(
      (
        select array_agg(value)
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(p_routine->'applicable_instruments') = 'array'
              then p_routine->'applicable_instruments'
            else '["All"]'::jsonb
          end
        ) as t(value)
      ),
      array['All']
    )
  )
  on conflict (id) do update
  set
    title = excluded.title,
    description = excluded.description,
    level = excluded.level,
    duration_minutes = excluded.duration_minutes,
    visibility = excluded.visibility,
    applicable_instruments = excluded.applicable_instruments,
    updated_at = timezone('utc', now())
  where public.user_routines.owner_id = v_uid;

  delete from public.routine_steps where routine_id = v_id;

  insert into public.routine_steps (
    routine_id,
    sort_order,
    snapshot_title,
    snapshot_instructions,
    snapshot_duration_minutes,
    snapshot_chart_id,
    seed_exercise_id,
    source_exercise_id
  )
  select
    v_id,
    (elem->>'sort_order')::int,
    coalesce(elem->>'snapshot_title', 'Exercise'),
    coalesce(elem->>'snapshot_instructions', ''),
    greatest(1, coalesce((elem->>'snapshot_duration_minutes')::int, 1)),
    nullif(elem->>'snapshot_chart_id', ''),
    nullif(elem->>'seed_exercise_id', ''),
    nullif(elem->>'source_exercise_id', '')::uuid
  from jsonb_array_elements(p_steps) as elem;

  return jsonb_build_object('id', v_id);
end;
$$;

revoke all on function public.save_user_routine_with_steps(jsonb, jsonb) from public;
grant execute on function public.save_user_routine_with_steps(jsonb, jsonb) to authenticated;
