import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { useApp } from '../context/AppContext';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { computeGentleStreak, minutesToday } from '../lib/practiceStats';
import type { PracticeSessionRecord, Routine } from '../types/content';
import './ProgressPage.css';

// The same daily target as H01 Home. This is a goal, not seeded progress.
const DAILY_GOAL_MINUTES = 30;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Derive current local calendar-week totals from saved sessions (Monday–Sunday). */
export function summarizeProgress(sessions: PracticeSessionRecord[], now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const secondsByDay = Array<number>(7).fill(0);
  let secondsThisWeek = 0;
  for (const session of sessions) {
    const date = new Date(session.finishedAt);
    if (Number.isNaN(date.getTime()) || date < monday || date >= nextMonday) continue;
    const seconds = Math.max(0, session.durationSeconds || 0);
    secondsByDay[(date.getDay() + 6) % 7] += seconds;
    secondsThisWeek += seconds;
  }
  return {
    streak: computeGentleStreak(sessions),
    todayMinutes: minutesToday(sessions),
    weekMinutes: Math.round(secondsThisWeek / 60),
    weekDays: WEEKDAYS.map((label, index) => ({
      label,
      minutes: Math.round(secondsByDay[index] / 60),
    })),
  };
}

/** Return the actual session routine, or free practice if it no longer exists. */
export function routineForReplay(session: PracticeSessionRecord | undefined, routines: Routine[]) {
  return session?.routineId && routines.some(r => r.id === session.routineId)
    ? session.routineId : null;
}

function sessionDateLabel(value: string, now: Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved session';
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ProgressPage() {
  const { sessions, catId, routines, exercises, setActiveRoutineId } = useApp();
  const navigate = useNavigate();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const now = new Date();
  const summary = useMemo(() => summarizeProgress(sessions), [sessions]);
  const orderedSessions = useMemo(() => [...sessions].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  ), [sessions]);
  const recentSessions = showAllHistory ? orderedSessions : orderedSessions.slice(0, 2);
  const cat = JAZZ_CATS.find(c => c.id === catId);
  const goalPercent = Math.min(100, (summary.todayMinutes / DAILY_GOAL_MINUTES) * 100);
  const maxChartMinutes = Math.max(30, ...summary.weekDays.map(day => day.minutes));
  const chartCeiling = Math.ceil(maxChartMinutes / 15) * 15;

  const practiceAgain = () => {
    setActiveRoutineId(routineForReplay(orderedSessions[0], routines));
    navigate('/player');
  };

  return (
    <section className="g01-page" aria-label="Progress">
      <header className="g01-header">
        <h1>Progress</h1>
        <button type="button" className="g01-settings" aria-label="Settings" onClick={() => navigate('/profile')}>
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.1 2.7h3.8l.6 2.1c.6.2 1.2.4 1.7.7l2-1.1 2.7 2.7-1.1 2c.3.5.5 1.1.7 1.7l2.1.6v3.8l-2.1.6c-.2.6-.4 1.2-.7 1.7l1.1 2-2.7 2.7-2-1.1c-.5.3-1.1.5-1.7.7l-.6 2.1h-3.8l-.6-2.1c-.6-.2-1.2-.4-1.7-.7l-2 1.1-2.7-2.7 1.1-2c-.3-.5-.5-1.1-.7-1.7l-2.1-.6v-3.8l2.1-.6c.2-.6.4-1.2.7-1.7l-1.1-2 2.7-2.7 2 1.1c.5-.3 1.1-.5 1.7-.7z" transform="translate(0 -0.3) scale(.95) translate(.63 .63)" />
            <circle cx="12" cy="12" r="3.1" />
          </svg>
        </button>
      </header>

      <section className="g01-companion" aria-label={'Your jazz companion: ' + (cat?.name ?? 'Luna')}>
        <img className="g01-plant g01-plant-left" src={VISUAL_ASSETS.approvedDecor.plant} alt="" aria-hidden="true" />
        <img className="g01-plant g01-plant-right" src={VISUAL_ASSETS.approvedDecor.plant} alt="" aria-hidden="true" />
        <img className="g01-cat-cushion" src={VISUAL_ASSETS.progress.sleepCushion} alt="" aria-hidden="true" draggable={false} />
        <CatSprite catId={catId} variant="sleeping" size={204} className="g01-cat" />
        <p className="g01-cat-bubble">{orderedSessions.length ? 'Keep the rhythm going!' : 'Every practice starts somewhere!'}</p>
        <button type="button" className="g01-change" onClick={() => navigate('/profile', { state: { scrollToCat: true } })} aria-label={'Change companion, currently ' + (cat?.name ?? 'Luna')}>
          Change
        </button>
      </section>

      <div className="g01-stats" aria-label="Your practice statistics">
        <div className="g01-stat">
          <span className="g01-stat-icon g01-flame" aria-hidden="true">🔥</span>
          <div><strong>{summary.streak}</strong><span>day streak</span></div>
        </div>
        <div className="g01-stat">
          <span className="g01-stat-icon g01-bars-icon" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>{summary.weekMinutes}</strong><span>minutes this week</span></div>
        </div>
      </div>

      <section className="g01-daily-card" aria-labelledby="g01-goal-heading">
        <img src={VISUAL_ASSETS.progress.goalLeaves} alt="" className="g01-goal-plant" aria-hidden="true" onError={event => { event.currentTarget.style.display = "none"; }} />
        <h2 id="g01-goal-heading">Daily Goal</h2>
        <p>{summary.todayMinutes} / {DAILY_GOAL_MINUTES} min</p>
        <div className="g01-goal-track" role="progressbar" aria-label="Daily practice goal" aria-valuemin={0} aria-valuemax={DAILY_GOAL_MINUTES} aria-valuenow={Math.min(summary.todayMinutes, DAILY_GOAL_MINUTES)} aria-valuetext={summary.todayMinutes + ' of ' + DAILY_GOAL_MINUTES + ' minutes practiced today'}>
          <div className="g01-goal-fill" style={{ width: goalPercent + '%' }} />
        </div>
      </section>

      <section className="g01-week-chart" aria-label="Practice minutes by weekday">
        <div className="g01-chart-axis" aria-hidden="true"><span>{chartCeiling}</span><span>{chartCeiling / 2}</span><span>0</span></div>
        <div className="g01-chart-body">
          <div className="g01-chart-columns">
            {summary.weekDays.map((day, index) => (
              <div key={day.label} className="g01-chart-column" aria-label={day.label + ': ' + day.minutes + ' minutes'}>
                <div className={'g01-chart-bar ' + (index === (now.getDay() + 6) % 7 ? 'g01-chart-bar-today' : '')} style={{ height: (100 * day.minutes / chartCeiling) + '%' }} />
              </div>
            ))}
          </div>
          <div className="g01-chart-labels" aria-hidden="true">
            {summary.weekDays.map(day => <span key={day.label}>{day.label}</span>)}
          </div>
        </div>
      </section>

      <section className="g01-history" aria-labelledby="g01-history-heading">
        <div className="g01-history-heading">
          <h2 id="g01-history-heading">{showAllHistory ? 'Practice History' : 'Recent Sessions'}</h2>
          {orderedSessions.length > 0 && (
            <button type="button" onClick={() => setShowAllHistory(value => !value)} aria-expanded={showAllHistory}>
              {showAllHistory ? 'Show less' : 'See all'}
            </button>
          )}
        </div>
        {recentSessions.length ? (
          <ul className="g01-session-list">
            {recentSessions.map(session => {
              const routine = routines.find(r => r.id === session.routineId);
              const exercise = exercises.find(e => e.id === session.exerciseId);
              const minutes = Math.round(Math.max(0, session.durationSeconds) / 60);
              return (
                <li className="g01-session" key={session.id}>
                  <img src={VISUAL_ASSETS.vignettes.practice} alt="" aria-hidden="true" />
                  <div className="g01-session-copy">
                    <strong>{routine?.title ?? exercise?.title ?? 'Free practice'}</strong>
                    <span>{routine ? 'Guided practice' : 'Free practice'} · {minutes} min</span>
                  </div>
                  <time dateTime={session.finishedAt}>{sessionDateLabel(session.finishedAt, now)}</time>
                </li>
              );
            })}
          </ul>
        ) : <p className="g01-empty-history">No sessions yet. Finish a practice session to see it here.</p>}
      </section>

      <button type="button" className="g01-practice-again" onClick={practiceAgain}>
        {orderedSessions.length ? 'Practice Again' : 'Start Practicing'}
      </button>
    </section>
  );
}
