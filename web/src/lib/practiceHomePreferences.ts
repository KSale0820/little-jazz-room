/** Lightweight per-account Practice preferences. Never changes stored session data. */
const goalKey = (scope: string) => `little-jazz-room:daily-practice-goal:v1:${scope}`;
const pinKey = (scope: string) => `little-jazz-room:pinned-practice-routine:v1:${scope}`;

export const DEFAULT_DAILY_GOAL = 30;

export function normalizeGoalMinutes(value: number): number {
  return Number.isFinite(value) ? Math.max(5, Math.min(240, Math.round(value))) : DEFAULT_DAILY_GOAL;
}

export function readPracticeGoal(scope: string): number {
  try {
    const raw = window.localStorage.getItem(goalKey(scope));
    return raw === null || raw.trim() === '' ? DEFAULT_DAILY_GOAL : normalizeGoalMinutes(Number(raw));
  } catch {
    return DEFAULT_DAILY_GOAL;
  }
}

export function savePracticeGoal(scope: string, minutes: number): number {
  const next = normalizeGoalMinutes(minutes);
  try { window.localStorage.setItem(goalKey(scope), String(next)); } catch { /* offline memory-only */ }
  return next;
}

export function readPinnedPracticeRoutine(scope: string): string | null {
  try { return window.localStorage.getItem(pinKey(scope)) || null; }
  catch { return null; }
}

export function savePinnedPracticeRoutine(scope: string, id: string | null): void {
  try {
    if (id) window.localStorage.setItem(pinKey(scope), id);
    else window.localStorage.removeItem(pinKey(scope));
  } catch { /* offline memory-only */ }
}


/** Monday=0 through Sunday=6. Off days do not require meeting the daily goal. */
const offDaysKey = (scope: string) => `little-jazz-room:practice-off-days:v1:${scope}`;
export function readPracticeOffDays(scope: string): number[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(offDaysKey(scope)) ?? '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((day): day is number =>
      Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b) : [];
  } catch { return []; }
}
export function savePracticeOffDays(scope: string, days: number[]): number[] {
  const valid = [...new Set(days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))]
    .sort((a, b) => a - b);
  try { window.localStorage.setItem(offDaysKey(scope), JSON.stringify(valid)); }
  catch { /* optional device storage */ }
  return valid;
}
