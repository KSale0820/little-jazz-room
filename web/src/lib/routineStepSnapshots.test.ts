import { describe, expect, it } from 'vitest';
import { exercisesById } from '../data/seed';
import type { Routine } from '../types/content';
import { buildRoutineStepSnapshots } from './routineStepSnapshots';

describe('cloud routine snapshots', () => {
  const routine: Routine = {
    id: 'local-rt-demo',
    title: 'Edited timings',
    level: 'Beginner',
    duration_minutes: 13,
    visibility: 'private',
    applicable_instruments: ['Piano'],
    steps: [
      { exercise_id: 'swing-2-4', duration_minutes: 2 },
      { exercise_id: 'thirds-sevenths', duration_minutes: 4 },
      { exercise_id: 'swing-2-4', duration_minutes: 7 },
    ],
  };

  it('preserves step order, edited durations and repeated exercise IDs', () => {
    const steps = buildRoutineStepSnapshots(routine, Object.values(exercisesById), exercisesById);
    expect(steps.map(step => [step.sort_order, step.seed_exercise_id, step.snapshot_duration_minutes]))
      .toEqual([
        [0, 'swing-2-4', 2],
        [1, 'thirds-sevenths', 4],
        [2, 'swing-2-4', 7],
      ]);
    expect(steps[0]?.snapshot_title).toBe(steps[2]?.snapshot_title);
    expect(steps.map(step => step.snapshot_duration_minutes).reduce((sum, value) => sum + value, 0)).toBe(13);
  });

  it('keeps an imported step snapshot if its source exercise is not in the catalog', () => {
    const saved = buildRoutineStepSnapshots({
      ...routine,
      steps: [{
        exercise_id: 'removed-source',
        duration_minutes: 9,
        snapshot: { title: 'Saved chart workout', instructions: 'Play softly', chart_id: 'blues-f-12' },
      }],
    }, [], exercisesById);
    expect(saved[0]).toMatchObject({
      sort_order: 0, snapshot_title: 'Saved chart workout',
      snapshot_instructions: 'Play softly', snapshot_chart_id: 'blues-f-12',
      snapshot_duration_minutes: 9, seed_exercise_id: null, source_exercise_id: null,
    });
  });
});
