import { describe, expect, it } from 'vitest';
import type { Chart } from '../types/content';
import { chartTransposeSemitones, spellChord } from './chords';
import { anchorAt, locatePlayhead, locateSequencePlayhead, rawChartBeat, seekMeasure, sequenceBeatForBar, sequenceDuration, wrapChartBeat } from './practiceChartClock';

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

describe('multi-section practice loop plans', () => {
  const blues = chart([4, 4]);
  const sections = [
    { startBar: 1, endBar: 2, plays: 3 },
    { startBar: 7, endBar: 8, plays: 2 },
  ];
  const head = (beat: number, plan = sections, repeat = false) =>
    locateSequencePlayhead(blues, { chartBeat: beat, startedAtMs: null }, 1000, 120, plan, repeat);

  it('plays different ranges their own number of times in order', () => {
    expect(sequenceDuration(blues, sections)).toBe(40);
    expect(head(0)).toMatchObject({ barIndex: 0, sectionIndex: 0, pass: 1 });
    expect(head(4)).toMatchObject({ barIndex: 1, sectionIndex: 0, pass: 1 });
    expect(head(8)).toMatchObject({ barIndex: 0, sectionIndex: 0, pass: 2 });
    expect(head(16)).toMatchObject({ barIndex: 0, sectionIndex: 0, pass: 3 });
    expect(head(24)).toMatchObject({ barIndex: 6, sectionIndex: 1, pass: 1 });
    expect(head(32)).toMatchObject({ barIndex: 6, sectionIndex: 1, pass: 2 });
    expect(head(36)).toMatchObject({ barIndex: 7, sectionIndex: 1, pass: 2 });
    expect(head(40)).toMatchObject({ barIndex: 7, sectionIndex: 1, pass: 2, ended: true });
  });

  it('supports no looping and stops at the final bar', () => {
    const atEnd = locateSequencePlayhead(blues, running(0), 25000, 120, null);
    expect(atEnd.ended).toBe(true);
    expect(atEnd.barIndex).toBe(11);
    expect(atEnd.sectionIndex).toBe(null);
    expect(head(0, [], false).barIndex).toBe(0);
  });

  it('can repeat the entire configured plan, only when explicitly enabled', () => {
    expect(head(40, sections, true)).toMatchObject({ ended: false, sectionIndex: 0, barIndex: 0, pass: 1 });
    expect(head(48, sections, true)).toMatchObject({ ended: false, sectionIndex: 0, barIndex: 0, pass: 2 });
  });

  it('seeks to a configured range and detects out-of-plan measures', () => {
    expect(sequenceBeatForBar(blues, sections, 0)).toBe(0);
    expect(sequenceBeatForBar(blues, sections, 6)).toBe(24);
    expect(sequenceBeatForBar(blues, sections, 7)).toBe(28);
    expect(sequenceBeatForBar(blues, sections, 4)).toBe(null);
    expect(sequenceBeatForBar(blues, null, 4)).toBe(16);
  });

  it('preserves fractional sequence beats through tempo changes', () => {
    const old = { chartBeat: 5.25, startedAtMs: 1000 };
    const held = rawChartBeat(old, 1500, 120);
    expect(held).toBe(6.25);
    const resumed = { chartBeat: held, startedAtMs: 1500 };
    expect(locateSequencePlayhead(blues, resumed, 2000, 60, sections).sequenceBeat).toBe(6.75);
  });

  it('respects a single-pass section and alternate meters', () => {
    const threeFour = chart([3, 4], 12);
    const plan = [{ startBar: 5, endBar: 6, plays: 1 }];
    expect(sequenceDuration(threeFour, plan)).toBe(6);
    expect(locateSequencePlayhead(threeFour, { chartBeat: 3, startedAtMs: null }, 1000, 120, plan))
      .toMatchObject({ barIndex: 5, pass: 1 });
  });
});
