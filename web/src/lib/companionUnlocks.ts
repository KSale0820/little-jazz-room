import type { PracticeSessionRecord } from '../types/content';
import { VISIBLE_CAT_IDS, isVisibleCatId, COMPANION_UNLOCK_MINUTES, type VisibleCatId } from '../features/cats/CatCompanion';
export { COMPANION_UNLOCK_MINUTES } from '../features/cats/CatCompanion';

const UNLOCK_KEY = 'little-jazz-room:unlocked-companions:v1';
const SELECTED_KEY = 'little-jazz-room:selected-cat:v1';

export function companionUnlockStorageKey(accountKey: string): string {
  return `${UNLOCK_KEY}:${accountKey}`;
}

/** Use elapsed time, not rounded individual sessions, to prevent tiny sessions inflating unlocks. */
export function cumulativePracticeMinutes(sessions: PracticeSessionRecord[]): number {
  return Math.floor(sessions.reduce((total, session) => {
    const seconds = Number(session.durationSeconds);
    return total + (Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
  }, 0) / 60);
}

export function readSavedUnlocks(accountKey: string, storage?: Pick<Storage, 'getItem'>): VisibleCatId[] {
  try {
    const value = (storage ?? window.localStorage).getItem(companionUnlockStorageKey(accountKey));
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? VISIBLE_CAT_IDS.filter(id => parsed.includes(id)) : [];
  } catch { return []; }
}

/** Preserve an existing saved selection, even when its old practice history is unavailable. */
export function readPreviouslySelectedCat(accountKey: string, storage?: Pick<Storage, 'getItem'>): VisibleCatId | null {
  try {
    const key = accountKey === 'local' ? SELECTED_KEY : `${SELECTED_KEY}:${accountKey}`;
    const catId = (storage ?? window.localStorage).getItem(key);
    return isVisibleCatId(catId) ? catId : null;
  } catch { return null; }
}

export function unlockedCompanions(
  practiceMinutes: number,
  previouslyUnlocked: readonly VisibleCatId[] = [],
  previouslySelected: VisibleCatId | null = null,
): VisibleCatId[] {
  return VISIBLE_CAT_IDS.filter(id =>
    practiceMinutes >= COMPANION_UNLOCK_MINUTES[id] ||
    previouslyUnlocked.includes(id) ||
    previouslySelected === id,
  );
}

export function saveUnlockedCompanions(
  accountKey: string,
  ids: readonly VisibleCatId[],
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): void {
  try {
    const store = storage ?? window.localStorage;
    const previouslySaved = readSavedUnlocks(accountKey, store);
    const merged = VISIBLE_CAT_IDS.filter(id => ids.includes(id) || previouslySaved.includes(id));
    const key = companionUnlockStorageKey(accountKey);
    const value = JSON.stringify(merged);
    if (store.getItem(key) !== value) store.setItem(key, value);
  } catch { /* Some browsers disable storage. Practice-based unlocks still work. */ }
}
