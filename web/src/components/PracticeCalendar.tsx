import { useMemo, useState } from 'react';
import type { PracticeSessionRecord } from '../types/content';
import { PRACTICE_CALENDAR_WEEKDAYS, PRACTICE_MONTH_NAMES, practiceCalendarMonth } from '../lib/practiceCalendar';
import './PracticeCalendar.css';

export function PracticeCalendar({ sessions }: { sessions: PracticeSessionRecord[] }) {
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = monthStart.getFullYear(), month = monthStart.getMonth();
  const now = new Date();
  const cells = useMemo(() => practiceCalendarMonth(sessions, year, month, now),
    [sessions, year, month, now.toDateString()]);
  const atPresent = year === now.getFullYear() && month === now.getMonth();
  const practicedDays = cells.filter(day => day?.practiced).length;
  const changeMonth = (delta: number) => setMonthStart(old =>
    new Date(old.getFullYear(), old.getMonth() + delta, 1));

  return (
    <section className="practice-calendar" aria-labelledby="practice-calendar-heading">
      <div className="practice-calendar-header">
        <div>
          <h2 id="practice-calendar-heading">Practice Calendar</h2>
          <p>{practicedDays} {practicedDays === 1 ? 'practice day' : 'practice days'} this month</p>
        </div>
        <div className="practice-calendar-month" aria-label="Change calendar month">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <strong aria-live="polite">{PRACTICE_MONTH_NAMES[month]} {year}</strong>
          <button type="button" onClick={() => changeMonth(1)} disabled={atPresent} aria-label="Next month">›</button>
        </div>
      </div>
      <div className="practice-calendar-grid" aria-label={`Practice calendar for ${PRACTICE_MONTH_NAMES[month]} ${year}`}>
        {PRACTICE_CALENDAR_WEEKDAYS.map(day =>
          <span key={day} className="practice-calendar-weekday" aria-hidden="true">{day.slice(0, 1)}</span>
        )}
        {cells.map((cell, index) => cell === null
          ? <span key={`empty-${index}`} aria-hidden="true" />
          : <time
              key={cell.dateTime}
              dateTime={cell.dateTime}
              className={[
                'practice-calendar-day',
                cell.practiced ? 'is-practiced' : '',
                cell.isToday ? 'is-today' : '',
              ].filter(Boolean).join(' ')}
              title={`${cell.dateTime}: ${cell.minutes} minutes practiced`}
              aria-label={`${PRACTICE_MONTH_NAMES[month]} ${cell.day}: ${cell.minutes} minutes practiced`}
            >{cell.day}</time>
        )}
      </div>
      <div className="practice-calendar-legend"><span className="practice-calendar-dot" aria-hidden="true" /> Practiced</div>
    </section>
  );
}
