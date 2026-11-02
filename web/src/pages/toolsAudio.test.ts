import { describe, it, expect } from 'vitest';
import {
  beatIntervalSeconds, beatsPerMeasure, clampBpm, defaultAccents,
  detectPitch, midiToFrequency, readingFromFrequency,
} from './toolsAudio';

describe('real tuner pitch calculations', () => {
  it('maps A440 to A4 at zero cents', () => {
    const note = readingFromFrequency(440, 'chromatic');
    expect(note?.note).toBe('A4');
    expect(note?.targetLabel).toBe('A4');
    expect(note?.cents).toBeCloseTo(0, 6);
  });

  it('uses open-string targets in guitar and bass modes', () => {
    expect(readingFromFrequency(110, 'guitar')?.targetLabel).toBe('A2');
    expect(readingFromFrequency(midiToFrequency(28), 'bass')?.targetLabel).toBe('E1');
    expect(readingFromFrequency(440, 'guitar')?.isOpenString).toBe(false);
  });

  it('does not invent pitch for invalid or silent samples', () => {
    expect(readingFromFrequency(0, 'chromatic')).toBeNull();
    expect(detectPitch(new Float32Array(8192), 48000)).toBeNull();
  });

  it('recognizes a clean actual monophonic sine wave', () => {
    const sampleRate = 48000;
    const sine = Float32Array.from({ length: 8192 }, (_, i) =>
      Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.35);
    expect(detectPitch(sine, sampleRate)).toBeCloseTo(440, 0);
  });

  it('recognizes a low bass E1 note', () => {
    const sampleRate = 48000;
    const pitch = midiToFrequency(28);
    const sine = Float32Array.from({ length: 8192 }, (_, i) =>
      Math.sin(2 * Math.PI * pitch * i / sampleRate) * 0.4);
    expect(detectPitch(sine, sampleRate)).toBeCloseTo(pitch, 0);
  });
});

describe('metronome beat timing', () => {
  it('clamps BPM to 40–240', () => {
    expect(clampBpm(3)).toBe(40);
    expect(clampBpm(300)).toBe(240);
    expect(clampBpm(105.7)).toBe(106);
  });
  it('schedules compound meter as dotted-quarter pulses with eighth subdivisions', () => {
    expect(beatIntervalSeconds(100, '4/4')).toBeCloseTo(0.6);
    expect(beatIntervalSeconds(100, '6/8')).toBeCloseTo(0.2);
    expect(beatsPerMeasure('6/8')).toBe(6);
    expect(defaultAccents('6/8')).toEqual([true, false, false, true, false, false]);
  });
});
