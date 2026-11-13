import type { PracticeSessionRecord } from '../../types/content';
import type { VisibleCatId } from '../cats/CatCompanion';

/**
 * Achievements are earned from completed, positive-duration sessions only.
 * Keep this separate from decorative visibility and current-cat selection.
 */
export const ACHIEVEMENTS = [
  { id: 'first-notes', name: 'First Notes', description: 'Complete your first practice session.', kind: 'sessions', target: 1, reward: 'piano-plant' },
  { id: 'first-hour', name: 'First Hour', description: 'Reach 60 cumulative practice minutes.', kind: 'minutes', target: 60, reward: 'milo' },
  { id: 'three-days', name: 'Finding Your Rhythm', description: 'Practice on three different days.', kind: 'days', target: 3, reward: 'bookshelf-plants' },
  { id: 'routine-regular', name: 'Routine Regular', description: 'Complete three guided practice sessions.', kind: 'routines', target: 3, reward: 'piano-sheet-music' },
  { id: 'groove', name: 'Finding Your Groove', description: 'Practice on three consecutive days.', kind: 'streak', target: 3, reward: 'piano-lamp' },
  { id: 'five-hours', name: 'Practice Companion', description: 'Practice for 300 total minutes.', kind: 'minutes', target: 300, reward: 'maple' },
  { id: 'ten-sessions', name: 'Building a Habit', description: 'Complete ten practice sessions.', kind: 'sessions', target: 10, reward: 'bookshelf-books' },
  { id: 'ten-hours', name: 'Jazz Collector', description: 'Practice for 600 total minutes.', kind: 'minutes', target: 600, reward: 'bookshelf-trumpet' },
] as const;

export type AchievementId = typeof ACHIEVEMENTS[number]['id'];
/** The 8 uploaded sprites are rewards for existing milestones; no new unlock criteria are introduced. */
export const BONUS_ROOM_REWARDS = [
  { after: 'first-hour', reward: 'bookshelf-cat' },
  { after: 'five-hours', reward: 'piano-busts' },
] as const;
/** Only permanent wall shelves and Luna start unlocked. */
export const STARTER_ROOM_ITEMS = [
  'wall-shelves', 'luna-sitting',
] as const;
export const EXTRA_ROOM_REWARDS = [
  { after: 'first-notes', reward: 'couch' },
  { after: 'three-days', reward: 'curtain-left' },
  { after: 'three-days', reward: 'curtain-right' },
  { after: 'first-notes', reward: 'jazz-portraits' },
  { after: 'groove', reward: 'wall-shelf-plants' },
  { after: 'ten-hours', reward: 'cat-toys' },
  { after: 'first-hour', reward: 'wall-guitar' },
  { after: 'first-hour', reward: 'cat-tree' },
  { after: 'first-hour', reward: 'cat-tree-sleeping-cat' },
  { after: 'three-days', reward: 'sofa-pillows' },
  { after: 'five-hours', reward: 'upright-bass' },
  { after: 'routine-regular', reward: 'bench-cushion' },
  { after: 'five-hours', reward: 'ottoman' },
  { after: 'ten-sessions', reward: 'music-stand' },
  { after: 'first-notes', reward: 'side-table' },
  { after: 'first-hour', reward: 'milo-sleeping' },
  { after: 'five-hours', reward: 'maple-sleeping' },
] as const;
export type RoomItemId =
  | typeof ACHIEVEMENTS[number]['reward']
  | typeof BONUS_ROOM_REWARDS[number]['reward']
  | typeof STARTER_ROOM_ITEMS[number]
  | typeof EXTRA_ROOM_REWARDS[number]['reward']
  | 'luna';
export const ROOM_ITEM_IDS: RoomItemId[] = [
  'luna', ...STARTER_ROOM_ITEMS,
  ...ACHIEVEMENTS.map(a => a.reward),
  ...BONUS_ROOM_REWARDS.map(a => a.reward),
  ...EXTRA_ROOM_REWARDS.map(a => a.reward),
];
export type AchievementKind = typeof ACHIEVEMENTS[number]['kind'];

export interface PracticeEvidence {
  sessions: number;
  minutes: number;
  days: number;
  streak: number;
  routines: number;
}

/** Convert local calendar dates to UTC day ordinals; day differences survive DST. */
function localDayOrdinal(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export function summarizeEvidence(sessions: readonly PracticeSessionRecord[]): PracticeEvidence {
  const seen = new Set<string>();
  const days = new Set<number>();
  let seconds = 0;
  let count = 0;
  let routines = 0;

  for (const session of sessions) {
    if (!session.id || seen.has(session.id)) continue;
    seen.add(session.id);
    const date = new Date(session.finishedAt);
    const duration = Number(session.durationSeconds);
    if (!Number.isFinite(date.getTime()) || !Number.isFinite(duration) || duration <= 0) continue;
    seconds += duration;
    count += 1;
    if (session.routineId) routines += 1;
    days.add(localDayOrdinal(date));
  }

  const sorted = [...days].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return {
    sessions: count,
    minutes: Math.floor(seconds / 60),
    days: days.size,
    streak: longest,
    routines,
  };
}

export function achievementProgress(
  id: AchievementId,
  evidence: PracticeEvidence,
  savedCats: readonly VisibleCatId[] = [],
): number {
  const achievement = ACHIEVEMENTS.find(a => a.id === id)!;
  const measured = evidence[achievement.kind];
  // Companion unlocks are durable, even when historical sessions are no longer loaded.
  if (id === 'first-hour' && savedCats.includes('milo')) return achievement.target;
  if (id === 'five-hours' && savedCats.includes('maple')) return achievement.target;
  return Math.max(0, Math.min(achievement.target, measured));
}

export function deriveEarned(
  evidence: PracticeEvidence,
  previouslyEarned: readonly AchievementId[] = [],
  savedCats: readonly VisibleCatId[] = [],
): AchievementId[] {
  return ACHIEVEMENTS.filter(a =>
    previouslyEarned.includes(a.id) ||
    achievementProgress(a.id, evidence, savedCats) >= a.target
  ).map(a => a.id);
}

export function unlockedRoomItems(earned: readonly AchievementId[]): RoomItemId[] {
  return ['luna', ...STARTER_ROOM_ITEMS,
    ...ACHIEVEMENTS.filter(a => earned.includes(a.id)).map(a => a.reward),
    ...BONUS_ROOM_REWARDS.filter(a => earned.includes(a.after)).map(a => a.reward),
    ...EXTRA_ROOM_REWARDS.filter(a => earned.includes(a.after)).map(a => a.reward),
  ];
}
