import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeScheduledStreak } from '../lib/practiceStats';
import { readPracticeOffDays, savePracticeOffDays, readPracticeGoal, savePracticeGoal } from '../lib/practiceHomePreferences';
import type { PracticeSessionRecord } from '../types/content';

const db = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => db.get(key) ?? null,
  setItem: (key: string, value: string) => { db.set(key, value); },
};
const logged = (day: number): PracticeSessionRecord => ({
  id: String(day), finishedAt: new Date(2026, 10, day, 12).toISOString(), durationSeconds: 1800,
});

afterEach(() => { db.clear(); vi.unstubAllGlobals(); });

describe('Progress goals and scheduled practice', () => {
  it('persists a custom goal and independent off days per account', () => {
    vi.stubGlobal('window', { localStorage: localStorageMock });
    expect(readPracticeGoal('one')).toBe(30);
    expect(savePracticeGoal('one', 45)).toBe(45);
    expect(savePracticeOffDays('one', [5, 1, 1, 9])).toEqual([1, 5]);
    expect(readPracticeGoal('one')).toBe(45);
    expect(readPracticeOffDays('one')).toEqual([1, 5]);
    expect(readPracticeOffDays('two')).toEqual([]);
  });
  it('rest days do not inflate or interrupt a streak', () => {
    const wednesday = new Date(2026, 10, 11, 17);
    expect(computeScheduledStreak([logged(9), logged(11)], [1], wednesday)).toBe(2);
    expect(computeScheduledStreak([logged(9), logged(11)], [], wednesday)).toBe(1);
    expect(computeScheduledStreak([logged(9)], [1], wednesday)).toBe(1);
    expect(computeScheduledStreak([], [1], wednesday)).toBe(0);
  });
});
