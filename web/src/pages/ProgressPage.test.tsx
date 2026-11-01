import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalRepository } from '../repository/localRepository';
import type { PracticeSessionRecord, Routine } from '../types/content';
import { routineForReplay, summarizeProgress } from './ProgressPage';

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).toISOString();
const session = (id: string, day: number, durationSeconds: number, routineId?: string): PracticeSessionRecord => ({
  id, finishedAt: at(day), durationSeconds, routineId,
});

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
  removeItem: (key: string) => { memory.delete(key); },
  clear: () => { memory.clear(); },
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() { return memory.size; },
};

afterEach(() => { vi.unstubAllGlobals(); memory.clear(); });

describe('G01 real session summaries', () => {
  it('shows zero for an account with no saved sessions', () => {
    const result = summarizeProgress([], new Date(2026, 9, 28, 14));
    expect(result).toMatchObject({ todayMinutes: 0, weekMinutes: 0, streak: 0 });
    expect(result.weekDays.map(day => day.minutes)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('counts Monday–Sunday sessions, excluding previous-week minutes', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 9, 28, 14));
      const result = summarizeProgress([
        session('previous', 25, 600),
        session('monday', 26, 600),
        session('today', 28, 1500),
      ], new Date());
      expect(result.todayMinutes).toBe(25);
      expect(result.weekMinutes).toBe(35);
      expect(result.weekDays.map(day => day.minutes)).toEqual([10, 0, 25, 0, 0, 0, 0]);
    } finally { vi.useRealTimers(); }
  });

  it('reads a finished Player session after a new local repository instance (refresh)', () => {
    vi.stubGlobal('localStorage', storage);
    const saved = session('finished-player', 28, 1800, 'daily-warm-up');
    createLocalRepository('anonymous').addSession(saved);
    const refreshedSessions = createLocalRepository('anonymous').listSessions();
    expect(refreshedSessions).toEqual([saved]);
    expect(summarizeProgress(refreshedSessions, new Date(2026, 9, 28)).weekMinutes).toBe(30);
  });

  it('replays the saved routine, never an unrelated default routine', () => {
    const routines = [{ id: 'daily-warm-up' }, { id: 'custom' }] as Routine[];
    expect(routineForReplay(session('one', 28, 300, 'custom'), routines)).toBe('custom');
    expect(routineForReplay(session('two', 28, 300), routines)).toBeNull();
    expect(routineForReplay(session('three', 28, 300, 'deleted'), routines)).toBeNull();
  });
});
