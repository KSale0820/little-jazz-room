import type { PracticeSessionRecord } from '../types/content';

export const PRACTICE_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
export const PRACTICE_CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface PracticeCalendarDay {
  day: number;
  dateTime: string;
  seconds: number;
  minutes: number;
  practiced: boolean;
  isToday: boolean;
}

/** Local calendar days; timestamps are never grouped by their UTC date. */
export function practiceCalendarMonth(
  sessions: PracticeSessionRecord[],
  year: number,
  month: number,
  now = new Date(),
): (PracticeCalendarDay | null)[] {
  const startsOn = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const secondsByDay = new Map<number, number>();
  for (const session of sessions) {
    const date = new Date(session.finishedAt);
    if (Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year || date.getMonth() !== month) continue;
    const seconds = Number(session.durationSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) continue;
    secondsByDay.set(date.getDate(), (secondsByDay.get(date.getDate()) ?? 0) + seconds);
  }
  const days: (PracticeCalendarDay | null)[] = Array(startsOn).fill(null);
  for (let day = 1; day <= count; day++) {
    const seconds = secondsByDay.get(day) ?? 0;
    const date = new Date(year, month, day, 12);
    days.push({
      day,
      dateTime: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      seconds,
      minutes: Math.round(seconds / 60),
      practiced: seconds > 0,
      isToday: date.toDateString() === now.toDateString(),
    });
  }
  return days;
}
