import { ACHIEVEMENTS, ROOM_ITEM_IDS, type AchievementId, type RoomItemId } from './achievementModel';

export interface RoomPreferences {
  /** An item can be earned but hidden. Hidden items are never revoked. */
  visibility: Partial<Record<RoomItemId, boolean>>;
  mutedCelebrations: boolean;
  /** Index of a predefined placement, independent of earned status. */
  placements?: Partial<Record<RoomItemId, number>>;
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
/** Keep previously saved per-item visibility when the old sprites are replaced. */
const LEGACY_ITEM_IDS: Record<string, RoomItemId> = {
  plant: 'piano-plant', armchair: 'bookshelf-plants',
  'music-stand': 'piano-sheet-music', lamp: 'piano-lamp',
  books: 'bookshelf-books', records: 'bookshelf-trumpet',
};

export function readRoomPreferences(scope: string, store: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): RoomPreferences {
  try {
    const raw = store?.getItem(key(ROOM_VERSION, scope));
    if (!raw) return { visibility: { ...DEFAULTS.visibility }, mutedCelebrations: true };
    const candidate: unknown = JSON.parse(raw);
    if (!candidate || typeof candidate !== 'object') return { ...DEFAULTS };
    const c = candidate as { visibility?: unknown; mutedCelebrations?: unknown; placements?: unknown };
    const rawVisibility = c.visibility && typeof c.visibility === 'object' ? c.visibility as Record<string, unknown> : {};
    const allowed: RoomItemId[] = ROOM_ITEM_IDS;
    const visibility: RoomPreferences['visibility'] = {};
    const rawPlacements = c.placements && typeof c.placements === 'object' ? c.placements as Record<string, unknown> : {};
    const placements: NonNullable<RoomPreferences['placements']> = {};
    for (const id of allowed) {
      const n = rawPlacements[id];
      if (Number.isInteger(n) && (n === 0 || n === 1)) placements[id] = n as number;
    }
    for (const [oldId, newId] of Object.entries(LEGACY_ITEM_IDS)) {
      if (typeof rawVisibility[oldId] === 'boolean' && rawVisibility[newId] === undefined)
        visibility[newId] = rawVisibility[oldId] as boolean;
    }
    for (const id of allowed) if (typeof rawVisibility[id] === 'boolean') visibility[id] = rawVisibility[id] as boolean;
    return { visibility: { ...DEFAULTS.visibility, ...visibility }, mutedCelebrations: c.mutedCelebrations !== false, placements };
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
