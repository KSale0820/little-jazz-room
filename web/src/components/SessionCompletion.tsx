import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { useAppearance } from '../context/AppearanceContext';
import { useAuth } from '../context/AuthContext';
import { CatSprite, COMPANION_UNLOCK_MINUTES, JAZZ_CATS } from '../features/cats/CatCompanion';
import { cumulativePracticeMinutes, readSavedUnlocks } from '../lib/companionUnlocks';
import { computeGentleStreak, minutesToday } from '../lib/practiceStats';
import type { PracticeSessionRecord } from '../types/content';
import './SessionCompletion.css';

const ICONS = '/visuals/new-assets/2026-11-07-sharp-pixel/approved-isolated-icons';
const GOAL_PREFIX = 'little-jazz-room:daily-practice-goal:v1:';

/** Mirrors the current 30-minute Progress goal; respects the editable scoped goal when present. */
export function completionDailyGoal(scope: string, storage?: Pick<Storage, 'getItem'>): number {
  try {
    const value = (storage ?? window.localStorage).getItem(GOAL_PREFIX + scope);
    if (!value || !value.trim()) return 30;
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(240, Math.max(5, Math.round(number))) : 30;
  } catch { return 30; }
}

/** Show only milestones actually crossed by this saved record, never speculative awards. */
export function earnedCompletionCompanions(
  sessions: PracticeSessionRecord[],
  record: PracticeSessionRecord,
  previouslyUnlocked: readonly string[] = [],
): string[] {
  if (!sessions.some(session => session.id === record.id)) return [];
  const before = cumulativePracticeMinutes(sessions.filter(session => session.id !== record.id));
  const after = cumulativePracticeMinutes(sessions);
  return JAZZ_CATS.filter(cat =>
    COMPANION_UNLOCK_MINUTES[cat.id] > 0 &&
    before < COMPANION_UNLOCK_MINUTES[cat.id] &&
    after >= COMPANION_UNLOCK_MINUTES[cat.id] &&
    !previouslyUnlocked.includes(cat.id)
  ).map(cat => cat.id);
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SessionCompletionProps {
  record: PracticeSessionRecord;
  kind: 'free' | 'guided' | 'chart';
  title: string;
  subtitle?: string;
  activities?: string[];
  activityLabel?: string;
  status: SaveStatus;
  onSave: () => void;
  onProgress: () => void;
  onPracticeAgain: () => void;
  onPractice: () => void;
  details?: ReactNode;
}

/** Shared P06 for Free Practice and the chart/routine Player; read-only until saved. */
export function SessionCompletion({
  record, kind, title, subtitle, activities = [], activityLabel = 'Session activities',
  status, onSave, onProgress, onPracticeAgain, onPractice, details,
}: SessionCompletionProps) {
  const { sessions, catId, repo } = useApp();
  const { catMode } = useAppearance();
  const { user } = useAuth();
  const savedRecord = status === 'saved' && sessions.some(session => session.id === record.id);
  const accountKey = user?.id ?? 'local';
  const unlocked = savedRecord
    ? earnedCompletionCompanions(sessions, record, readSavedUnlocks(accountKey))
    : [];
  const earnedCats = JAZZ_CATS.filter(cat => unlocked.includes(cat.id));
  const today = savedRecord ? minutesToday(sessions) : 0;
  const dailyGoal = completionDailyGoal(repo.scope);
  const streak = savedRecord ? computeGentleStreak(sessions) : 0;
  const date = new Date(record.finishedAt);
  const minutes = Math.floor(record.durationSeconds / 60);
  const seconds = Math.max(0, record.durationSeconds % 60);
  const durationLabel = minutes >= 1 ? `${minutes} min ${String(seconds).padStart(2, '0')} sec` : `${seconds} sec`;

  return <section className="sc-page" aria-label="Practice session complete">
    <header className="sc-top">
      <span className="sc-eyebrow">{kind === 'guided' ? 'Guided practice' : kind === 'chart' ? 'Chart practice' : 'Free practice'}</span>
      <button type="button" className="sc-back" onClick={onPractice}>Back to Practice</button>
    </header>

    <div className="sc-hero">
      <div className="sc-trophy" aria-hidden="true">
        <img src={ICONS + '/trophy.png'} alt="" />
      </div>
      <h1>Practice complete</h1>
      <p className="sc-subtitle">A little progress, every session.</p>
      <div className="sc-duration" aria-label={durationLabel + ' practiced'}>
        <img src={ICONS + '/stopwatch.png'} alt="" aria-hidden="true"/>
        <div><strong>{minutes}:{String(seconds).padStart(2, '0')}</strong><span>time practiced</span></div>
      </div>
      <time className="sc-date" dateTime={record.finishedAt}>{Number.isNaN(date.getTime()) ? 'Saved practice' : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</time>
    </div>

    <section className="sc-card" aria-label="Session summary">
      <span className="sc-section-kicker">YOUR SESSION</span>
      <h2>{title}</h2>
      {subtitle && <p className="sc-card-subtitle">{subtitle}</p>}
      {activities.length > 0 && <div className="sc-activity-list">
        <h3>{activityLabel}</h3>
        <ul>{activities.map((activity, index) => <li key={index}><span className="sc-check" aria-hidden="true">✓</span>{activity}</li>)}</ul>
      </div>}
      {activities.length === 0 && kind === 'free' && <p className="sc-card-subtitle">Open practice · No activities marked complete</p>}
    </section>

    {savedRecord && <section className="sc-card sc-progress" aria-label="Saved practice progress">
      <div className="sc-progress-heading">
        <div><span className="sc-section-kicker">YOUR MOMENTUM</span><h2>Today's practice</h2></div>
        <img src={ICONS + '/calendar-reward.png'} alt="" aria-hidden="true"/>
      </div>
      <p><strong>{today}</strong> / {dailyGoal} min goal <span>· {streak} day streak</span></p>
      <div className="sc-goal-bar" role="progressbar" aria-label="Daily practice goal"
        aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(today, dailyGoal)}>
        <div style={{ width: Math.min(100, today / dailyGoal * 100) + '%' }} />
      </div>
    </section>}

    {savedRecord && earnedCats.length > 0 && <section className="sc-card sc-unlock" aria-label="New companion unlocked">
      <img src={ICONS + '/star.png'} alt="" className="sc-unlock-star" aria-hidden="true"/>
      <div><span className="sc-section-kicker">MILESTONE REACHED</span><h2>New companion unlocked!</h2>
        <p>{earnedCats.map(cat => cat.name).join(' & ')} can now join you in Practice.</p></div>
      <div className="sc-earned-cats">{earnedCats.map(cat =>
        <CatSprite key={cat.id} catId={cat.id} size={86} variant="floor" />)}</div>
    </section>}

    {details}
    <div className="sc-actions" aria-label="Session actions">
      {status === 'saved'
        ? <button type="button" className="sc-primary" onClick={onProgress}>View Progress</button>
        : <button type="button" className="sc-primary" onClick={onSave} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving session…' : status === 'error' ? 'Retry save' : 'Save session'}
          </button>}
      {status === 'error' && <p className="sc-error" role="alert">Your session was not saved. Retry before leaving.</p>}
      <div className="sc-next">
        <button type="button" className="sc-secondary" onClick={onPracticeAgain}>Practice again</button>
        <button type="button" className="sc-secondary" onClick={onPractice}>Practice hub</button>
      </div>
    </div>

    <div className="sc-decoration" aria-hidden="true">
      <img src={ICONS + '/sprout.png'} alt="" className="sc-sprout"/>
      {catMode && <CatSprite catId={catId} variant="sleeping" size={90} decorative />}
    </div>
  </section>;
}
