export type RoomPanelId = 'music-stand' | 'notebook' | 'plants' | 'lighting' | null;

export type RoomObjectId = 'piano' | 'stand' | 'notebook' | 'plants';

export type RoomAction =
  | { kind: 'navigate'; to: string }
  | { kind: 'panel'; panel: Exclude<RoomPanelId, null> };

export function actionForObject(id: RoomObjectId): RoomAction {
  switch (id) {
    case 'piano':
      return { kind: 'navigate', to: '/practice' };
    case 'stand':
      return { kind: 'panel', panel: 'music-stand' };
    case 'notebook':
      return { kind: 'panel', panel: 'notebook' };
    case 'plants':
      return { kind: 'panel', panel: 'plants' };
  }
}

/** Only one panel is open at a time; activating the open panel again closes it. */
export function nextPanel(current: RoomPanelId, requested: RoomPanelId): RoomPanelId {
  return current === requested ? null : requested;
}

export const CAT_PROFILE_NAVIGATION = { to: '/profile', state: { scrollToCat: true } } as const;

export interface RoutineLike {
  id: string;
  is_seed?: boolean;
}

/** User-made routines first (is_seed === false), built-in examples after. */
export function groupRoutines<T extends RoutineLike>(routines: T[]): { mine: T[]; examples: T[] } {
  return {
    mine: routines.filter(r => r.is_seed === false),
    examples: routines.filter(r => r.is_seed !== false),
  };
}
