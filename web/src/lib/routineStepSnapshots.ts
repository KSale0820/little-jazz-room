import type { Exercise, Routine } from '../types/content';

/** Convert each scheduled routine step to its own persisted cloud snapshot.
 * Never rebuild timing from an exercise default: an exercise can appear more
 * than once with different durations and order is significant.
 */
export function buildRoutineStepSnapshots(
  routine: Routine,
  exercises: Exercise[],
  seedById: Record<string, Exercise>,
) {
  const knownExercises = new Map(exercises.map(exercise => [exercise.id, exercise]));
  return routine.steps.map((step, sort_order) => {
    const id = step.exercise_id;
    const exercise = knownExercises.get(id) ?? seedById[id];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    return {
      sort_order,
      snapshot_title: step.snapshot?.title ?? exercise?.title ?? 'Exercise',
      snapshot_instructions: step.snapshot?.instructions ?? exercise?.instructions ?? '',
      snapshot_duration_minutes: step.duration_minutes,
      snapshot_chart_id: step.snapshot?.chart_id ?? exercise?.chart_id ?? null,
      seed_exercise_id: seedById[id] ? id : null,
      source_exercise_id: exercise && !seedById[id] && isUuid ? id : null,
    };
  });
}
