import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedExercises, seedRoutines } from '../data/seed';
import {
  createLocalRepository,
  mergeRoutines,
  routineDurationFromSteps,
  type LocalRepository,
} from '../repository/localRepository';
import type { LocalRoutine } from '../types/content';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

afterEach(() => vi.unstubAllGlobals());

describe('R01/R03 local class-demo routine journey', () => {
  function setup(): LocalRepository {
    vi.stubGlobal('localStorage', new MemoryStorage());
    return createLocalRepository('demo-user');
  }

  it('keeps Daily Jazz Warm-Up available for the shared player', () => {
    const warmup = seedRoutines.find(routine => routine.id === 'daily-warm-up');
    expect(warmup?.is_seed).toBe(true);
    expect(warmup?.steps.length).toBeGreaterThan(0);
  });

  it('persists a 3-part routine with edited times and ordering after repository reload', () => {
    const repo = setup();
    const ids = ['swing-2-4', 'thirds-sevenths', 'blues-form'];
    expect(ids.every(id => seedExercises.some(exercise => exercise.id === id))).toBe(true);
    const steps = [
      { exercise_id: ids[1]!, duration_minutes: 8 },
      { exercise_id: ids[0]!, duration_minutes: 5 },
      { exercise_id: ids[2]!, duration_minutes: 9 },
    ];
    const routine: LocalRoutine = {
      id: 'local-rt-demo', title: 'My Morning Standards',
      description: 'Warm-up, skill, and song practice', is_seed: false,
      level: 'Beginner', visibility: 'private', steps,
      duration_minutes: routineDurationFromSteps(steps),
      applicable_instruments: ['Piano'],
    };
    repo.saveLocalRoutine(routine);
    const reloaded = createLocalRepository('demo-user');
    const myRoutines = mergeRoutines(seedRoutines, reloaded.listLocalRoutines())
      .filter(entry => entry.is_seed === false);
    expect(myRoutines).toHaveLength(1);
    expect(myRoutines[0]?.title).toBe('My Morning Standards');
    expect(myRoutines[0]?.duration_minutes).toBe(22);
    expect(myRoutines[0]?.steps).toEqual(steps);
    expect(mergeRoutines(seedRoutines, reloaded.listLocalRoutines())
      .some(entry => entry.id === 'daily-warm-up')).toBe(true);
  });

  it('retains the previous draft and custom exercise in local repository', () => {
    const repo = setup();
    repo.writeCreateDraft({
      title: 'Working draft', description: 'Keep my work',
      visibility: 'Private', stepExerciseIds: ['swing-2-4', 'blues-form'],
    });
    repo.saveLocalExercise({
      id: 'local-ex-demo', title: 'Personal warm-up', is_seed: false,
      category: 'Technique', level: 'Beginner', duration_minutes: 5,
      instructions: 'Long tones and relaxed time',
      suggested_material: 'Custom exercise', suggested_bpm: null,
      audio_asset_id: null, visibility: 'private', chart_id: null,
      applicable_instruments: ['All'],
    });
    const reloaded = createLocalRepository('demo-user');
    expect(reloaded.readCreateDraft()?.stepExerciseIds).toEqual(['swing-2-4', 'blues-form']);
    expect(reloaded.listLocalExercises()[0]?.title).toBe('Personal warm-up');
  });
});
