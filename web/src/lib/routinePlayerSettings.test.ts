import { describe, expect, it, vi } from 'vitest';
import { defaultPlayerSettings, makeSavedExercise, settingsChanged } from './routinePlayerSettings';

describe('routine player step settings', () => {
  it('loads a step preset over the exercise suggestion without mutating it', () => {
    const loop_sections = [{ startBar: 2, endBar: 5, plays: 3 }];
    const settings = defaultPlayerSettings('F', 70, {
      reference_bpm: 92, chart_key: 'G', written_pitch: 'Bb',
      loop_enabled: true, loop_sections, repeat: true,
    });
    expect(settings.reference_bpm).toBe(92);
    expect(settings.chart_key).toBe('G');
    settings.loop_sections[0]!.plays = 7;
    expect(loop_sections[0]!.plays).toBe(3);
  });

  it('detects changes to BPM, key, instrument, repeat, and loops', () => {
    const original = defaultPlayerSettings('F', 70);
    expect(settingsChanged(original, original)).toBe(false);
    for (const patch of [
      { reference_bpm: 71 }, { chart_key: 'G' }, { written_pitch: 'Eb' as const },
      { repeat: true }, { loop_enabled: true },
      { loop_sections: [{ startBar: 1, endBar: 4, plays: 2 }] },
    ]) expect(settingsChanged({ ...original, ...patch }, original)).toBe(true);
  });

  it('saves a separate private exercise with its own player configuration', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'new-exercise' });
    try {
      const settings = defaultPlayerSettings('F', 75, { reference_bpm: 95 });
      const exercise = makeSavedExercise(undefined, 'My variation', 'Play guide tones', 'blues-f-12', 4, settings);
      expect(exercise.id).toBe('new-exercise');
      expect(exercise.is_seed).toBe(false);
      expect(exercise.player_settings?.reference_bpm).toBe(95);
      expect(exercise.chart_id).toBe('blues-f-12');
      expect(exercise.visibility).toBe('private');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
