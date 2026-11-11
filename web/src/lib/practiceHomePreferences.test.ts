import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DAILY_GOAL, normalizeGoalMinutes, readPracticeGoal, savePracticeGoal, readPinnedPracticeRoutine, savePinnedPracticeRoutine } from './practiceHomePreferences';

const cache = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => cache.get(key) ?? null,
  setItem: (key: string, value: string) => { cache.set(key, value); },
  removeItem: (key: string) => { cache.delete(key); },
};
beforeEach(() => { cache.clear(); vi.stubGlobal('window', { localStorage: localStorageMock }); });
afterEach(() => vi.unstubAllGlobals());

describe('practice home preferences', () => {
  it('defaults to 30 minutes and accepts safe values only', () => {
    expect(readPracticeGoal('local')).toBe(DEFAULT_DAILY_GOAL);
    expect(normalizeGoalMinutes(Number.NaN)).toBe(DEFAULT_DAILY_GOAL);
    expect(normalizeGoalMinutes(2)).toBe(5);
    expect(normalizeGoalMinutes(1000)).toBe(240);
  });
  it('keeps daily goals scoped per account', () => {
    savePracticeGoal('user-a', 45);
    expect(readPracticeGoal('user-a')).toBe(45);
    expect(readPracticeGoal('user-b')).toBe(30);
  });
  it('allows one pinned routine per account and supports clearing it', () => {
    savePinnedPracticeRoutine('user-a', 'daily-warm-up');
    expect(readPinnedPracticeRoutine('user-a')).toBe('daily-warm-up');
    expect(readPinnedPracticeRoutine('user-b')).toBe(null);
    savePinnedPracticeRoutine('user-a', null);
    expect(readPinnedPracticeRoutine('user-a')).toBe(null);
  });
});
