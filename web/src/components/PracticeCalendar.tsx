import { useMemo, useState } from 'react';
import type { PracticeSessionRecord } from '../types/content';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function PracticeCalendar({ sessions }: { sessions: PracticeSessionRecord[] }) {
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const recorded = useMemo(() => new Set(sessions.filter(s => {
    const d = new Date(s.finishedAt); return d.getFullYear() === year && d.getMonth() === month;
  }).map(s => new Date(s.finishedAt).getDate())), [sessions, month, year]);
  const cells: (number | null)[] = [...Array<null>(new Date(year, month, 1).getDay()).fill(null),
    ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1)];
  const shift = (n: number) => setMonthDate(new Date(year, month + n, 1));
  return <section className="box g01-practice-calendar" aria-labelledby="practice-calendar-heading">
    <div className="between"><h2 id="practice-calendar-heading">Practice calendar</h2>
      <div className="row"><button type="button" className="btn tiny" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
        <strong className="tiny">{MONTHS[month]} {year}</strong>
        <button type="button" className="btn tiny" aria-label="Next month" onClick={() => shift(1)}>›</button></div></div>
    <div className="days calendar-grid" aria-label={`Practice calendar for ${MONTHS[month]} ${year}`}>
      {['S','M','T','W','T','F','S'].map((day, i) => <span key={day+i} className="calendar-dow">{day}</span>)}
      {cells.map((day, i) => day === null ? <span key={`pad-${i}`} className="calendar-pad" aria-hidden />
        : <span key={day} className={recorded.has(day) ? 'marked' : undefined} aria-label={`${MONTHS[month]} ${day}: ${recorded.has(day) ? 'practiced' : 'no practice recorded'}`}>{day}</span>)}
    </div>
  </section>;
}
