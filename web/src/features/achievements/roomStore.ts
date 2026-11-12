import { ACHIEVEMENTS, type AchievementId, type RoomItemId } from './achievementModel';

export interface RoomPreferences {
  /** An item can be earned but hidden. Hidden items are never revoked. */
  visibility: Partial<Record<RoomItemId, boolean>>;
  mutedCelebrations: boolean;
}

const EARNED_VERSION = 'little-jazz-room:achievements:v1';
const ROOM_VERSION = 'little-jazz-room:studio-layout:v1';

function key(prefix: string, scope: string): string {
  return prefix + ':' + scope;
}

export function readEarned(scope: string, store: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): AchievementId[] {
  try {
    const raw = store?.getItem(key(EARNED_VERSION, scope));
    const value: unknown = raw ? JSON.parse(raw) : [];
    return ACHIEVEMENTS.filter(a => Array.isArray(value) && value.includes(a.id)).map(a => a.id);
  } catch { return []; }
}

export function saveEarned(scope: string, ids: readonly AchievementId[], store: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): boolean {
  try {
    if (!store) return false;
    const merged = ACHIEVEMENTS.filter(a => ids.includes(a.id) || readEarned(scope, store).includes(a.id)).map(a => a.id);
    const next = JSON.stringify(merged);
    const storageKey = key(EARNED_VERSION, scope);
    if (store.getItem(storageKey) !== next) store.setItem(storageKey, next);
    return true;
  } catch { return false; }
}

const DEFAULTS: RoomPreferences = { visibility: { luna: false }, mutedCelebrations: true };

export function readRoomPreferences(scope: string, store: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): RoomPreferences {
  try {
    const raw = store?.getItem(key(ROOM_VERSION, scope));
    if (!raw) return { visibility: { ...DEFAULTS.visibility }, mutedCelebrations: true };
    const candidate: unknown = JSON.parse(raw);
    if (!candidate || typeof candidate !== 'object') return { ...DEFAULTS };
    const c = candidate as { visibility?: unknown; mutedCelebrations?: unknown };
    const rawVisibility = c.visibility && typeof c.visibility === 'object' ? c.visibility as Record<string, unknown> : {};
    const allowed: RoomItemId[] = ['luna', ...ACHIEVEMENTS.map(a => a.reward)];
    const visibility: RoomPreferences['visibility'] = {};
    for (const id of allowed) if (typeof rawVisibility[id] === 'boolean') visibility[id] = rawVisibility[id] as boolean;
    return { visibility: { ...DEFAULTS.visibility, ...visibility }, mutedCelebrations: c.mutedCelebrations !== false };
  } catch { return { visibility: { ...DEFAULTS.visibility }, mutedCelebrations: true }; }
}

export function saveRoomPreferences(
  scope: string,
  preferences: RoomPreferences,
  store: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): boolean {
  try {
    if (!store) return false;
    store.setItem(key(ROOM_VERSION, scope), JSON.stringify(preferences));
    return true;
  } catch { return false; }
}

export function isItemVisible(id: RoomItemId, preferences: RoomPreferences): boolean {
  return preferences.visibility[id] ?? (id !== 'luna');
}
