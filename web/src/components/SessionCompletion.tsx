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
const PLANTS = '/visuals/new-assets/2026-11-07-sharp-pixel/plant-growth-stages';
const SLEEP_ZZZ = '/visuals/new-assets/2026-11-07-sharp-pixel/sleep-zzz-sharp.png';
const GOAL_PREFIX = 'little-jazz-room:daily-practice-goal:v1:';

/** Same account-scoped preference as Practice; fallback matches Progress's current 30-minute goal. */
export function completionDailyGoal(scope: string, storage?: Pick<Storage, 'getItem'>): number {
  try {
    const value = (storage ?? window.localStorage).getItem(GOAL_PREFIX + scope);
    if (!value || !value.trim()) return 30;
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(240, Math.max(5, Math.round(number))) : 30;
  } catch { return 30; }
}

/** Show a new unlock only when this actual saved session crossed an existing threshold. */
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

/** The approved plant stages never show a bare pot after an actual saved practice. */
export function completionPlantStage(todayMinutes: number, goalMinutes: number, hasPractice: boolean): number {
  if (!hasPractice) return 0;
  return Math.max(1, Math.min(4, Math.floor(1 + 3 * Math.min(1, Math.max(0, todayMinutes / goalMinutes)))));
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

function PixelMusicNote() {
  return <svg viewBox="0 0 22 22" aria-hidden="true" className="sc-music-icon" shapeRendering="crispEdges">
    <path fill="currentColor" d="M9 3h11v3H9zm8 3h3v10h-3zm-8 0h3v12H9zM4 15h7v4H4zm9-2h7v4h-7z" />
  </svg>;
}
function PixelProgressBars() {
  return <svg className="sc-progress-icon" viewBox="0 0 20 18" aria-hidden="true" shapeRendering="crispEdges">
    <path fill="currentColor" d="M2 11h3v5H2zm6-5h3v10H8zm6-4h3v14h-3z"/>
  </svg>;
}
/** An unobtrusive leafy wreath around the *approved* pixel trophy. */
function PixelLaurels() {
  return <svg className="sc-laurels" viewBox="0 0 192 116" aria-hidden="true" shapeRendering="crispEdges">
    <g fill="none" stroke="#638b53" strokeWidth="2.5" strokeLinecap="square">
      <path d="M60 99Q35 79 44 43L53 26"/>
      <path d="M132 99Q157 79 148 43L139 26"/>
    </g>
    <g fill="#8eb77b" stroke="#4f8156" strokeWidth="1.25" strokeLinejoin="miter">
      <path d="M49 32 39 21 30 23 36 34 47 37Z"/>
      <path d="M42 48 30 38 22 43 31 53 42 54Z"/>
      <path d="M41 65 27 59 22 66 36 74 43 70Z"/>
      <path d="M47 82 31 80 30 88 43 92 51 88Z"/>
      <path d="M57 96 45 98 48 105 62 102Z"/>
      <path d="M143 32 153 21 162 23 156 34 145 37Z"/>
      <path d="M150 48 162 38 170 43 161 53 150 54Z"/>
      <path d="M151 65 165 59 170 66 156 74 149 70Z"/>
      <path d="M145 82 161 80 162 88 149 92 141 88Z"/>
      <path d="M135 96 147 98 144 105 130 102Z"/>
    </g>
  </svg>;
}

/** One mobile-first composition for free, guided, chart and audio-only completion. */
export function SessionCompletion({
  record, kind, title, subtitle, activities = [], activityLabel = 'Session activities',
  status, onSave, onProgress, onPracticeAgain, onPractice, details,
}: SessionCompletionProps) {
  const { sessions, catId, repo } = useApp();
  const { catMode } = useAppearance();
  const { user } = useAuth();
  const savedRecord = status === 'saved' && sessions.some(session => session.id === record.id);
  const accountKey = user?.id ?? 'local';
  const earnedIds = savedRecord ? earnedCompletionCompanions(sessions, record, readSavedUnlocks(accountKey)) : [];
  const earnedCats = JAZZ_CATS.filter(cat => earnedIds.includes(cat.id));
  const hasMilestone = earnedCats.length > 0;
  const dailyGoal = completionDailyGoal(repo.scope);
  const today = savedRecord ? minutesToday(sessions) : 0;
  const streak = savedRecord ? computeGentleStreak(sessions) : 0;
  const before = savedRecord ? minutesToday(sessions.filter(session => session.id !== record.id)) : 0;
  const nowStage = completionPlantStage(today, dailyGoal, savedRecord);
  const beforeStage = completionPlantStage(before, dailyGoal, before > 0);
  const currentPlant = `${PLANTS}/plant-stage-${nowStage}.png`;
  // The owner-approved scene always starts with the little sprout: it is decorative,
  // not a claimed reward or earned milestone.
  const previousPlant = `${PLANTS}/plant-stage-${Math.max(1, beforeStage)}.png`;
  const seconds = Math.max(0, Math.floor(record.durationSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const displayedDuration = minutes > 0 ? `${minutes} min` : `${seconds} sec`;
  const exactDuration = minutes > 0 ? `${minutes} min ${remainder} sec` : `${seconds} sec`;
  const headline = kind === 'guided' || hasMilestone ? 'Great Practice!' : 'Session Complete!';
  const subheading = kind === 'guided' ? 'You completed your routine!' : 'Nice practice today!';
  const heroCatId = hasMilestone ? earnedCats[0].id : catId;
  const compactActivity = kind === 'guided'
    ? activities.length ? 'Practiced ' + activities[0] : null
    : activities.length === 1 ? activities[0] + ' practiced'
    : activities.length > 1 ? activities.length + ' activities completed'
    : kind === 'chart' ? 'Chart practiced' : null;
  const goalProgress = Math.min(100, Math.max(0, today / dailyGoal * 100));

  return <section className="sc-page" aria-label="Practice session complete">
    <div className="sc-hero">
      <div className={'sc-hero-art ' + (catMode ? 'sc-with-cat' : 'sc-without-cat')} aria-hidden="true">
        {catMode ? <>
          <CatSprite catId={heroCatId} variant={hasMilestone ? 'floor' : 'sleeping'} size={110} decorative className="sc-hero-cat"/>
          {!hasMilestone && <img className="sc-sleep-zzz" src={SLEEP_ZZZ} alt="" />}
          {hasMilestone && <img className="sc-hero-award" src={ICONS + '/trophy.png'} alt="" />}
          <img className="sc-hero-plant" src={currentPlant} alt="" />
          <img className="sc-hero-sparkle" src={ICONS + '/star.png'} alt=""/>
        </> : <>
          <PixelLaurels/>
          <img className="sc-hero-trophy" src={ICONS + '/trophy.png'} alt="" />
          <img className="sc-hero-sparkle" src={ICONS + '/star.png'} alt="" />
        </>}
      </div>
      <h1><img src={ICONS + '/trophy.png'} alt="" aria-hidden="true"/>{headline}</h1>
      <p className="sc-subtitle">{subheading}</p>
      <div className="sc-duration" aria-label={exactDuration + ' practiced'}>
        <img src={ICONS + '/stopwatch.png'} alt="" aria-hidden="true"/>
        <div><strong>{displayedDuration}</strong><span>practiced</span></div>
      </div>
    </div>

    <section className="sc-summary" aria-label="Session summary">
      <div className="sc-summary-line">
        <PixelMusicNote/>
        <div className="sc-summary-copy">
          <strong>{title}</strong>
          {compactActivity && <span><i aria-hidden="true">✓ </i>{compactActivity}</span>}
        </div>
        <span className="sc-summary-duration">{displayedDuration}</span>
      </div>
    </section>

    {savedRecord && (hasMilestone ? <section className="sc-unlock" aria-label="New companion unlocked">
      <div className="sc-unlock-art">{earnedCats.map(cat =>
        <CatSprite key={cat.id} catId={cat.id} size={76} variant="floor" />)}</div>
      <div className="sc-unlock-copy">
        <h2>{earnedCats.map(cat => cat.name).join(' & ')} Unlocked!</h2>
        <p>You've reached {earnedCats.map(cat => COMPANION_UNLOCK_MINUTES[cat.id]).join(' & ')} total practice minutes!</p>
      </div>
      <img src={ICONS + '/star.png'} alt="" className="sc-unlock-star" aria-hidden="true"/>
    </section> : <section className="sc-momentum" aria-label="Practice plant growth">
      <img src={previousPlant} alt="" aria-hidden="true" className="sc-momentum-start"/>
      <div className="sc-momentum-copy">
        <h2>Practice Plant</h2>
        <p>+{displayedDuration}</p>
        <div className="sc-goal-bar" role="progressbar" aria-label="Daily practice goal"
          aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(today, dailyGoal)}
          aria-valuetext={today + ' of ' + dailyGoal + ' minutes today, ' + streak + ' day streak'}>
          <div style={{ width: goalProgress + '%' }} />
        </div>
      </div>
      <img src={currentPlant} alt="" aria-hidden="true" className="sc-momentum-grown"/>
    </section>)}

    <div className="sc-actions" aria-label="Session actions">
      {status === 'saved'
        ? <button type="button" className="sc-primary" onClick={onProgress}><PixelProgressBars/>View Progress</button>
        : <button type="button" className="sc-primary" onClick={onSave} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving session…' : status === 'error' ? 'Retry save' : 'Save session'}
        </button>}
      {status === 'error' && <p className="sc-error" role="alert">Your session was not saved. Retry before leaving.</p>}
      <button type="button" className="sc-secondary" onClick={onPractice} disabled={status !== 'saved'}>
        <span aria-hidden="true">←</span> Back to Practice
      </button>
    </div>

    <details className="sc-more">
      <summary>{details ? 'Session notes and rating' : 'More session options'}</summary>
      <div className="sc-more-content">
        <p className="sc-more-meta">{subtitle ? subtitle + ' · ' : ''}{activityLabel}: {activities.length ? activities.join(', ') : 'No activities marked complete'}</p>
        {savedRecord && <p className="sc-more-meta">{today} / {dailyGoal} min today · {streak} day streak</p>}
        {details}
        <button className="sc-practice-again" type="button" onClick={onPracticeAgain} disabled={status !== 'saved'}>Practice again</button>
      </div>
    </details>
  </section>;
}
