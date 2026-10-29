import type { SupabaseClient } from '@supabase/supabase-js';
import type { Exercise, PracticeSessionRecord, Routine, RoutineStep } from '../types/content';

type DbRoutine = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  level: string;
  duration_minutes: number;
  visibility: string;
  applicable_instruments: string[];
  routine_steps: DbStep[] | null;
};

type DbStep = {
  sort_order: number;
  snapshot_title: string;
  snapshot_instructions: string;
  snapshot_duration_minutes: number;
  snapshot_chart_id: string | null;
  seed_exercise_id: string | null;
  source_exercise_id: string | null;
};

type DbExercise = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  level: string;
  duration_minutes: number;
  instructions: string;
  suggested_material: string;
  applicable_instruments: string[];
  suggested_bpm: number | null;
  chart_id: string | null;
  visibility: string;
};

type DbSession = {
  id: string;
  duration_seconds: number;
  routine_id: string | null;
  exercise_ref: string | null;
  finished_at: string;
};

function mapExercise(row: DbExercise): Exercise {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    level: row.level,
    duration_minutes: row.duration_minutes,
    instructions: row.instructions,
    suggested_material: row.suggested_material,
    suggested_bpm: row.suggested_bpm,
    audio_asset_id: null,
    visibility: row.visibility,
    chart_id: row.chart_id,
    applicable_instruments: row.applicable_instruments?.length ? row.applicable_instruments : ['All'],
    is_seed: false,
  };
}

function mapRoutine(row: DbRoutine): Routine {
  const steps: RoutineStep[] = (row.routine_steps ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(s => ({
      exercise_id: s.seed_exercise_id ?? s.source_exercise_id ?? `snapshot-${s.sort_order}`,
      duration_minutes: s.snapshot_duration_minutes,
      snapshot: {
        title: s.snapshot_title,
        instructions: s.snapshot_instructions,
        chart_id: s.snapshot_chart_id,
      },
    }));
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    level: row.level,
    duration_minutes: row.duration_minutes,
    visibility: row.visibility,
    applicable_instruments: row.applicable_instruments?.length ? row.applicable_instruments : ['All'],
    is_seed: false,
    steps,
  };
}

export class SupabasePracticeRepository {
  private client: SupabaseClient;
  private userId: string;

  constructor(client: SupabaseClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async listMyExercises(): Promise<Exercise[]> {
    const { data, error } = await this.client
      .from('user_exercises')
      .select('*')
      .eq('owner_id', this.userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbExercise[]).map(mapExercise);
  }

  async saveExercise(exercise: Exercise): Promise<Exercise> {
    const payload = {
      id: exercise.id.startsWith('local-') ? undefined : exercise.id,
      owner_id: this.userId,
      title: exercise.title,
      category: exercise.category,
      level: exercise.level,
      duration_minutes: exercise.duration_minutes,
      instructions: exercise.instructions,
      suggested_material: exercise.suggested_material,
      applicable_instruments: exercise.applicable_instruments,
      suggested_bpm: exercise.suggested_bpm,
      chart_id: exercise.chart_id,
      visibility: exercise.visibility.toLowerCase(),
    };
    const { data, error } = await this.client
      .from('user_exercises')
      .upsert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return mapExercise(data as DbExercise);
  }

  async listMyRoutines(): Promise<Routine[]> {
    const { data, error } = await this.client
      .from('user_routines')
      .select('*, routine_steps(*)')
      .eq('owner_id', this.userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbRoutine[]).map(mapRoutine);
  }

  async listPublicRoutines(): Promise<Routine[]> {
    const { data, error } = await this.client
      .from('user_routines')
      .select('*, routine_steps(*)')
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbRoutine[]).map(mapRoutine);
  }

  async saveRoutine(
    routine: Routine,
    stepSnapshots: {
      sort_order: number;
      snapshot_title: string;
      snapshot_instructions: string;
      snapshot_duration_minutes: number;
      snapshot_chart_id: string | null;
      seed_exercise_id: string | null;
      source_exercise_id: string | null;
    }[]
  ): Promise<Routine> {
    const vis = routine.visibility.toLowerCase();
    const routinePayload = {
      id: routine.id.startsWith('local-') ? null : routine.id,
      title: routine.title,
      description: routine.description ?? '',
      level: routine.level,
      duration_minutes: routine.duration_minutes,
      visibility: vis,
      applicable_instruments: routine.applicable_instruments,
    };
    const stepsPayload = stepSnapshots.map(s => ({
      sort_order: s.sort_order,
      snapshot_title: s.snapshot_title,
      snapshot_instructions: s.snapshot_instructions,
      snapshot_duration_minutes: s.snapshot_duration_minutes,
      snapshot_chart_id: s.snapshot_chart_id ?? '',
      seed_exercise_id: s.seed_exercise_id ?? '',
      source_exercise_id: s.source_exercise_id ?? '',
    }));

    const { data: rpcData, error: rpcErr } = await this.client.rpc('save_user_routine_with_steps', {
      p_routine: routinePayload,
      p_steps: stepsPayload,
    });
    if (rpcErr) throw rpcErr;
    const routineId = (rpcData as { id: string }).id;

    const { data, error } = await this.client
      .from('user_routines')
      .select('*, routine_steps(*)')
      .eq('id', routineId)
      .single();
    if (error) throw error;
    return mapRoutine(data as DbRoutine);
  }

  async listMySessions(): Promise<PracticeSessionRecord[]> {
    const { data, error } = await this.client
      .from('practice_sessions')
      .select('*')
      .eq('owner_id', this.userId)
      .order('finished_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data as DbSession[]).map(s => ({
      id: s.id,
      durationSeconds: s.duration_seconds,
      routineId: s.routine_id ?? undefined,
      exerciseId: s.exercise_ref ?? undefined,
      finishedAt: s.finished_at,
    }));
  }

  async addSession(session: PracticeSessionRecord): Promise<void> {
    const { error } = await this.client.from('practice_sessions').insert({
      id: session.id.startsWith('sess-') ? undefined : session.id,
      owner_id: this.userId,
      duration_seconds: session.durationSeconds,
      routine_id: session.routineId ?? null,
      exercise_ref: session.exerciseId ?? null,
      finished_at: session.finishedAt,
    });
    if (error) throw error;
  }
}
