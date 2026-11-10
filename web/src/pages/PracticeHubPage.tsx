import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelIcon } from '../components/PixelIcon';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { timeGreeting } from '../lib/greeting';
import { minutesToday } from '../lib/practiceStats';
import { readPinnedPracticeRoutine, readPracticeGoal, savePracticeGoal } from '../lib/practiceHomePreferences';
import './PracticeHubPage.css';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { repo, sessions, routines, setActiveRoutineId } = useApp();
  const [dailyGoal, setDailyGoal] = useState(() => readPracticeGoal(repo.scope));
  const [goalDraft, setGoalDraft] = useState(String(dailyGoal));
  const [editingGoal, setEditingGoal] = useState(false);
  useEffect(() => { const current = readPracticeGoal(repo.scope); setDailyGoal(current); setGoalDraft(String(current)); setEditingGoal(false); }, [repo.scope]);
  const pinnedId = readPinnedPracticeRoutine(repo.scope);
  const pinnedRoutine = routines.find(routine => routine.id === pinnedId);
  const latestSession = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
  const recentRoutine = latestSession?.routineId
    ? routines.find(routine => routine.id === latestSession.routineId)
    : null;
  const practicedMinutes = minutesToday(sessions);
  const goalPercent = Math.min(100, Math.max(0, (practicedMinutes / dailyGoal) * 100));

  const startFreePractice = () => {
    setActiveRoutineId(null);
    navigate('/free-practice');
  };

  const startPinnedRoutine = () => {
    if (!pinnedRoutine) return;
    setActiveRoutineId(pinnedRoutine.id);
    navigate('/player?routine=' + encodeURIComponent(pinnedRoutine.id));
  };

  // A saved session has finished. This starts another session with the same
  // routine (or Free Practice), rather than pretending to resume a running timer.
  const continuePractice = () => {
    if (!latestSession) return;
    setActiveRoutineId(recentRoutine?.id ?? null);
    navigate(recentRoutine ? '/player?routine=' + encodeURIComponent(recentRoutine.id) : '/free-practice');
  };

  return (
    <section className="p01-page" aria-label="Practice hub">
      <header className="p01-header">
        <p className="p01-greeting">{timeGreeting().replace(/\.$/, ',')}</p>
        <h1>Let&apos;s Practice</h1>
        <p className="p01-intro">How would you like to practice today?</p>
      </header>

      {pinnedRoutine && (
        <section className="p01-continue" aria-label="Pinned routine">
          <button type="button" className="p01-continue-button" onClick={startPinnedRoutine}>
            <span className="p01-continue-icon" aria-hidden="true">▶</span>
            <span className="p01-continue-copy"><strong>Pinned Routine</strong><small>{pinnedRoutine.title}</small></span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
        </section>
      )}

      {latestSession && (
        <section className="p01-continue" aria-label="Continue your practice">
          <button type="button" className="p01-continue-button" onClick={continuePractice}>
            <span className="p01-continue-icon" aria-hidden="true">▶</span>
            <span className="p01-continue-copy">
              <strong>Continue Practice</strong>
              <small>{recentRoutine?.title ?? 'Free Practice'} · Last session</small>
            </span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
        </section>
      )}

      <div className="p01-actions" aria-label="Start practicing">
        <button type="button" className="p01-action p01-action-primary" onClick={startFreePractice}>
          <span className="p01-action-copy">
            <strong>Free Practice</strong>
            <small>Start a session at your own pace.</small>
          </span>
          <img src={VISUAL_ASSETS.sharedMvp.practice.vinyl} alt="" aria-hidden="true" />
          <span className="p01-chevron" aria-hidden="true">›</span>
        </button>
        <button type="button" className="p01-action p01-action-secondary" onClick={() => navigate('/tracks')}>
          <span className="p01-action-icon" aria-hidden="true"><PixelIcon route="tracks" /></span>
          <span className="p01-action-copy">
            <strong>Practice with a Track</strong>
            <small>Find a chart or track study.</small>
          </span>
          <span className="p01-chevron" aria-hidden="true">›</span>
        </button>
        <button type="button" className="p01-action p01-action-secondary" onClick={() => navigate('/routines')}>
          <span className="p01-action-icon" aria-hidden="true"><PixelIcon route="routines" /></span>
          <span className="p01-action-copy">
            <strong>Follow a Routine</strong>
            <small>Choose a guided practice plan.</small>
          </span>
          <span className="p01-chevron" aria-hidden="true">›</span>
        </button>
      </div>

      <section className="p01-tools" aria-labelledby="p01-tools-heading">
        <h2 id="p01-tools-heading">Quick Tools</h2>
        <div className="p01-tool-grid">
          <button type="button" className="p01-tool" onClick={() => navigate('/tuner')}>
            <span className="p01-tuning-fork" aria-hidden="true" />
            <strong>Tuner</strong>
          </button>
          <button type="button" className="p01-tool" onClick={() => navigate('/metronome')}>
            <span
              className="p01-metronome-symbol"
              style={{
                WebkitMaskImage: `url("${VISUAL_ASSETS.icons.metronome}")`,
                maskImage: `url("${VISUAL_ASSETS.icons.metronome}")`,
              }}
              aria-hidden="true"
            />
            <strong>Metronome</strong>
          </button>
        </div>
      </section>

      <section className="p01-daily" aria-label="Daily practice progress">
        <div className="p01-daily-header">
          <span>Today&apos;s Practice</span>
          <strong>{practicedMinutes} / {dailyGoal} min</strong>
          <button className="p01-goal-edit" type="button" onClick={() => { setGoalDraft(String(dailyGoal)); setEditingGoal(!editingGoal); }} aria-expanded={editingGoal}>Edit goal</button>
        </div>
        <div
          className="p01-daily-track"
          role="progressbar"
          aria-label="Daily practice goal"
          aria-valuemin={0}
          aria-valuemax={dailyGoal}
          aria-valuenow={Math.min(practicedMinutes, dailyGoal)}
          aria-valuetext={`${practicedMinutes} of ${dailyGoal} minutes practiced today`}
        >
          <div className="p01-daily-fill" style={{ width: `${goalPercent}%` }} />
        </div>
        {editingGoal && (
          <form className="p01-goal-form" onSubmit={event => { event.preventDefault(); const saved = savePracticeGoal(repo.scope, Number(goalDraft)); setDailyGoal(saved); setGoalDraft(String(saved)); setEditingGoal(false); }}>
            <label htmlFor="practice-daily-goal">Daily goal (5–240 minutes)</label>
            <input id="practice-daily-goal" type="number" min={5} max={240} step={5} value={goalDraft} required onChange={event => setGoalDraft(event.target.value)} />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingGoal(false)}>Cancel</button>
          </form>
        )}
      </section>
    </section>
  );
}
