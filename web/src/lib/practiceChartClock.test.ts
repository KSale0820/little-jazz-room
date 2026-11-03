import { describe, expect, it } from 'vitest';
import type { Chart } from '../types/content';
import { chartTransposeSemitones, spellChord } from './chords';
import { anchorAt, locatePlayhead, seekMeasure, wrapChartBeat } from './practiceChartClock';

function chart(meter: [number, number] = [4, 4], bars = 12): Chart {
  return {
    id: 'test', title: 'Test', concert_key: 'F', time_signature: meter, feel: 'Swing', form: '',
    bars: Array.from({ length: bars }, (_, index) => ({
      number: index + 1, section: null,
      events: [
        { beat: 1, duration_beats: meter[0] / 2, root: 'F', quality: '7' as const },
        { beat: 1 + meter[0] / 2, duration_beats: meter[0] / 2, root: 'Bb', quality: '7' as const },
      ],
    })),
  };
}
const running = (chartBeat = 0, startedAtMs = 1000) => ({ chartBeat, startedAtMs });

describe('monotonic chord-chart playhead', () => {
  it('advances 4/4 at 120 BPM every two seconds and wraps the full chart', () => {
    const blues = chart([4, 4]);
    expect(locatePlayhead(blues, running(), 2999, 120, null).barIndex).toBe(0);
    expect(locatePlayhead(blues, running(), 3000, 120, null).barIndex).toBe(1);
    expect(locatePlayhead(blues, running(), 25000, 120, null).barIndex).toBe(0);
  });

  it('advances 3/4 at 120 BPM every 1.5 seconds', () => {
    const waltz = chart([3, 4]);
    expect(locatePlayhead(waltz, running(), 2499, 120, null).barIndex).toBe(0);
    expect(locatePlayhead(waltz, running(), 2500, 120, null).barIndex).toBe(1);
  });

  it('uses event beat positions and durations within each measure', () => {
    const blues = chart();
    const first = locatePlayhead(blues, running(), 1999, 120, null);
    const second = locatePlayhead(blues, running(), 2000, 120, null);
    expect(first.eventIndex).toBe(0);
    expect(second.eventIndex).toBe(1);
    expect(second.beatInBar).toBe(2);
  });

  it('pauses and resumes without changing fractional musical position', () => {
    const blues = chart();
    const paused = anchorAt(blues, running(), 2250, 120, null, false);
    expect(paused.chartBeat).toBe(2.5);
    expect(locatePlayhead(blues, paused, 9999, 120, null).chartBeat).toBe(2.5);
    const resumed = anchorAt(blues, paused, 10000, 120, null, true);
    expect(locatePlayhead(blues, resumed, 10750, 120, null).chartBeat).toBe(4);
  });

  it('changes tempo continuously without resetting its musical position', () => {
    const blues = chart();
    const updated = anchorAt(blues, running(), 2000, 120, null, true);
    expect(locatePlayhead(blues, updated, 2000, 60, null).chartBeat).toBe(2);
    expect(locatePlayhead(blues, updated, 3000, 60, null).chartBeat).toBe(3);
  });

  it('loops bars 5–8 back to bar 5 and keeps the other bars distinct', () => {
    const blues = chart();
    const loop: [number, number] = [5, 8];
    expect(locatePlayhead(blues, seekMeasure(4, blues, true, 1000), 8999, 120, loop).barIndex).toBe(7);
    expect(locatePlayhead(blues, seekMeasure(4, blues, true, 1000), 9000, 120, loop).barIndex).toBe(4);
    expect(wrapChartBeat(0, blues, loop)).toBe(16);
  });

  it('repositions immediately with measure taps and manual skip', () => {
    const blues = chart();
    const selected = seekMeasure(7, blues, true, 2000);
    expect(locatePlayhead(blues, selected, 2000, 100, null).barIndex).toBe(7);
    const skipped = seekMeasure(8, blues, true, 3000);
    expect(locatePlayhead(blues, skipped, 3000, 100, null).barIndex).toBe(8);
  });

  it('keeps concert-key and written-instrument transposition independent', () => {
    const blues = chart();
    const first = blues.bars[0].events[0];
    expect(spellChord(first, chartTransposeSemitones(blues, 'F', 'C'))).toBe('F7');
    expect(spellChord(first, chartTransposeSemitones(blues, 'G', 'C'))).toBe('G7');
    expect(spellChord(first, chartTransposeSemitones(blues, 'F', 'Bb'))).toBe('G7');
    expect(spellChord(first, chartTransposeSemitones(blues, 'F', 'Eb'))).toBe('D7');
  });
});
