import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JazzRoomScene } from '../components/JazzRoomScene';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
import { timeGreeting, displayNameFromUser } from '../lib/greeting';
import {
  computeGentleStreak,
  longTermProgressPercent,
  minutesToday,
  PRACTICE_MILESTONE_MINUTES,
  totalPracticeMinutes,
} from '../lib/practiceStats';
import {
  readLightingPreference,
  resolveLighting,
  writeLightingPreference,
  type RoomLightingMode,
} from '../lib/roomLighting';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const GOAL_MINUTES = 30;

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { catId, catMotion, sessions, activeRoutineId, routines } = useApp();
  const [lightMode, setLightMode] = useState<RoomLightingMode>(() => readLightingPreference());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lighting = resolveLighting(lightMode);

  const practicedMinutes = useMemo(() => minutesToday(sessions), [sessions]);
  const totalMinutes   = useMemo(() => totalPracticeMinutes(sessions), [sessions]);
  const streak         = useMemo(() => computeGentleStreak(sessions), [sessions]);
  const longTermPct    = useMemo(() => longTermProgressPercent(sessions), [sessions]);
  const greeting       = useMemo(() => timeGreeting(displayNameFromUser(user)), [user]);
  const cat            = JAZZ_CATS.find(c => c.id === catId)!;
  const progress       = Math.min(100, (practicedMinutes / GOAL_MINUTES) * 100);
  const todayRoutine   = activeRoutineId ? routines.find(r => r.id === activeRoutineId) : undefined;

  useEffect(() => { writeLightingPreference(lightMode); }, [lightMode]);

  const goHotspot = (target: 'piano' | 'stand' | 'notebook') => {
    if (target === 'piano') navigate('/practice');
    else if (target === 'stand') navigate('/explore');
    else navigate('/profile');
  };

  return (
    <section className="page home-page" aria-label="Home">

      {/* ── Illustrated room — pure art, cat on floor ── */}
      <JazzRoomScene
        lighting={lighting}
        onHotspot={goHotspot}
        catOverlay={
          <button
            type="button"
            className="home-cat-btn"
            aria-label={`Your companion ${cat.name}. Tap to choose cat.`}
            onClick={() => navigate('/profile', { state: { scrollToCat: true } })}
          >
            <CatSprite catId={catId} size={120} animated={catMotion} variant="floor" className="home-cat-sprite" />
          </button>
        }
      />

      {/* ── Goal card — overlaps room bottom, contains title + controls ── */}
      <div className="home-goal-card">

        {/* Card header: room name + lighting gear */}
        <div className="home-card-header">
          <div className="home-card-title-wrap">
            <span className="home-card-title">My Jazz Room</span>
            <span className="home-card-greeting">{greeting}</span>
          </div>
          <div className="home-settings-wrap">
            <button
              type="button"
              className="home-gear-btn"
              aria-label="Room lighting settings"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen(o => !o)}
            >
              {/* sun/moon icon */}
              <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            {settingsOpen && (
              <div className="home-settings-panel" role="dialog" aria-label="Room lighting">
                <label htmlFor="room-light" className="home-settings-label">Room light</label>
                <select
                  id="room-light"
                  value={lightMode}
                  onChange={e => setLightMode(e.target.value as RoomLightingMode)}
                  className="home-settings-select"
                >
                  <option value="auto">Auto</option>
                  <option value="sunshine">Sunshine</option>
                  <option value="twilight">Twilight</option>
                  <option value="night">Night</option>
                </select>
                <button type="button" className="btn tiny" onClick={() => navigate('/profile')}>
                  Choose cat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Thin rule */}
        <div className="home-card-rule" />

        {/* Daily goal section */}
        <div className="home-goal-row">
          <span className="home-goal-label">Daily goal</span>
          <span className="home-goal-minutes">{practicedMinutes} / {GOAL_MINUTES} min</span>
        </div>
        <div
          className="home-progress"
          role="progressbar"
          aria-valuenow={practicedMinutes}
          aria-valuemin={0}
          aria-valuemax={GOAL_MINUTES}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="home-stats-row">
          <span className="home-stat">
            <span className="home-stat-icon streak-mark" aria-hidden />
            <strong>{streak}</strong> days
          </span>
          <span className="home-stat home-stat-muted">Gentle streak · no pressure</span>
          <span className="home-stat">
            <span className="home-stat-icon note" aria-hidden>♪</span>
            <strong>{totalMinutes}</strong>
          </span>
        </div>
        <button type="button" className="home-start-btn" onClick={() => navigate('/practice')}>
          <span className="home-play-icon" aria-hidden>▶</span>
          Start Practicing
        </button>
      </div>

      {/* ── Content cards ── */}
      <div className="home-sections">

        <div className="home-section-card">
          <div className="between">
            <h3 className="home-section-title">
              <span className="home-section-icon" aria-hidden>♩</span>
              Today&apos;s Practice
            </h3>
            <button type="button" className="mutelink" onClick={() => navigate('/practice')}>Open</button>
          </div>
          {todayRoutine ? (
            <>
              <p className="home-today-title">{todayRoutine.title}</p>
              <p className="home-today-meta">{todayRoutine.duration_minutes} min · {todayRoutine.steps.length} exercises</p>
            </>
          ) : (
            <p className="home-today-empty">Pick a routine in Explore or Create.</p>
          )}
        </div>

        <div className="home-section-card">
          <h3 className="home-section-title">
            <span className="home-section-icon" aria-hidden>♪</span>
            Quick Access
          </h3>
          <div className="quick home-quick">
            <button type="button" onClick={() => navigate('/profile')}>Saved Routines</button>
            <button type="button" onClick={() => navigate('/create')}>My Exercises</button>
            <button type="button" onClick={() => navigate('/explore')}>Explore</button>
          </div>
        </div>

        <div className="home-section-card home-section-goal">
          <h3 className="home-section-title">
            <span className="home-section-icon" aria-hidden>🌱</span>
            Long-term goal
          </h3>
          <p className="home-goal-text">
            {cat.name} is here for company, not a grade.
          </p>
          <div className="bar home-long-bar">
            <i style={{ width: `${longTermPct}%` }} />
          </div>
          <p className="home-goal-meta">
            {longTermPct}% of your {PRACTICE_MILESTONE_MINUTES}-min milestone
          </p>
        </div>

      </div>
    </section>
  );
}
