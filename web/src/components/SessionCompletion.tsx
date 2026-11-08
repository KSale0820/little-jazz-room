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
const PLANTS = '/visuals/new-assets/2026-11-07-sharp-pixel/plant-growth-stages';

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
  const goalRatio = Math.min(1, Math.max(0, today / dailyGoal));
  const plantStage = Math.min(4, Math.floor(goalRatio * 4));
  const plant = PLANTS + '/plant-stage-' + plantStage + '.png';
  const hasMilestone = earnedCats.length > 0;
  const headline = hasMilestone || kind === 'guided' ? 'Great practice!' : 'Session Complete!';

  return <section className="sc-page" aria-label="Practice session complete">
    <header className="sc-top">
      <span className="sc-eyebrow">{kind === 'guided' ? 'Guided routine' : kind === 'chart' ? 'Chart practice' : 'Free practice'}</span>
      <button type="button" className="sc-back" onClick={onPractice} disabled={status !== 'saved'}>Back to Practice</button>
    </header>

    <div className="sc-hero">
      <div className="sc-hero-art" aria-hidden="true">
        {catMode
          ? <CatSprite catId={catId} size={106} variant={hasMilestone ? 'floor' : 'sleeping'} decorative className="sc-hero-cat" />
          : <div className="sc-hero-trophy"><img src={ICONS + '/trophy.png'} alt="" /></div>}
        <img src={plant} alt="" className="sc-hero-plant"/>
        <img src={ICONS + '/star.png'} alt="" className="sc-hero-sparkle"/>
      </div>
      <h1><img src={ICONS + '/trophy.png'} alt="" aria-hidden="true"/>{headline}</h1>
      <p className="sc-subtitle">{kind === 'guided' ? 'You completed your routine!' : 'Nice practice today!'}</p>
      <div className="sc-duration" aria-label={durationLabel + ' practiced'}>
        <img src={ICONS + '/stopwatch.png'} alt="" aria-hidden="true"/>
        <div><strong>{minutes >= 1 ? minutes + ' min' : seconds + ' sec'}</strong><span>practiced{minutes >= 1 && seconds > 0 ? ' · ' + seconds + ' sec' : ''}</span></div>
      </div>
    </div>

    <section className="sc-summary" aria-label="Session summary">
      <div className="sc-summary-top">
        <div>
          <span className="sc-section-kicker">SESSION SUMMARY</span>
          <h2>{title}</h2>
          {subtitle && <p className="sc-summary-subtitle">{subtitle}</p>}
        </div>
        <time dateTime={record.finishedAt}>{Number.isNaN(date.getTime()) ? 'Practice' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
      </div>
      {activities.length > 0 && <div className="sc-activities">
        <span className="sc-check" aria-hidden="true">✓</span>
        <div><strong>{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</strong>
          <span>{activityLabel}: {activities.join(', ')}</span></div>
      </div>}
    </section>

    {savedRecord && !hasMilestone && <section className="sc-momentum" aria-label="Practice plant and goal progress">
      <img src={PLANTS + '/plant-stage-1.png'} alt="" aria-hidden="true"/>
      <div className="sc-momentum-copy">
        <h2>Practice Plant</h2>
        <p>+{minutes > 0 ? minutes + ' min' : seconds + ' sec'} this session</p>
        <span>{today} / {dailyGoal} min today · {streak} day streak</span>
        <div className="sc-goal-bar" role="progressbar" aria-label="Daily practice goal"
          aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(today, dailyGoal)}>
          <div style={{ width: Math.min(100, today / dailyGoal * 100) + '%' }} />
        </div>
      </div>
      <img src={plant} alt="" aria-hidden="true" className="sc-momentum-grown"/>
    </section>}

    {savedRecord && hasMilestone && <section className="sc-unlock" aria-label="New companion unlocked">
      <div className="sc-unlock-art">
        {earnedCats.map(cat => <CatSprite key={cat.id} catId={cat.id} size={76} variant="floor" />)}
      </div>
      <div className="sc-unlock-copy">
        <h2>{earnedCats.map(cat => cat.name).join(' & ')} Unlocked!</h2>
        <p>You've reached {earnedCats.map(cat => COMPANION_UNLOCK_MINUTES[cat.id]).join(' & ')} total practice minutes!</p>
        <span>{today} / {dailyGoal} min today · {streak} day streak</span>
      </div>
      <img src={ICONS + '/star.png'} alt="" className="sc-unlock-star" aria-hidden="true"/>
    </section>}

    <div className="sc-actions" aria-label="Session actions">
      {status === 'saved'
        ? <button type="button" className="sc-primary" onClick={onProgress}>View Progress</button>
        : <button type="button" className="sc-primary" onClick={onSave} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving session…' : status === 'error' ? 'Retry save' : 'Save session'}
          </button>}
      {status === 'error' && <p className="sc-error" role="alert">Your session was not saved. Retry before leaving.</p>}
      <button type="button" className="sc-secondary" onClick={onPractice} disabled={status !== 'saved'}>Back to Practice</button>
      <div className="sc-small-actions">
        <button type="button" onClick={onPracticeAgain} disabled={status !== 'saved'}>Practice again</button>
      </div>
    </div>
    {details && <details className="sc-details">
      <summary>Session notes and rating <span>optional</span></summary>
      {details}
    </details>}
  </section>;
}
