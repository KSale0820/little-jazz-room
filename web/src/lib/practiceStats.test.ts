import { describe, expect, it } from 'vitest';
import type { PracticeSessionRecord } from '../types/content';
import { minutesYesterday } from './practiceStats';

const session = (id: string, time: Date, durationSeconds: number): PracticeSessionRecord =>
  ({ id, finishedAt: time.toISOString(), durationSeconds });

describe('minutesYesterday', () => {
  const today = new Date(2026, 10, 6, 14, 0);
  it('sums only the previous local calendar day from real saved sessions', () => {
    const records = [
      session('today', new Date(2026, 10, 6, 8), 999),
      session('y1', new Date(2026, 10, 5, 9), 600),
      session('y2', new Date(2026, 10, 5, 23, 59), 900),
      session('older', new Date(2026, 10, 4, 21), 3600),
    ];
    expect(minutesYesterday(records, today)).toBe(25);
  });
  it('uses local date boundaries even across month changes', () => {
    expect(minutesYesterday([
      session('prev-month', new Date(2026, 9, 31, 23, 50), 420),
      session('current', new Date(2026, 10, 1, 0, 10), 600),
    ], new Date(2026, 10, 1, 12))).toBe(7);
  });
  it('returns 0 for empty/invalid/nonmatching entries and never counts negative seconds', () => {
    expect(minutesYesterday([], today)).toBe(0);
    expect(minutesYesterday([
      { id: 'invalid', finishedAt: 'not-a-date', durationSeconds: 600 },
      session('negative', new Date(2026, 10, 5, 12), -1800),
    ], today)).toBe(0);
  });
});
