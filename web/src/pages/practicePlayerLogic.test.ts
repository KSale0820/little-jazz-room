import { describe, expect, it } from 'vitest';
import { elapsedMilliseconds, formatPracticeTime } from './practicePlayerLogic';
import { chartTransposeSemitones, spellChord } from '../lib/chords';
import { chartsById } from '../data/seed';
import { commitStepElapsed, sessionDurationSeconds } from '../lib/practiceSessionTimer';

describe('P02 wall-clock practice timer', () => {
  it('starts at zero and does not advance while paused', () => {
    expect(elapsedMilliseconds(0, null, 5000)).toBe(0);
    expect(elapsedMilliseconds(1250, null, 999999)).toBe(1250);
  });

  it('uses real time rather than interval tick count', () => {
    expect(elapsedMilliseconds(1000, 5000, 8295)).toBe(4295);
    expect(Math.floor(elapsedMilliseconds(1000, 5000, 8295) / 1000)).toBe(4);
  });

  it('ignores backward wall-clock movement and preserves partial seconds', () => {
    expect(elapsedMilliseconds(250, 7000, 6990)).toBe(250);
    expect(elapsedMilliseconds(800, 100, 500)).toBe(1200);
  });

  it('accumulates elapsed time across step changes and pauses', () => {
    const first = elapsedMilliseconds(750, 1000, 3300);
    const second = elapsedMilliseconds(0, 5000, 6700);
    const duration = sessionDurationSeconds(0, Math.floor((first + second) / 1000));
    expect(first).toBe(3050);
    expect(duration).toBe(4);
    expect(commitStepElapsed(2, 3)).toBe(5);
  });

  it('renders actual duration, including short practice sessions', () => {
    expect(formatPracticeTime(0)).toBe('00:00');
    expect(formatPracticeTime(61)).toBe('01:01');
    expect(formatPracticeTime(3661)).toBe('01:01:01');
    expect(formatPracticeTime(0, true)).toBe('0 seconds');
    expect(formatPracticeTime(61, true)).toBe('1 min 1 sec');
  });
});

describe('P02 original chord chart measures and transposition', () => {
  const chart = chartsById['blues-f-12'];

  it('preserves all 12 source measures in order', () => {
    expect(chart).toBeDefined();
    expect(chart.bars).toHaveLength(12);
    expect(chart.bars.map(bar => bar.number)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it('transposes chart concert key and Bb written pitch without modifying source events', () => {
    const firstChord = chart.bars[0].events[0];
    expect(spellChord(firstChord, chartTransposeSemitones(chart, 'F', 'C'))).toBe('F7');
    expect(spellChord(firstChord, chartTransposeSemitones(chart, 'F', 'Bb'))).toBe('G7');
    expect(spellChord(firstChord, chartTransposeSemitones(chart, 'G', 'C'))).toBe('G7');
    expect(firstChord.root).toBe('F');
  });
});
