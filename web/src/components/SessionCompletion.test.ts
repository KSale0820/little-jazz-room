import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalRepository } from '../repository/localRepository';
import type { PracticeSessionRecord } from '../types/content';
import { completionDailyGoal, earnedCompletionCompanions } from './SessionCompletion';
import { summarizeProgress } from '../pages/ProgressPage';

const at = '2026-11-08T20:00:00.000Z';
const session = (id: string, seconds: number): PracticeSessionRecord =>
  ({ id, finishedAt: at, durationSeconds: seconds });
const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
};
afterEach(() => { memory.clear(); vi.unstubAllGlobals(); });

describe('P06 saved-session completion', () => {
  it('awards only a saved session crossing the real 60-minute Milo threshold', () => {
    const previous = session('previous', 3599);
    const current = session('just-finished', 1);
    expect(earnedCompletionCompanions([previous], current)).toEqual([]);
    expect(earnedCompletionCompanions([previous, current], current)).toEqual(['milo']);
    expect(earnedCompletionCompanions([previous, current], current, ['milo'])).toEqual([]);
    expect(earnedCompletionCompanions([session('long-ago', 3600), current], current)).toEqual([]);
  });

  it('awards Maple at 300 actual cumulative minutes, not rounded short sessions', () => {
    const before = session('previous', 17999);
    const final = session('completed', 1);
    expect(earnedCompletionCompanions([before, final], final)).toEqual(['maple']);
    expect(earnedCompletionCompanions([session('tiny', 1), final], final)).toEqual([]);
  });

  it('survives a repository reload and feeds the same data shown in Progress', () => {
    vi.stubGlobal('localStorage', storage);
    const repo = createLocalRepository('anonymous');
    const previous = session('previous', 3599);
    const completed = session('actual-finish', 60);
    repo.addSession(previous);
    repo.addSession(completed);
    repo.addSession(completed);
    const persisted = createLocalRepository('anonymous').listSessions();
    expect(persisted).toHaveLength(2);
    expect(persisted.find(row => row.id === completed.id)).toEqual(completed);
    expect(earnedCompletionCompanions(persisted, completed)).toEqual(['milo']);
    const progress = summarizeProgress(persisted, new Date(at));
    expect(progress.weekMinutes).toBe(61);
  });

  it('uses the same scoped daily-goal preference as Practice, without editing progress data', () => {
    expect(completionDailyGoal('anonymous', storage)).toBe(30);
    storage.setItem('little-jazz-room:daily-practice-goal:v1:anonymous', '45');
    expect(completionDailyGoal('anonymous', storage)).toBe(45);
    expect(completionDailyGoal('another-user', storage)).toBe(30);
    storage.setItem('little-jazz-room:daily-practice-goal:v1:anonymous', 'oops');
    expect(completionDailyGoal('anonymous', storage)).toBe(30);
  });
});
