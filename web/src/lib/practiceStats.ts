import type { PracticeSessionRecord } from '../types/content';

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

/** Sample long-term progress toward a gentle 300-minute milestone. */
export function longTermProgressPercent(sessions: PracticeSessionRecord[]): number {
  const target = 300;
  return Math.min(100, Math.round((totalPracticeMinutes(sessions) / target) * 100));
}
