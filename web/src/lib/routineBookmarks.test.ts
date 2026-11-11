import { afterEach, describe, expect, it, vi } from 'vitest';
import { readRoutineBookmarks, saveRoutineBookmarks } from './routineBookmarks';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

afterEach(() => vi.unstubAllGlobals());

describe('saved routine bookmarks', () => {
  it('persists saved IDs independently for each account scope', () => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    saveRoutineBookmarks('user-a', ['daily-warm-up', 'daily-warm-up', 'first-improv']);
    expect(readRoutineBookmarks('user-a')).toEqual(['daily-warm-up', 'first-improv']);
    expect(readRoutineBookmarks('user-b')).toEqual([]);
    saveRoutineBookmarks('user-a', ['first-improv']);
    expect(readRoutineBookmarks('user-a')).toEqual(['first-improv']);
  });

  it('uses the previous bookmark key and safely handles corrupt storage', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem('little-jazz-room:routine-bookmarks:v1:demo', '["daily-warm-up"]');
    expect(readRoutineBookmarks('demo')).toEqual(['daily-warm-up']);
    storage.setItem('little-jazz-room:routine-bookmarks:v1:demo', '{bad');
    expect(readRoutineBookmarks('demo')).toEqual([]);
  });
});
