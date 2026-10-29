import { describe, expect, it } from 'vitest';
import type { Exercise, Routine } from '../types/content';
import { exerciseMatchesInstrument, routineMatchesInstrument } from './instrumentFilter';

const baseExercise = (overrides: Partial<Exercise>): Exercise => ({
  id: 'x',
  title: 'Test',
  category: 'Technique',
  level: 'Beginner',
  duration_minutes: 5,
  instructions: 'Do the thing.',
  suggested_material: 'None',
  suggested_bpm: null,
  audio_asset_id: null,
  visibility: 'public',
  chart_id: null,
  applicable_instruments: ['All'],
  ...overrides,
});

const baseRoutine = (overrides: Partial<Routine>): Routine => ({
  id: 'r',
  title: 'Routine',
  level: 'Beginner',
  duration_minutes: 10,
  visibility: 'public',
  steps: [],
  applicable_instruments: ['All'],
  ...overrides,
});

describe('instrumentFilter metadata', () => {
  it('matches All filter for every exercise', () => {
    const ex = baseExercise({ applicable_instruments: ['Bass'] });
    expect(exerciseMatchesInstrument(ex, 'All')).toBe(true);
  });

  it('uses explicit exercise instruments, not keywords', () => {
    const ex = baseExercise({
      title: 'Walking bass lines',
      instructions: 'Play bass only',
      applicable_instruments: ['Bass'],
    });
    expect(exerciseMatchesInstrument(ex, 'Bass')).toBe(true);
    expect(exerciseMatchesInstrument(ex, 'Piano')).toBe(false);
  });

  it('treats All token as every instrument', () => {
    const ex = baseExercise({ applicable_instruments: ['All'] });
    expect(exerciseMatchesInstrument(ex, 'Drums')).toBe(true);
  });

  it('filters routines by routine metadata', () => {
    const routine = baseRoutine({ applicable_instruments: ['Piano', 'Guitar'] });
    expect(routineMatchesInstrument(routine, 'Piano')).toBe(true);
    expect(routineMatchesInstrument(routine, 'Trumpet')).toBe(false);
  });
});
