import type { Exercise, RoutinePlayerSettings, RoutineStep } from '../types/content';

export interface StepSnapshot {
  title: string;
  instructions: string;
  chart_id: string | null;
}

export interface PlayableRoutineStep {
  exercise_id: string;
  duration_minutes: number;
  title: string;
  instructions: string;
  chart_id: string | null;
  player_settings?: RoutinePlayerSettings;
}

/** Prefer embedded cloud snapshots when the source exercise is not visible to this viewer. */
export function resolvePlayableStep(
  step: RoutineStep,
  exercises: Exercise[],
  catalogById: Record<string, Exercise | undefined>
): PlayableRoutineStep {
  const snap = step.snapshot;
  const ex = catalogById[step.exercise_id] ?? exercises.find(e => e.id === step.exercise_id);
  if (snap) {
    return {
      exercise_id: step.exercise_id,
      duration_minutes: step.duration_minutes,
      title: snap.title,
      instructions: snap.instructions,
      chart_id: snap.chart_id,
      player_settings: step.player_settings ?? snap.player_settings ?? ex?.player_settings,
    };
  }
  return {
    exercise_id: step.exercise_id,
    duration_minutes: step.duration_minutes,
    title: ex?.title ?? 'Exercise',
    instructions: ex?.instructions ?? 'Follow the routine step.',
    chart_id: ex?.chart_id ?? null,
    player_settings: step.player_settings ?? ex?.player_settings,
  };
}
