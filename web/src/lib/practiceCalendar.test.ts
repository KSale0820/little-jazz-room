import { describe, expect, it } from 'vitest';
import type { PracticeSessionRecord } from '../types/content';
import { practiceCalendarMonth } from './practiceCalendar';

const makeSession = (id: string, date: Date, durationSeconds: number): PracticeSessionRecord =>
  ({ id, finishedAt: date.toISOString(), durationSeconds });

describe('practice calendar', () => {
  it('pads November 2026 from Sunday and marks actual saved practice days', () => {
    const date = new Date(2026, 10, 6, 14);
    const days = practiceCalendarMonth([
      makeSession('a', new Date(2026, 10, 5, 9), 600),
      makeSession('b', new Date(2026, 10, 5, 17), 900),
      makeSession('c', new Date(2026, 9, 31, 20), 1000),
    ], 2026, 10, date);
    expect(days).toHaveLength(30);
    expect(days[0]?.day).toBe(1);
    expect(days[4]?.day).toBe(5);
    expect(days[4]).toMatchObject({ practiced: true, minutes: 25, isToday: false });
    expect(days[5]).toMatchObject({ day: 6, practiced: false, isToday: true });
  });
  it('uses local dates, handles Monday-first padding and leap day', () => {
    const days = practiceCalendarMonth([
      makeSession('feb29', new Date(2024, 1, 29, 23, 58), 60),
      makeSession('march', new Date(2024, 2, 1, 0, 1), 60),
    ], 2024, 1, new Date(2024, 1, 29, 15));
    expect(days.filter(Boolean)).toHaveLength(29);
    expect(days.filter(d => d?.practiced).map(d => d?.day)).toEqual([29]);
    expect(days.filter(Boolean).at(-1)).toMatchObject({ day: 29, practiced: true, minutes: 1 });
  });
  it('does not credit malformed, zero or negative sessions', () => {
    const days = practiceCalendarMonth([
      { id: 'bad', finishedAt: 'not-a-date', durationSeconds: 1800 },
      makeSession('zero', new Date(2026, 10, 5, 12), 0),
      makeSession('negative', new Date(2026, 10, 5, 13), -120),
    ], 2026, 10);
    expect(days.filter(d => d?.practiced)).toHaveLength(0);
  });
});
