import { describe, expect, it } from 'vitest';
import { resolvePlayableStep } from './routinePlayback';
import type { Exercise, RoutineStep } from '../types/content';

describe('resolvePlayableStep', () => {
  it('uses embedded snapshot when exercise is missing from catalog', () => {
    const step: RoutineStep = {
      exercise_id: '00000000-0000-4000-8000-000000000001',
      duration_minutes: 7,
      snapshot: {
        title: 'Frozen step',
        instructions: 'Play the snapshot line.',
        chart_id: 'blues-f-12',
      },
    };
    const playable = resolvePlayableStep(step, [], {});
    expect(playable.title).toBe('Frozen step');
    expect(playable.instructions).toBe('Play the snapshot line.');
    expect(playable.chart_id).toBe('blues-f-12');
    expect(playable.duration_minutes).toBe(7);
  });

  it('falls back to catalog exercise when no snapshot', () => {
    const ex: Exercise = {
      id: 'swing-2-4',
      title: 'Swing feel',
      category: 'Rhythm',
      level: 'Beginner',
      duration_minutes: 5,
      instructions: 'Keep time.',
      suggested_material: '',
      suggested_bpm: null,
      audio_asset_id: null,
      visibility: 'public',
      chart_id: null,
      applicable_instruments: ['All'],
      is_seed: true,
    };
    const step: RoutineStep = { exercise_id: 'swing-2-4', duration_minutes: 5 };
    const playable = resolvePlayableStep(step, [ex], { 'swing-2-4': ex });
    expect(playable.title).toBe('Swing feel');
    expect(playable.instructions).toBe('Keep time.');
  });
});
