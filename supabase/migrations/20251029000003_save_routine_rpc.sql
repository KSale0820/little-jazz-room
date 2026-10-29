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
  v_title text;
  v_description text;
  v_level text;
  v_duration integer;
  v_instruments text[];
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_routine is null or p_steps is null or jsonb_typeof(p_steps) <> 'array' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  v_id := coalesce(nullif(p_routine->>'id', '')::uuid, gen_random_uuid());
  v_vis := coalesce(nullif(p_routine->>'visibility', ''), 'private')::public.visibility;
  v_title := coalesce(nullif(trim(p_routine->>'title'), ''), 'Untitled routine');
  v_description := coalesce(p_routine->>'description', '');
  v_level := coalesce(nullif(p_routine->>'level', ''), 'Beginner');
  v_duration := greatest(1, coalesce((p_routine->>'duration_minutes')::int, 1));
  v_instruments := coalesce(
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
  );

  select owner_id into v_owner from public.user_routines where id = v_id;
  if found then
    if v_owner <> v_uid then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    update public.user_routines
    set
      title = v_title,
      description = v_description,
      level = v_level,
      duration_minutes = v_duration,
      visibility = v_vis,
      applicable_instruments = v_instruments,
      updated_at = timezone('utc', now())
    where id = v_id and owner_id = v_uid;
  else
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
      v_title,
      v_description,
      v_level,
      v_duration,
      v_vis,
      v_instruments
    );
  end if;

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
