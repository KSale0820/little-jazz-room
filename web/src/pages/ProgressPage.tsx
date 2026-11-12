import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { computeGentleStreak, computeScheduledStreak, minutesToday } from '../lib/practiceStats';
import { readPracticeGoal, savePracticeGoal, readPracticeOffDays, savePracticeOffDays } from '../lib/practiceHomePreferences';
import { cumulativePracticeMinutes, readPreviouslySelectedCat, readSavedUnlocks, unlockedCompanions } from '../lib/companionUnlocks';
import { isVisibleCatId } from '../features/cats/CatCompanion';
import { readLocalList, journalKey, type PracticeJournalEntry } from '../lib/practicePlayerNotes';
import type { PracticeSessionRecord, Routine } from '../types/content';
import { ProgressIcon } from '../components/ProgressIcon';
import './ProgressPage.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const GOAL_OPTIONS = [10, 15, 20, 25, 30, 40, 45, 60, 75, 90, 120, 180, 240] as const;
type Period = 'W' | 'M' | 'Y';
type ChartBucket = { label: string; minutes: number; date?: string };

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
      label, minutes: Math.round(secondsByDay[index] / 60),
    })),
  };
}

/** Return the actual session routine, or free practice if it no longer exists. */
export function routineForReplay(session: PracticeSessionRecord | undefined, routines: Routine[]) {
  return session?.routineId && routines.some(r => r.id === session.routineId)
    ? session.routineId : null;
}

function dateLabel(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved session';
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function localDay(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function chartData(sessions: PracticeSessionRecord[], period: Period, now: Date): ChartBucket[] {
  if (period === 'W') {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return WEEKDAYS.map((label, i) => {
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
      const seconds = sessions.reduce((sum, s) => {
        const date = new Date(s.finishedAt);
        return date >= start && date < end ? sum + Math.max(0, s.durationSeconds) : sum;
      }, 0);
      return { label, minutes: Math.round(seconds / 60), date: localDay(start) };
    });
  }
  if (period === 'M') {
    const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
    const weeks = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() + offset) / 7);
    const secondsByWeek = Array<number>(weeks).fill(0);
    for (const session of sessions) {
      const date = new Date(session.finishedAt);
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        secondsByWeek[Math.floor((date.getDate() + offset - 1) / 7)] += Math.max(0, session.durationSeconds);
      }
    }
    return secondsByWeek.map((seconds, index) => ({ label: 'W' + (index + 1), minutes: Math.round(seconds / 60) }));
  }
  const secondsByMonth = Array<number>(12).fill(0);
  for (const session of sessions) {
    const date = new Date(session.finishedAt);
    if (date.getFullYear() === now.getFullYear()) secondsByMonth[date.getMonth()] += Math.max(0, session.durationSeconds);
  }
  return secondsByMonth.map((seconds, month) => ({
    label: new Date(now.getFullYear(), month, 1).toLocaleDateString(undefined, { month: 'short' }),
    minutes: Math.round(seconds / 60),
  }));
}

export function ProgressPage() {
  const { repo, sessions, catId, routines, exercises } = useApp();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('W');
  const [dailyGoal, setDailyGoal] = useState(() => readPracticeGoal(repo.scope));
  const [goalDraft, setGoalDraft] = useState(() => String(readPracticeGoal(repo.scope)));
  const [offDays, setOffDays] = useState(() => readPracticeOffDays(repo.scope));
  const [customGoalOpen, setCustomGoalOpen] = useState(false);
  useEffect(() => {
    const goal = readPracticeGoal(repo.scope);
    setDailyGoal(goal);
    setGoalDraft(String(goal));
    setOffDays(readPracticeOffDays(repo.scope));
    setCustomGoalOpen(false);
  }, [repo.scope]);
  const now = new Date();
  const summary = useMemo(() => summarizeProgress(sessions), [sessions]);
  const chart = chartData(sessions, period, now);
  const scheduledStreak = computeScheduledStreak(sessions, offDays, now);
  const ceilingBase = Math.max(1, ...chart.map(b => b.minutes), period === 'W' ? dailyGoal : 0);
  const chartCeiling = Math.max(15, Math.ceil(ceilingBase / 15) * 15);
  const chartTotal = period === 'W' ? summary.weekMinutes : chart.reduce((sum, day) => sum + day.minutes, 0);
  const periodLabel = period === 'W' ? 'This week' : period === 'M' ? 'This month' : 'This year';
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);
  const sessionsInPeriod = sessions.filter(s => {
    const date = new Date(s.finishedAt);
    if (period === 'W') return date >= weekStart && date < weekEnd;
    if (period === 'M') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    return date.getFullYear() === now.getFullYear();
  }).length;
  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)), [sessions]);
  const recentSessions = orderedSessions.slice(0, 3);
  const totalMinutes = cumulativePracticeMinutes(sessions);
  const previouslySelected = readPreviouslySelectedCat(repo.scope);
  const unlocked = unlockedCompanions(totalMinutes, readSavedUnlocks(repo.scope), isVisibleCatId(catId) ? catId : previouslySelected);
  const achievementsCount = [
    sessions.length > 0, scheduledStreak >= 3, scheduledStreak >= 7,
    unlocked.includes('milo'), unlocked.includes('maple'), sessions.some(s => Boolean(s.routineId)),
  ].filter(Boolean).length;
  const journals = readLocalList<PracticeJournalEntry>(journalKey(repo.scope));
  const sessionName = (session: PracticeSessionRecord) => routines.find(r => r.id === session.routineId)?.title
    ?? session.routineTitle ?? exercises.find(e => e.id === session.exerciseId)?.title
    ?? journals.find(j => j.sessionId === session.id)?.chartTitle ?? 'Free Practice';
  const sessionType = (session: PracticeSessionRecord) => session.routineId ? 'Routine' : session.exerciseId ? 'Exercise' : 'Practice';
  const saveGoal = () => {
    const saved = savePracticeGoal(repo.scope, Number(goalDraft));
    setDailyGoal(saved);
    setGoalDraft(String(saved));
    setCustomGoalOpen(false);
  };
  const chooseGoal = (selected: string) => {
    if (selected === 'custom') { setGoalDraft(String(dailyGoal)); setCustomGoalOpen(true); return; }
    const saved = savePracticeGoal(repo.scope, Number(selected));
    setDailyGoal(saved);
    setGoalDraft(String(saved));
    setCustomGoalOpen(false);
  };
  const toggleOffDay = (day: number) => setOffDays(current =>
    savePracticeOffDays(repo.scope, current.includes(day) ? current.filter(d => d !== day) : [...current, day]));

  return <section className="pr-page" aria-label="Progress">
    <header className="pr-header">
      <div className="pr-heading">
        <p className="pr-brand">Little Jazz Room <span aria-hidden="true">♫</span></p>
        <h1>Progress</h1>
        <p className="pr-subtitle">Your practice journey at a glance.</p>
      </div>
      <button type="button" className="pr-settings" aria-label="Settings" onClick={() => navigate('/profile')}>
        <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2h4l.7 2.5 1.5.8 2.3-1.3 2.8 2.8L20 9.1l.7 1.6L23 11v4l-2.3.7-.7 1.6 1.3 2.3-2.8 2.8-2.3-1.3-1.5.7L14 24h-4l-.7-2.2-1.5-.7-2.3 1.3-2.8-2.8L4 17.3l-.7-1.6L1 15v-4l2.3-.3L4 9.1 2.7 6.8l2.8-2.8 2.3 1.3 1.5-.8z" transform="translate(0,-1) scale(.92) translate(1,1)" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      </button>
    </header>

    <div className="pr-milestones">
      <button type="button" className="pr-milestone pr-streak" onClick={() => navigate('/free-practice')}>
        <span className="pr-milestone-icon" aria-hidden="true"><img src="/visuals/pixel-motifs/streak-fire.png" alt="" /></span>
        <span className="pr-milestone-text"><strong>{scheduledStreak}-day streak</strong><small>{scheduledStreak > 0 ? 'Keep it going!' : 'Start your streak!'}</small></span><span aria-hidden="true" className="pr-chevron">›</span>
      </button>
      <button type="button" className="pr-milestone pr-achievement" onClick={() => navigate('/progress/achievements')}>
        <span className="pr-milestone-icon" aria-hidden="true"><img src="/visuals/progress/pixel-trophy-new.png" alt="" /></span>
        <span className="pr-milestone-text"><strong>{achievementsCount} achievements</strong><small>View my room</small></span><span aria-hidden="true" className="pr-chevron">›</span>
      </button>
    </div>

    <section className="pr-card pr-overview" aria-labelledby="pr-chart-title">
      <div className="pr-section-head">
        <h2 id="pr-chart-title">Practice Overview</h2>
        <div className="pr-periods" role="group" aria-label="Chart time period">
          {(['W','M','Y'] as const).map(key => <button key={key} type="button" className={period === key ? 'active' : ''} aria-pressed={period === key} aria-label={key === 'W' ? 'Week' : key === 'M' ? 'Month' : 'Year'} onClick={() => setPeriod(key)}>{key}</button>)}
        </div>
      </div>
      <div className="pr-overview-info">
        <div><strong>{chartTotal >= 60 ? Math.floor(chartTotal / 60) + ' h ' + (chartTotal % 60) + ' min' : chartTotal + ' min'}</strong><small>{periodLabel}</small></div>
        <div className="pr-overview-sessions"><strong>{sessionsInPeriod}</strong><small>sessions</small></div>
        {period === 'W' && <p className="pr-target-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="12" r="8" /><circle cx="11" cy="12" r="4.5" /><path d="M11 12l8-8M16 4h3v3" /></svg>
          <span>Goal: {dailyGoal} min / day</span>
        </p>}
      </div>
      <div className="pr-chart">
        <div className="pr-y-axis" aria-hidden="true"><span>{chartCeiling}m</span><span>{Math.round(chartCeiling / 2)}m</span><span>0</span></div>
        <div className="pr-plot-wrap">
          <div className="pr-plot" aria-label={periodLabel + ' practice minutes'}>
            {period === 'W' && <span className="pr-goal-line" style={{ bottom: (dailyGoal / chartCeiling * 100) + '%' }} aria-hidden="true" />}
            <div className="pr-bars" style={{ gridTemplateColumns: 'repeat(' + chart.length + ', minmax(0, 1fr))' }}>
              {chart.map((bucket, i) => <div className="pr-bar-slot" key={bucket.label} aria-label={bucket.label + ': ' + bucket.minutes + ' minutes'}>
                <div className={'pr-bar ' + (period === 'W' && i === (now.getDay() + 6) % 7 ? 'pr-bar-today' : '')}
                  style={{ height: Math.min(100, bucket.minutes / chartCeiling * 100) + '%' }} />
              </div>)}
            </div>
          </div>
          <div className="pr-day-labels" style={{ gridTemplateColumns: 'repeat(' + chart.length + ', minmax(0, 1fr))' }}>
            {chart.map((bucket, i) => period === 'W' && bucket.date
              ? <button type="button" key={bucket.label} className="pr-day-label" onClick={() => navigate('/progress/calendar?date=' + bucket.date)}>
                  <span>{bucket.label}</span>
                  <span className={'pr-day-check ' + (bucket.minutes >= dailyGoal ? 'is-met' : offDays.includes(i) ? 'is-rest' : '')} aria-label={bucket.minutes >= dailyGoal ? 'Goal met' : offDays.includes(i) ? 'Rest day' : 'Goal not met'}>
                    {bucket.minutes >= dailyGoal ? '✓' : offDays.includes(i) ? '–' : '○'}
                  </span>
                </button>
              : <span className="pr-day-label" key={bucket.label}><span>{bucket.label}</span></span>)}
          </div>
        </div>
      </div>
    </section>

    <section className="pr-card pr-goal" aria-labelledby="pr-goal-title">
      <div className="pr-goal-intro">
        <h2 id="pr-goal-title">Practice Goal</h2>
        <p>Set your daily goal and rest days.</p>
      </div>
      <div className="pr-goal-input">
        <label htmlFor="pr-goal-minutes">Daily practice time</label>
        <div className="pr-goal-select-wrap">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 13V8M12 13l3 2M9 2h6" /></svg>
          <select id="pr-goal-minutes" aria-label="Daily practice time" value={dailyGoal}
            onChange={event => chooseGoal(event.target.value)}>
            {!GOAL_OPTIONS.includes(dailyGoal as typeof GOAL_OPTIONS[number]) && <option value={dailyGoal}>{dailyGoal} min</option>}
            {GOAL_OPTIONS.map(value => <option key={value} value={value}>{value} min</option>)}
            <option value="custom">Custom…</option>
          </select>
        </div>
      </div>
      <fieldset className="pr-off-days"><legend>Off days (optional)</legend>
        <div>{WEEKDAYS.map((day, i) => <button type="button" key={day} className={offDays.includes(i) ? 'is-off' : ''} aria-label={day + (offDays.includes(i) ? ', off day' : ', practice day')} aria-pressed={offDays.includes(i)} onClick={() => toggleOffDay(i)}>{day[0]}</button>)}</div>
      </fieldset>
      {customGoalOpen && <form className="pr-custom-goal" onSubmit={event => { event.preventDefault(); saveGoal(); }}>
        <label htmlFor="pr-custom-goal-minutes">Custom goal (5–240 minutes)</label>
        <input id="pr-custom-goal-minutes" type="number" min={5} max={240} step={5} value={goalDraft} required
          onChange={event => setGoalDraft(event.target.value)} />
        <button type="submit">Save</button>
        <button type="button" onClick={() => setCustomGoalOpen(false)}>Cancel</button>
      </form>}
    </section>

    <section className="pr-card pr-recent" aria-labelledby="pr-recent-title">
      <div className="pr-section-head"><h2 id="pr-recent-title">Recent Practice</h2><button type="button" className="pr-view-all" onClick={() => navigate('/progress/activity')}>View All ›</button></div>
      {recentSessions.length ? <div className="pr-session-list">{recentSessions.map(session => <button type="button" className="pr-session" key={session.id} onClick={() => navigate('/progress/activity?session=' + encodeURIComponent(session.id))}>
        <span className="pr-session-icon" aria-hidden="true"><ProgressIcon name={session.routineId ? 'routine' : session.exerciseId ? 'exercise' : 'music'} /></span>
        <span className="pr-session-detail"><strong>{sessionName(session)}</strong><small>{sessionType(session)} · {Math.round(Math.max(0, session.durationSeconds) / 60)} min · {dateLabel(session.finishedAt, now)}</small></span>
        <span className="pr-chevron" aria-hidden="true">›</span>
      </button>)}</div> : <p className="pr-empty">No sessions yet. Your completed practice will appear here.</p>}
    </section>

    <nav className="pr-quick-links" aria-label="Saved practice information">
      <button type="button" className="pr-shortcut pr-shortcut-calendar" onClick={() => navigate('/progress/calendar')}>
        <span className="pr-shortcut-icon" aria-hidden="true"><ProgressIcon name="calendar" /></span><strong>Practice Calendar</strong><span className="pr-chevron" aria-hidden="true">›</span>
      </button>
      <button type="button" className="pr-shortcut pr-shortcut-journal" onClick={() => navigate('/progress/journal')}>
        <span className="pr-shortcut-icon" aria-hidden="true"><ProgressIcon name="journal" /></span><strong>Journal</strong><span className="pr-chevron" aria-hidden="true">›</span>
      </button>
      <button type="button" className="pr-shortcut pr-shortcut-notes" onClick={() => navigate('/progress/notes')}>
        <span className="pr-shortcut-icon" aria-hidden="true"><ProgressIcon name="notes" /></span><strong>Notes</strong><span className="pr-chevron" aria-hidden="true">›</span>
      </button>
    </nav>
  </section>;
}
