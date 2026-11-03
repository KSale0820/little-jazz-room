import { describe, it, expect } from 'vitest';
import {
  beatIntervalSeconds, beatsPerMeasure, clampBpm, defaultAccents,
  detectPitch, inputRms, midiToFrequency, readingFromFrequency,
  pitchTrailGeometry, retainMeasuredPitch, PITCH_DROPOUT_MS,
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

  it('detects a low-volume iPhone microphone note while rejecting silence', () => {
    const sampleRate = 48000;
    const quietNote = Float32Array.from({ length: 8192 }, (_, i) =>
      Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.008);
    expect(inputRms(quietNote)).toBeGreaterThan(0.003);
    expect(detectPitch(quietNote, sampleRate)).toBeCloseTo(440, 0);
    expect(inputRms(new Float32Array(8192))).toBe(0);
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

describe('chromatic pitch graph behavior', () => {
  it('draws time ordered pitches rising upward, with a gap for silence', () => {
    const chart = pitchTrailGeometry([
      { timestamp: 1000, frequency: 220 },
      { timestamp: 1200, frequency: 330 },
      { timestamp: 1400, frequency: null },
      { timestamp: 1600, frequency: 440 },
    ], 2000, 2000);
    expect(chart.segments).toHaveLength(2);
    expect(chart.segments[0][0].x).toBeLessThan(chart.segments[0][1].x);
    expect(chart.segments[0][0].y).toBeGreaterThan(chart.segments[0][1].y);
    expect(chart.current?.y).toBeLessThan(chart.segments[0][1].y);
  });
  it('does not fabricate a pitch line for silence or empty history', () => {
    expect(pitchTrailGeometry([], 8000).segments).toEqual([]);
    expect(pitchTrailGeometry([{ timestamp: 7900, frequency: null }], 8000).current).toBeNull();
  });
});

describe('stable live tuner readings', () => {
  it('retains an actually measured note across a short missed frame', () => {
    const measured = readingFromFrequency(440, 'chromatic')!;
    const good = retainMeasuredPitch(null, measured, 1000);
    expect(good.displayed?.note).toBe('A4');
    const dropped = retainMeasuredPitch(good.recent, null, 1000 + PITCH_DROPOUT_MS / 2);
    expect(dropped.displayed?.frequency).toBe(440);
    expect(dropped.measured).toBe(false);
    const silent = retainMeasuredPitch(dropped.recent, null, 1000 + PITCH_DROPOUT_MS + 10);
    expect(silent.displayed).toBeNull();
    expect(silent.recent).toBeNull();
  });
  it('immediately reflects real note changes without fabricating intermediate pitches', () => {
    const a = retainMeasuredPitch(null, readingFromFrequency(440, 'chromatic'), 100);
    const b = retainMeasuredPitch(a.recent, readingFromFrequency(523.25, 'chromatic'), 140);
    expect(b.displayed?.note).toBe('C5');
    expect(b.measured).toBe(true);
    expect(retainMeasuredPitch(null, null, 200).displayed).toBeNull();
  });
});

describe('realistic singing input', () => {
  // The oscillator phase is integrated to model actual pitch vibrato rather
  // than rendering a single sine wave with an unchanging frequency.
  function sungNote(f0: number, level = 0.11, vibratoCents = 28): Float32Array {
    const sampleRate = 48000;
    let phase = 0;
    return Float32Array.from({ length: 8192 }, (_, i) => {
      const instant = f0 * 2 ** ((vibratoCents * Math.sin(2 * Math.PI * 5 * i / sampleRate)) / 1200);
      phase += 2 * Math.PI * instant / sampleRate;
      const breath = level * 0.018 * Math.sin(i * 2.91);
      return level * (
        0.45 * Math.sin(phase) + 0.8 * Math.sin(2 * phase) +
        0.3 * Math.sin(3 * phase) + 0.12 * Math.sin(4 * phase)
      ) + breath;
    });
  }
  it('tracks a sustained baritone voice with vibrato and strong harmonics', () => {
    const measured = detectPitch(sungNote(165), 48000);
    expect(measured).not.toBeNull();
    expect(Math.abs(1200 * Math.log2(measured! / 165))).toBeLessThan(70);
  });
  it('tracks a sustained higher voice with vibrato', () => {
    const measured = detectPitch(sungNote(392, 0.09, 35), 48000);
    expect(measured).not.toBeNull();
    expect(Math.abs(1200 * Math.log2(measured! / 392))).toBeLessThan(70);
  });
  it('recognizes a much quieter pitched voice', () => {
    const measured = detectPitch(sungNote(220, 0.018, 20), 48000);
    expect(measured).not.toBeNull();
    expect(Math.abs(1200 * Math.log2(measured! / 220))).toBeLessThan(70);
  });
  it('does not turn periodicity-free microphone noise into a note', () => {
    let seed = 123456;
    const noise = Float32Array.from({ length: 8192 }, () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return 0.12 * ((seed / 0xffffffff) * 2 - 1);
    });
    expect(detectPitch(noise, 48000)).toBeNull();
  });
});
