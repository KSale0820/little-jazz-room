import { describe, expect, it } from 'vitest';
import type { PracticeSessionRecord } from '../types/content';
import {
  cumulativePracticeMinutes,
  unlockedCompanions,
  readPreviouslySelectedCat,
  readSavedUnlocks,
  saveUnlockedCompanions,
  companionUnlockStorageKey,
} from './companionUnlocks';

const session = (id: string, durationSeconds: number): PracticeSessionRecord => ({
  id, durationSeconds, finishedAt: '2026-11-06T20:00:00.000Z',
});
const makeStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
};

describe('companion practice-time unlocks', () => {
  it('starts with Luna and unlocks Milo at 60 minutes and Maple at 300', () => {
    expect(unlockedCompanions(0)).toEqual(['luna']);
    expect(unlockedCompanions(59)).toEqual(['luna']);
    expect(unlockedCompanions(60)).toEqual(['luna', 'milo']);
    expect(unlockedCompanions(299)).toEqual(['luna', 'milo']);
    expect(unlockedCompanions(300)).toEqual(['luna', 'milo', 'maple']);
  });
  it('counts actual elapsed seconds rather than rounding up many tiny sessions', () => {
    expect(cumulativePracticeMinutes([session('a', 31), session('b', 29)])).toBe(1);
    expect(cumulativePracticeMinutes([session('a', 3599)])).toBe(59);
    expect(cumulativePracticeMinutes([session('a', -600), session('b', Number.NaN)])).toBe(0);
  });
  it('preserves existing choices as unlocks even without available practice history', () => {
    expect(unlockedCompanions(0, [], 'maple')).toEqual(['luna', 'maple']);
    expect(unlockedCompanions(0, ['milo'])).toEqual(['luna', 'milo']);
    expect(unlockedCompanions(60, ['maple'])).toEqual(['luna', 'milo', 'maple']);
  });
  it('stores unlocked IDs without resetting them and isolates accounts', () => {
    const storage = makeStorage();
    storage.setItem('little-jazz-room:selected-cat:v1:account-a', 'maple');
    expect(readPreviouslySelectedCat('account-a', storage)).toBe('maple');
    expect(readPreviouslySelectedCat('account-b', storage)).toBeNull();
    saveUnlockedCompanions('account-a', ['luna', 'maple'], storage);
    saveUnlockedCompanions('account-a', ['luna'], storage);
    expect(readSavedUnlocks('account-a', storage)).toEqual(['luna', 'maple']);
    expect(readSavedUnlocks('account-b', storage)).toEqual([]);
    expect(companionUnlockStorageKey('account-a')).not.toBe(companionUnlockStorageKey('account-b'));
  });
  it('ignores retired IDs and malformed stored data', () => {
    const storage = makeStorage();
    storage.setItem(companionUnlockStorageKey('local'), '["biscuit","milo","pepper"]');
    expect(readSavedUnlocks('local', storage)).toEqual(['milo']);
    storage.setItem(companionUnlockStorageKey('local'), '{bad json');
    expect(readSavedUnlocks('local', storage)).toEqual([]);
  });
});
