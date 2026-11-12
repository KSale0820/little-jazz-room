import type { PracticeSessionRecord } from '../types/content';

/** Gentle long-term progress: total logged practice minutes on this device. */
export const PRACTICE_MILESTONE_MINUTES = 300;

export function computeGentleStreak(sessions: PracticeSessionRecord[]): number {
  const days = new Set(sessions.map(s => new Date(s.finishedAt).toDateString()));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function minutesToday(sessions: PracticeSessionRecord[]): number {
  const today = new Date().toDateString();
  return sessions
    .filter(s => new Date(s.finishedAt).toDateString() === today)
    .reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
}

export function totalPracticeMinutes(sessions: PracticeSessionRecord[]): number {
  return sessions.reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
}

export function longTermProgressPercent(sessions: PracticeSessionRecord[]): number {
  return Math.min(
    100,
    Math.round((totalPracticeMinutes(sessions) / PRACTICE_MILESTONE_MINUTES) * 100)
  );
}

/** A rest day never breaks or inflates a streak; the current day gets a grace period until midnight. */
export function computeScheduledStreak(
  sessions: PracticeSessionRecord[], offDays: readonly number[], now = new Date(),
): number {
  const practiced = new Set(sessions.filter(s => Number.isFinite(new Date(s.finishedAt).getTime()))
    .map(s => new Date(s.finishedAt).toDateString()));
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayIsScheduled = !offDays.includes((date.getDay() + 6) % 7);
  if (todayIsScheduled && !practiced.has(date.toDateString())) date.setDate(date.getDate() - 1);
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    if (offDays.includes((date.getDay() + 6) % 7)) { date.setDate(date.getDate() - 1); continue; }
    if (!practiced.has(date.toDateString())) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}
