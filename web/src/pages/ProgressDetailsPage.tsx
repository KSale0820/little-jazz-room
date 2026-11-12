import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cumulativePracticeMinutes, readPreviouslySelectedCat, readSavedUnlocks, unlockedCompanions } from '../lib/companionUnlocks';
import { computeGentleStreak } from '../lib/practiceStats';
import { readLocalList, journalKey, notesKey, type ChartNote, type PracticeJournalEntry } from '../lib/practicePlayerNotes';
import { isVisibleCatId } from '../features/cats/CatCompanion';
import type { PracticeSessionRecord } from '../types/content';
import './ProgressDetailsPage.css';

type DetailView = 'achievements' | 'calendar' | 'journal' | 'notes' | 'activity';
const TITLES: Record<DetailView, string> = {
  achievements: 'Achievements', calendar: 'Practice Calendar', journal: 'Practice Journal',
  notes: 'Saved Notes', activity: 'Practice History',
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const localDay = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const sessionDay = (value: string) => localDay(new Date(value));
const minutes = (seconds: number) => Math.round(Math.max(0, seconds) / 60);
const dateLabel = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function SessionItem({ session, label, onSelect }: { session: PracticeSessionRecord; label: string; onSelect: () => void }) {
  return <button type="button" className="pd-entry pd-session" onClick={onSelect}>
    <span className="pd-entry-glyph" aria-hidden="true">♫</span>
    <span className="pd-entry-copy"><strong>{label}</strong><small>{dateLabel(session.finishedAt)} · {minutes(session.durationSeconds)} min</small></span>
    <span className="pd-chevron" aria-hidden="true">›</span>
  </button>;
}

export function ProgressDetailsPage() {
  const { view: rawView } = useParams();
  const view: DetailView = rawView === 'achievements' || rawView === 'calendar' || rawView === 'journal' || rawView === 'notes' || rawView === 'activity'
    ? rawView : 'activity';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { repo, sessions, routines, exercises, charts, catId } = useApp();
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => localDay(new Date()));
  const [expandedJournal, setExpandedJournal] = useState<string | null>(null);
  const journalEntries = useMemo(() => readLocalList<PracticeJournalEntry>(journalKey(repo.scope))
    .filter(item => item && typeof item.text === 'string')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [repo.scope]);
  const annotations = useMemo(() => charts.flatMap(chart =>
    readLocalList<ChartNote>(notesKey(repo.scope, chart.id))
      .filter(note => note && typeof note.text === 'string')
      .map(note => ({ ...note, chartId: chart.id, chartTitle: chart.title,
        exercises: exercises.filter(ex => ex.chart_id === chart.id).map(ex => ex.title) }))
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [repo.scope, charts, exercises]);
  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)), [sessions]);
  const titleFor = (s: PracticeSessionRecord) => routines.find(r => r.id === s.routineId)?.title
    ?? s.routineTitle ?? exercises.find(e => e.id === s.exerciseId)?.title ?? 'Free Practice';
  const selectedSession = orderedSessions.find(s => s.id === params.get('session'));
  const practiceMinutes = cumulativePracticeMinutes(sessions);
  const prevCat = readPreviouslySelectedCat(repo.scope);
  const unlocked = unlockedCompanions(practiceMinutes, readSavedUnlocks(repo.scope), isVisibleCatId(catId) ? catId : prevCat);
  const streak = computeGentleStreak(sessions);
  const milestones = [
    { title: 'First Practice', desc: 'Complete your first session', current: sessions.length, target: 1 },
    { title: 'Getting Consistent', desc: 'Practice on 3 consecutive days', current: streak, target: 3 },
    { title: 'In the Groove', desc: 'Practice on 7 consecutive days', current: streak, target: 7 },
    { title: 'Meet Milo', desc: 'Earn 60 minutes of practice', current: practiceMinutes, target: 60, earned: unlocked.includes('milo') },
    { title: 'Meet Maple', desc: 'Earn 300 minutes of practice', current: practiceMinutes, target: 300, earned: unlocked.includes('maple') },
    { title: 'First Guided Routine', desc: 'Finish a practice routine', current: sessions.filter(s => Boolean(s.routineId)).length, target: 1 },
  ];
  const earned = milestones.filter(m => m.earned ?? (m.current >= m.target)).length;

  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayTotals = new Map<string, number>();
  sessions.forEach(s => {
    const d = new Date(s.finishedAt);
    if (Number.isNaN(d.getTime())) return;
    const key = localDay(d);
    dayTotals.set(key, (dayTotals.get(key) ?? 0) + Math.max(0, s.durationSeconds));
  });
  const selectedSessions = orderedSessions.filter(s => sessionDay(s.finishedAt) === selectedDate);
  const selectedJournals = journalEntries.filter(e => sessionDay(e.createdAt) === selectedDate);
  const moveMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setMonthDate(next);
    setSelectedDate(localDay(next));
  };

  return <section className="pd-page" aria-label={TITLES[view]}>
    <header className="pd-header">
      <button type="button" onClick={() => navigate('/progress')} aria-label="Back to Progress" className="pd-back">‹</button>
      <div><span>Little Jazz Room</span><h1>{TITLES[view]}</h1></div>
    </header>

    {view === 'achievements' && <div className="pd-body">
      <p className="pd-intro">Milestones earned from your actual saved practice, not demo scores.</p>
      <div className="pd-total"><strong>{earned} / {milestones.length}</strong><span>milestones earned</span></div>
      <div className="pd-awards">{milestones.map(m => {
        const done = m.earned ?? (m.current >= m.target);
        return <article key={m.title} className={'pd-award ' + (done ? 'is-earned' : '')}>
          <span aria-hidden="true" className="pd-award-icon">{done ? '🏆' : '☆'}</span>
          <div><h2>{m.title}</h2><p>{m.desc}</p><small>{done ? 'Earned ✓' : Math.min(m.current, m.target) + ' / ' + m.target}</small></div>
        </article>;
      })}</div>
      <button type="button" className="pd-primary" onClick={() => navigate('/free-practice')}>Start Practicing</button>
    </div>}

    {view === 'calendar' && <div className="pd-body">
      <p className="pd-intro">Select a date to see how much you practiced and what you worked on.</p>
      <section className="pd-panel">
        <div className="pd-month"><button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">‹</button>
          <strong>{monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">›</button></div>
        <div className="pd-calendar" role="group" aria-label="Practice days">
          {DAY_NAMES.map(day => <span key={day} className="pd-dow">{day.slice(0, 1)}</span>)}
          {Array.from({ length: monthStart.getDay() }, (_, i) => <span key={'empty-' + i} aria-hidden="true" />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1), key = localDay(date), total = minutes(dayTotals.get(key) ?? 0);
            return <button type="button" key={key} onClick={() => setSelectedDate(key)}
              className={['pd-day', total > 0 ? 'has-session' : '', key === selectedDate ? 'is-selected' : ''].join(' ')}
              aria-pressed={key === selectedDate} aria-label={dateLabel(date.toISOString()) + ', ' + total + ' minutes'}>
              {i + 1}{total > 0 && <span aria-hidden="true" />}
            </button>;
          })}
        </div>
      </section>
      <h2 className="pd-subheading">{new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {minutes(dayTotals.get(selectedDate) ?? 0)} min</h2>
      {selectedSessions.map(s => <SessionItem key={s.id} session={s} label={titleFor(s)} onSelect={() => navigate('/progress/activity?session=' + encodeURIComponent(s.id))} />)}
      {selectedJournals.map(e => <article className="pd-panel pd-journal" key={e.id}><strong>{e.chartTitle}</strong><p>{e.text}</p></article>)}
      {!selectedSessions.length && !selectedJournals.length && <p className="pd-empty">Nothing recorded on this date.</p>}
    </div>}

    {view === 'journal' && <div className="pd-body">
      <p className="pd-intro">Reflections saved from the practice player on this device for this account.</p>
      {journalEntries.length ? journalEntries.map(entry => <article className="pd-panel pd-journal" key={entry.id}>
        <button type="button" className="pd-journal-toggle" onClick={() => setExpandedJournal(id => id === entry.id ? null : entry.id)}
          aria-expanded={expandedJournal === entry.id}>
          <span><strong>{entry.chartTitle || 'Practice session'}</strong><small>{dateLabel(entry.createdAt)} · {minutes(entry.durationSeconds)} min</small></span>
          <span aria-hidden="true">{expandedJournal === entry.id ? '⌃' : '⌄'}</span>
        </button>
        <p>{expandedJournal === entry.id ? entry.text : entry.text.slice(0, 140) + (entry.text.length > 140 ? '…' : '')}</p>
      </article>) : <p className="pd-empty">No journal entries yet. Add a reflection during practice and it will appear here.</p>}
    </div>}

    {view === 'notes' && <div className="pd-body">
      <p className="pd-intro">Your saved measure annotations for charts, including charts used by exercises.</p>
      {annotations.length ? annotations.map(note => <article className="pd-panel pd-annotation" key={note.chartId + '-' + note.bar}>
        <div><strong>{note.chartTitle} · Bar {note.bar}</strong><small>{dateLabel(note.updatedAt)}</small></div>
        <p>{note.text}</p>
        {note.exercises.length > 0 && <small>Used in: {note.exercises.join(', ')}</small>}
        <button type="button" onClick={() => navigate('/player?chart=' + encodeURIComponent(note.chartId))}>Open chart ›</button>
      </article>) : <p className="pd-empty">No chart annotations saved yet. Add them using the pencil in the chart player.</p>}
    </div>}

    {view === 'activity' && <div className="pd-body">
      <p className="pd-intro">Completed practice sessions saved to this account.</p>
      {selectedSession ? <article className="pd-panel pd-session-detail">
        <h2>{titleFor(selectedSession)}</h2>
        <p>{dateLabel(selectedSession.finishedAt)} · {minutes(selectedSession.durationSeconds)} minutes</p>
        {selectedSession.routineId && <p>Guided routine: {titleFor(selectedSession)}</p>}
        {selectedSession.exerciseId && <p>Exercise: {exercises.find(e => e.id === selectedSession.exerciseId)?.title ?? 'Saved exercise'}</p>}
        {journalEntries.filter(e => e.sessionId === selectedSession.id).map(e => <div key={e.id}><h3>Journal</h3><p>{e.text}</p></div>)}
        <button type="button" className="pd-link" onClick={() => navigate('/progress/activity')}>View all sessions</button>
      </article> : null}
      {!selectedSession && orderedSessions.map(s => <SessionItem key={s.id} session={s} label={titleFor(s)} onSelect={() => navigate('/progress/activity?session=' + encodeURIComponent(s.id))} />)}
      {!orderedSessions.length && <p className="pd-empty">No sessions yet. Finish a practice session to see it here.</p>}
    </div>}
  </section>;
}
