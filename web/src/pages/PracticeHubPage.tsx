import { useNavigate } from 'react-router-dom';
import { PixelIcon } from '../components/PixelIcon';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { timeGreeting } from '../lib/greeting';
import { minutesToday } from '../lib/practiceStats';
import './PracticeHubPage.css';

const DAILY_GOAL_MINUTES = 30;

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { sessions, routines, setActiveRoutineId } = useApp();
  const latestSession = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
  const recentRoutine = latestSession?.routineId
    ? routines.find(routine => routine.id === latestSession.routineId)
    : null;
  const practicedMinutes = minutesToday(sessions);
  const goalPercent = Math.min(100, Math.max(0, (practicedMinutes / DAILY_GOAL_MINUTES) * 100));

  const startFreePractice = () => {
    setActiveRoutineId(null);
    navigate('/player');
  };

  // A saved session has finished. This starts another session with the same
  // routine (or Free Practice), rather than pretending to resume a running timer.
  const continuePractice = () => {
    if (!latestSession) return;
    setActiveRoutineId(recentRoutine?.id ?? null);
    navigate('/player');
  };

  return (
    <section className="p01-page" aria-label="Practice hub">
      <header className="p01-header">
        <p className="p01-greeting">{timeGreeting().replace(/\.$/, ',')}</p>
        <h1>Let&apos;s Practice</h1>
        <p className="p01-intro">How would you like to practice today?</p>
      </header>

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
          <strong>{practicedMinutes} / {DAILY_GOAL_MINUTES} min</strong>
        </div>
        <div
          className="p01-daily-track"
          role="progressbar"
          aria-label="Daily practice goal"
          aria-valuemin={0}
          aria-valuemax={DAILY_GOAL_MINUTES}
          aria-valuenow={Math.min(practicedMinutes, DAILY_GOAL_MINUTES)}
          aria-valuetext={`${practicedMinutes} of ${DAILY_GOAL_MINUTES} minutes practiced today`}
        >
          <div className="p01-daily-fill" style={{ width: `${goalPercent}%` }} />
        </div>
      </section>
    </section>
  );
}
