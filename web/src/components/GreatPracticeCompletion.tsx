import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressIcon } from './ProgressIcon';
import { computeScheduledStreak, minutesToday } from '../lib/practiceStats';
import { readPracticeOffDays } from '../lib/practiceHomePreferences';
import { journalKey, persistLocalList, readLocalList } from '../lib/practicePlayerNotes';
import type { PracticeJournalEntry } from '../lib/practicePlayerNotes';
import type { PracticeSessionRecord } from '../types/content';
import './GreatPracticeCompletion.css';

export type RecapActivity = {
  id: string;
  title: string;
  detail?: string;
  status: 'complete' | 'partial' | 'unmarked' | 'practiced';
};
export type RecapSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  record: PracticeSessionRecord;
  title: string;
  subtitle: string;
  activities: RecapActivity[];
  summaryArt?: string;
  status: RecapSaveStatus;
  onRetry: () => void;
  onDone: () => void;
  onPracticeAgain: () => void;
}

const FEEDBACK_KEY = 'little-jazz-room:practice-feedback:v1:';
const GOAL_KEY = 'little-jazz-room:daily-practice-goal:v1:';

function feedbackFor(id: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FEEDBACK_KEY + id) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}
function readGoal(scope: string): number {
  try {
    const number = Number(localStorage.getItem(GOAL_KEY + scope));
    return Number.isFinite(number) && number >= 5 ? Math.max(5, Math.min(240, Math.round(number))) : 30;
  } catch { return 30; }
}
function displayDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return whole >= 60 ? Math.floor(whole / 60) + ' min ' + whole % 60 + ' sec' : whole + ' sec';
}

/** Presentation only: the owning player is responsible for the single session save. */
export function GreatPracticeCompletion({
  record, title, subtitle, activities, summaryArt, status, onRetry, onDone, onPracticeAgain,
}: Props) {
  const { sessions, repo } = useApp();
  const journalStorageKey = journalKey(repo.scope);
  const [journalText, setJournalText] = useState(() =>
    readLocalList<PracticeJournalEntry>(journalStorageKey).find(entry => entry.sessionId === record.id)?.text ??
    (typeof feedbackFor(record.id).notes === 'string' ? String(feedbackFor(record.id).notes) : '')
  );
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [journalError, setJournalError] = useState(false);
  const [rating, setRating] = useState(() => {
    const saved = feedbackFor(record.id).rating;
    return typeof saved === 'number' && Number.isInteger(saved) && saved >= 1 && saved <= 5 ? saved : 0;
  });

  const effectiveSessions = sessions.some(session => session.id === record.id)
    ? sessions : [...sessions, record];
  const goal = readGoal(repo.scope);
  const today = minutesToday(effectiveSessions);
  const streak = computeScheduledStreak(effectiveSessions, readPracticeOffDays(repo.scope));
  const progress = Math.min(100, Math.max(0, today / goal * 100));
  const summaryImage = summaryArt ?? '/visuals/room/home-hero-twilight.png';
  const completed = activities.filter(item => item.status === 'complete').length;
  const hasChecks = activities.some(item => item.status !== 'practiced');
  const activitySummary = hasChecks
    ? completed + ' of ' + activities.length + ' completed'
    : activities.length + (activities.length === 1 ? ' item' : ' items');

  function updateJournal(text: string) {
    setJournalText(text);
    const all = readLocalList<PracticeJournalEntry>(journalStorageKey);
    const existing = all.find(entry => entry.sessionId === record.id);
    const now = new Date().toISOString();
    const updated: PracticeJournalEntry[] = text.trim() || existing
      ? [...all.filter(entry => entry.sessionId !== record.id), {
          ...existing,
          id: existing?.id ?? crypto.randomUUID(),
          sessionId: record.id,
          chartId: existing?.chartId ?? '',
          chartTitle: existing?.chartTitle ?? title,
          text,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          durationSeconds: record.durationSeconds,
        }]
      : all;
    setJournalError(!persistLocalList(journalStorageKey, updated));
  }

  function updateRating(stars: number) {
    const next = stars === rating ? 0 : stars;
    setRating(next);
    try {
      localStorage.setItem(FEEDBACK_KEY + record.id,
        JSON.stringify({ ...feedbackFor(record.id), rating: next }));
    } catch { setJournalError(true); }
  }

  return <section className={"practice-complete gj-screen" + (activities.length === 0 ? " gj-empty" : "")} aria-label="Practice session complete">
    <button type="button" className="gj-close" onClick={onDone}
      disabled={status !== 'saved'} aria-label="Done, return to Practice">×</button>
    <header className="gj-hero">
      <div className="gj-headline">
        <svg className="gj-rays gj-rays-left" viewBox="0 0 32 62" aria-hidden="true" fill="none">
          <path d="M27 16 14 4M26 31H4M27 46 14 58" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
        <h1 className="gj-title">Great practice!</h1>
        <svg className="gj-rays" viewBox="0 0 32 62" aria-hidden="true" fill="none">
          <path d="M5 16 18 4M6 31h22M5 46l13 12" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="gj-time">{displayDuration(record.durationSeconds)}</p>
      <p className="gj-date">{title} · {new Date(record.finishedAt).toLocaleDateString(undefined,
        { month: 'short', day: 'numeric', year: 'numeric' })}</p>
    </header>

    <section className="gj-summary" aria-label="Session summary">
      <img className="gj-summary-art" src={summaryImage} alt="" />
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </section>

    {activities.length > 0 && <section className="gj-block" aria-label="What you practiced">
      <div className="gj-heading">
        <h2>What you practiced</h2>
        <span>{activitySummary}</span>
      </div>
      <div className="gj-activity-list">
        {activities.map(item => <div className="gj-activity" key={item.id}>
          <span className={'gj-activity-icon gj-status-' + item.status} aria-hidden="true">
            {item.status === 'complete' ? '✓' : item.status === 'partial' ? '◐' : item.status === 'unmarked' ? '○' : '♪'}
          </span>
          <div className="gj-activity-text">
            <strong>{item.title}</strong>
            <span>{item.status === 'unmarked' ? 'Not completed' :
              item.status === 'partial' ? 'Partially completed' :
              item.detail || (item.status === 'complete' ? 'Completed' : 'Practiced')}</span>
          </div>
        </div>)}
      </div>
    </section>}

    <section className="gj-block gj-journal" aria-label="Practice journal">
      <div className="gj-heading">
        <h2><ProgressIcon name="journal" className="gj-book-icon" /> Practice journal</h2>
        <button type="button" onClick={() => setJournalExpanded(expanded => !expanded)}
          aria-expanded={journalExpanded} aria-controls="gj-journal-content">
          {journalExpanded ? 'Show less' : journalText ? 'View full entry ›' : 'Add reflection ›'}
        </button>
      </div>
      <div id="gj-journal-content" className="gj-journal-card">
        {journalExpanded
          ? <textarea aria-label="Practice journal reflection" maxLength={4000}
              value={journalText} onChange={event => updateJournal(event.target.value)}
              placeholder="What went well? What would you like to work on next?" rows={5} />
          : <p className="gj-preview">{journalText ? journalText.length > 138 ? journalText.slice(0, 138).trimEnd() + '…' : journalText : 'What went well? What would you like to work on next?'}</p>}
      </div>
      {journalExpanded && <p className="gj-helper">Your reflection saves to this session’s journal as you type.</p>}
      {journalError && <p className="gj-error" role="alert">Could not save changes on this device.</p>}
    </section>

    <div className="gj-rating">
      <h2>Rate today's session</h2>
      <div role="group" aria-label="Rate today's session">
        {[1, 2, 3, 4, 5].map(star => <button key={star} type="button"
          aria-label={star + (star === 1 ? ' star' : ' stars')}
          aria-pressed={rating === star} onClick={() => updateRating(star)}
          className={star <= rating ? 'gj-star selected' : 'gj-star'}>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75"
            strokeLinejoin="round"><path d="m12 2.8 2.9 6 6.6.9-4.8 4.7 1.1 6.7-5.8-3.1-5.8 3.1 1.1-6.7-4.8-4.7 6.6-.9z" /></svg>
        </button>)}
      </div>
    </div>

    <div className="gj-progress" aria-label="Today's progress">
      <div className="gj-goal"><svg className="gj-progress-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="15" width="5" height="7" rx="1" /><rect x="10" y="9" width="5" height="13" rx="1" /><rect x="18" y="3" width="5" height="19" rx="1" /></svg>
        <span>Daily goal: <strong>{today} / {goal} min</strong></span>
        <div className="gj-goal-bar" role="progressbar" aria-label="Daily practice goal"
          aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(today, goal)}>
          <span style={{ width: progress + '%' }} />
        </div>
      </div>
      <div className="gj-streak"><img src="/visuals/pixel-motifs/streak-fire.png" alt="" aria-hidden="true" /> <strong>{streak}-day streak</strong></div>
    </div>

    {status !== 'saved' && <p className={status === 'error' ? 'gj-save-state gj-error' : 'gj-save-state'} role="status">
      {status === 'error' ? 'Session could not be saved. Retry before leaving.' : 'Saving session…'}
    </p>}
    {status === 'error' && <button className="gj-retry" type="button" onClick={onRetry}>Retry save</button>}
    <div className="gj-actions">
      <button type="button" className="gj-again" onClick={onPracticeAgain} disabled={status !== 'saved'}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10a8 8 0 1 0 1 5M20 4v6h-6" /></svg> Practice Again
      </button>
      <button type="button" className="gj-done" onClick={onDone} disabled={status !== 'saved'}>
        Done
      </button>
    </div>
  </section>;
}
