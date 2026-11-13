import { describe, expect, it } from 'vitest';
import { achievementProgress, deriveEarned, summarizeEvidence, unlockedRoomItems } from './achievementModel';
import { readEarned, readRoomPreferences, saveEarned, saveRoomPreferences, isItemVisible } from './roomStore';
import type { PracticeSessionRecord } from '../../types/content';

const session = (id: string, finishedAt: string, durationSeconds = 1800, routineId?: string): PracticeSessionRecord =>
  ({ id, finishedAt, durationSeconds, routineId });

function memoryStore() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
}

describe('room achievements', () => {
  it('starts with an empty room and does not fake accomplishments', () => {
    const evidence = summarizeEvidence([]);
    expect(evidence.sessions).toBe(0);
    expect(deriveEarned(evidence)).toEqual([]);
    const starter = unlockedRoomItems([]);
    expect(starter).toContain('luna');
    expect(starter).toContain('curtain-left');
    expect(starter).toContain('couch');
    expect(starter).not.toContain('milo');
    expect(starter).not.toContain('maple');
    const firstHour = unlockedRoomItems(['first-hour']);
    expect(firstHour).toContain('milo');
    expect(firstHour).toContain('bookshelf-cat');
    expect(firstHour).toContain('milo-sleeping');
    const fiveHours = unlockedRoomItems(['five-hours']);
    expect(fiveHours).toContain('maple');
    expect(fiveHours).toContain('piano-busts');
    expect(fiveHours).toContain('maple-sleeping');
  });

  it('uses elapsed seconds, dedupes IDs, and ignores broken sessions', () => {
    const evidence = summarizeEvidence([
      session('1', '2026-11-01T12:00:00', 3599),
      session('1', '2026-11-01T12:00:00', 3599),
      session('2', 'invalid-date', 10000),
      session('3', '2026-11-02T12:00:00', -20),
      session('4', '2026-11-02T12:00:00', 61, 'routine-1'),
    ]);
    expect(evidence).toEqual({ sessions: 2, minutes: 61, days: 2, streak: 2, routines: 1 });
    expect(deriveEarned(evidence)).toContain('first-hour');
  });

  it('recognizes a historical consecutive-day milestone', () => {
    const evidence = summarizeEvidence([
      session('1', '2026-11-01T20:00:00'),
      session('2', '2026-11-02T08:00:00'),
      session('3', '2026-11-03T10:00:00'),
      session('4', '2026-11-06T09:00:00'),
    ]);
    expect(evidence.streak).toBe(3);
    expect(deriveEarned(evidence)).toContain('groove');
  });

  it('preserves previously earned items and saved companion milestones', () => {
    const empty = summarizeEvidence([]);
    expect(deriveEarned(empty, ['ten-hours'], ['milo', 'maple'])).toEqual(['first-hour', 'five-hours', 'ten-hours']);
    expect(achievementProgress('first-hour', empty, ['milo'])).toBe(60);
  });

  it('keeps visibility independent of achievements and account scope', () => {
    const store = memoryStore();
    expect(readEarned('a', store)).toEqual([]);
    saveEarned('a', ['first-notes'], store);
    saveEarned('a', [], store);
    expect(readEarned('a', store)).toEqual(['first-notes']);
    expect(readEarned('b', store)).toEqual([]);
    const preferences = readRoomPreferences('a', store);
    expect(isItemVisible('luna', preferences)).toBe(false);
    expect(isItemVisible('bookshelf-plants', preferences)).toBe(true);
    preferences.visibility['bookshelf-plants'] = false;
    expect(saveRoomPreferences('a', preferences, store)).toBe(true);
    expect(isItemVisible('bookshelf-plants', readRoomPreferences('a', store))).toBe(false);
    expect(isItemVisible('bookshelf-plants', readRoomPreferences('b', store))).toBe(true);
    preferences.placements = { milo: 1 };
    expect(saveRoomPreferences('a', preferences, store)).toBe(true);
    expect(readRoomPreferences('a', store).placements?.milo).toBe(1);
    expect(readRoomPreferences('b', store).placements?.milo).toBeUndefined();
    const legacy = memoryStore();
    legacy.setItem('little-jazz-room:studio-layout:v1:old', JSON.stringify({ visibility: { armchair: false } }));
    expect(isItemVisible('bookshelf-plants', readRoomPreferences('old', legacy))).toBe(false);
  });
});
