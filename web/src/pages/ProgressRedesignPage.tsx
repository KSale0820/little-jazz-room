import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { useAppearance } from '../context/AppearanceContext';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { PracticeCalendar } from '../components/PracticeCalendar';
import { summarizeProgress, routineForReplay } from './ProgressPage';
import type { PracticeSessionRecord } from '../types/content';
import './ProgressRedesignPage.css';

const ART = VISUAL_ASSETS.progress.pianoPixel;
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function inCurrentWeek(session: PracticeSessionRecord, now: Date): boolean {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const finished = new Date(session.finishedAt);
  return !Number.isNaN(finished.getTime()) && finished >= monday && finished < nextMonday;
}

export function ProgressRedesignPage() {
  const { sessions, catId, routines, exercises, setActiveRoutineId } = useApp();
  const { theme, setMode, catMode, setCatMode } = useAppearance();
  const navigate = useNavigate();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const now = new Date();
  const summary = useMemo(() => summarizeProgress(sessions), [sessions]);
  const ordered = useMemo(() => [...sessions].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  ), [sessions]);
  const thisWeek = useMemo(() => ordered.filter(s => inCurrentWeek(s, now)), [ordered, now.toDateString()]);
  const recent = showAllHistory ? ordered : ordered.slice(0, 3);
  const cat = JAZZ_CATS.find(c => c.id === catId);
  const chartMax = Math.max(30, ...summary.weekDays.map(day => day.minutes));
  const chartCeiling = Math.ceil(chartMax / 15) * 15;
  const routineCount = new Set(thisWeek.map(s => s.routineId).filter(Boolean)).size;
  const studyCount = new Set(thisWeek.map(s =>
    exercises.find(e => e.id === s.exerciseId)?.chart_id
  ).filter(Boolean)).size;
  const monthDays = new Set(ordered.filter(s => {
    const d = new Date(s.finishedAt);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() && s.durationSeconds > 0;
  }).map(s => new Date(s.finishedAt).toLocaleDateString('en-CA'))).size;

  const replay = () => {
    const routineId = routineForReplay(ordered[0], routines);
    setActiveRoutineId(routineId);
    navigate(routineId ? '/player' : '/free-practice');
  };

  return (
    <section className="pgr-page" aria-label="Progress">
      <header className="pgr-top">
        <div className="pgr-heading">
          <h1>Progress</h1>
          <p>Your practice journey at a glance.</p>
        </div>
        <div className="pgr-cat-stage" aria-label={'Your companion: ' + (cat?.name ?? 'Luna')}>
          <img src={ART.wide} className="pgr-piano" alt="" aria-hidden="true" />
          <CatSprite catId={catId} size={112} variant={catMode ? 'floor' : 'sleeping'} decorative className={'pgr-cat ' + (catMode ? 'is-sitting' : 'is-sleeping')} />
        </div>
        <button type="button" className="pgr-settings" onClick={() => navigate('/profile')}
          aria-label="Open settings">
          <img src={ART.settingsOutline} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className="pgr-theme" aria-label="Appearance">
        <h2>Theme</h2>
        <div className="pgr-theme-choices" role="group" aria-label="Appearance controls">
          <button type="button" onClick={() => setMode('light')} aria-pressed={theme === 'light'} aria-label="Light theme">
            <img src={(theme === 'light' ? ART.lightActive : ART.lightOutline)} alt="" />
          </button>
          <button type="button" onClick={() => setMode('dark')} aria-pressed={theme === 'dark'} aria-label="Dark theme">
            <img src={(theme === 'dark' ? ART.darkActive : ART.darkOutline)} alt="" />
          </button>
          <button type="button" onClick={() => setCatMode(!catMode)} aria-pressed={catMode} aria-label="Cat Mode">
            <img src={(catMode ? ART.catModeActive : ART.catModeOutline)} alt="" />
          </button>
        </div>
      </section>

      <div className="pgr-streak" aria-label="Streak and monthly practice">
        <div>
          <img src="/visuals/pixel-motifs/streak-fire.png" alt="" />
          <strong>{summary.streak}</strong><span>day streak</span>
        </div>
        <div>
          <img src="/visuals/pixel-motifs/approved/center-leaf.png" alt="" />
          <strong>{monthDays}</strong><span>days this month</span>
        </div>
      </div>

      <button type="button" className="pgr-room-entry" onClick={() => navigate('/achievements')}>
        <span className="pgr-room-icon" aria-hidden="true">♫</span>
        <span className="pgr-room-copy"><strong>My Little Jazz Room</strong><small>Decorate your studio as you practice.</small></span>
        <span className="pgr-room-cta">Visit room ›</span>
      </button>

      <PracticeCalendar sessions={sessions} />

      <section className="pgr-week" aria-labelledby="pgr-week-heading">
        <div className="pgr-chart-panel">
          <h2 id="pgr-week-heading">Practice Time</h2>
          <p>This week · {summary.weekMinutes} min</p>
          <div className="pgr-chart" role="img" aria-label={summary.weekDays.map(d => d.label + ': ' + d.minutes + ' minutes').join(', ')}>
            <div className="pgr-axis" aria-hidden="true"><span>{chartCeiling}</span><span>{chartCeiling / 2}</span><span>0</span></div>
            <div className="pgr-bars-and-labels" aria-hidden="true">
              <div className="pgr-bars">
                {summary.weekDays.map((day, index) => (
                  <div key={day.label} className="pgr-bar-cell">
                    <div className={'pgr-bar ' + (index === (now.getDay() + 6) % 7 ? 'is-today' : '')}
                      style={{ height: (100 * day.minutes / chartCeiling) + '%' }} />
                  </div>
                ))}
              </div>
              <div className="pgr-day-labels">
                {WEEK_LABELS.map(label => <span key={label}>{label}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div className="pgr-week-facts" aria-label="This week's statistics">
          <h3>This Week</h3>
          <div><span aria-hidden="true">◷</span><strong>{summary.weekMinutes}</strong><small>min</small></div>
          <div><span aria-hidden="true">♪</span><strong>{thisWeek.length}</strong><small>sessions</small></div>
          <div><span aria-hidden="true">◉</span><strong>{studyCount}</strong><small>charts</small></div>
          <div><span aria-hidden="true">▤</span><strong>{routineCount}</strong><small>routines</small></div>
        </div>
      </section>

      <section className="pgr-history" aria-labelledby="pgr-history-heading">
        <div className="pgr-history-heading">
          <h2 id="pgr-history-heading">Recent Practice</h2>
          {ordered.length > 3 && <button type="button" aria-expanded={showAllHistory}
            onClick={() => setShowAllHistory(x => !x)}>{showAllHistory ? 'Show less' : 'View All ›'}</button>}
        </div>
        {recent.length ? <ul className="pgr-history-list">
          {recent.map(session => {
            const routine = routines.find(r => r.id === session.routineId);
            const exercise = exercises.find(e => e.id === session.exerciseId);
            const date = new Date(session.finishedAt);
            return <li key={session.id}>
              <span className="pgr-note-icon" aria-hidden="true">♫</span>
              <div className="pgr-history-name">
                <strong>{routine?.title ?? session.routineTitle ?? exercise?.title ?? 'Free Practice'}</strong>
                <small>{routine ? 'Routine' : 'Practice'}</small>
              </div>
              <span className="pgr-history-minutes">{Math.round(Math.max(0, session.durationSeconds) / 60)} min</span>
              <time dateTime={session.finishedAt}>{Number.isNaN(date.getTime()) ? 'Saved' :
                date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
            </li>;
          })}
        </ul> : <p className="pgr-history-empty">Finish a practice session to see it here.</p>}
      </section>
      <button type="button" className="pgr-again" onClick={replay}>
        {ordered.length ? 'Practice Again' : 'Start Practicing'}
      </button>
    </section>
  );
}
