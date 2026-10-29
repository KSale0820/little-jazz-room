import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JazzRoomScene } from '../components/JazzRoomScene';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
import { timeGreeting } from '../lib/greeting';
import {
  computeGentleStreak,
  longTermProgressPercent,
  minutesToday,
  totalPracticeMinutes,
} from '../lib/practiceStats';
import {
  readLightingPreference,
  resolveLighting,
  writeLightingPreference,
  type RoomLightingMode,
} from '../lib/roomLighting';
import './HomePage.css';

const GOAL_MINUTES = 30;

export function HomePage() {
  const navigate = useNavigate();
  const { catId, catMotion, sessions, activeRoutineId, routines } = useApp();
  const [lightMode, setLightMode] = useState<RoomLightingMode>(() => readLightingPreference());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lighting = resolveLighting(lightMode);

  const practicedMinutes = useMemo(() => minutesToday(sessions), [sessions]);
  const totalMinutes = useMemo(() => totalPracticeMinutes(sessions), [sessions]);
  const streak = useMemo(() => computeGentleStreak(sessions), [sessions]);
  const longTermPct = useMemo(() => longTermProgressPercent(sessions), [sessions]);
  const greeting = useMemo(() => timeGreeting(), []);
  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  const progress = Math.min(100, (practicedMinutes / GOAL_MINUTES) * 100);
  const todayRoutine = activeRoutineId ? routines.find(r => r.id === activeRoutineId) : undefined;

  useEffect(() => {
    writeLightingPreference(lightMode);
  }, [lightMode]);

  const goHotspot = (target: 'piano' | 'stand' | 'notebook') => {
    if (target === 'piano') navigate('/practice');
    else if (target === 'stand') navigate('/explore');
    else navigate('/profile');
  };

  return (
    <section className="page home-page" aria-label="Home">
      <JazzRoomScene
        lighting={lighting}
        greeting={greeting}
        onHotspot={goHotspot}
        settingsControl={
          <div className="home-settings-wrap">
            <button
              type="button"
              className="home-gear-btn"
              aria-label="Room settings"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen(o => !o)}
            >
              <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </button>
            {settingsOpen ? (
              <div className="home-settings-panel" role="dialog" aria-label="Room settings">
                <label htmlFor="room-light">Room light</label>
                <select
                  id="room-light"
                  value={lightMode}
                  onChange={e => setLightMode(e.target.value as RoomLightingMode)}
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
            ) : null}
          </div>
        }
        catOverlay={
          <button
            type="button"
            className="home-cat-btn"
            aria-label={`Your companion ${cat.name}. Choose cat.`}
            onClick={() => navigate('/profile', { state: { scrollToCat: true } })}
          >
            <CatSprite catId={catId} size={128} animated={catMotion} variant="portrait" className="home-cat-sprite" />
          </button>
        }
      />

      <div className="home-goal-card">
        <div className="home-goal-row">
          <span className="home-goal-label">Daily goal</span>
          <span className="home-goal-minutes">
            {practicedMinutes} / {GOAL_MINUTES} min
          </span>
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
            <span className="home-stat-icon" aria-hidden>
              🔥
            </span>
            <strong>{streak}</strong> days
          </span>
          <span className="home-stat home-stat-muted">
            Gentle streak · no pressure
          </span>
          <span className="home-stat">
            <span className="home-stat-icon note" aria-hidden>
              ♪
            </span>
            <strong>{totalMinutes}</strong>
          </span>
        </div>
        <button type="button" className="home-start-btn" onClick={() => navigate('/practice')}>
          <span className="home-play-icon" aria-hidden>
            ▶
          </span>
          Start Practicing
        </button>
      </div>

      <div className="home-sections pad-inline">
        <div className="box home-section">
          <div className="between">
            <h3>Today&apos;s Practice</h3>
            <button type="button" className="mutelink" onClick={() => navigate('/practice')}>
              Open
            </button>
          </div>
          {todayRoutine ? (
            <>
              <p className="today-title">{todayRoutine.title}</p>
              <small>
                {todayRoutine.duration_minutes} min · {todayRoutine.steps.length} exercises
              </small>
            </>
          ) : (
            <p className="muted">Pick a routine in Explore or Create.</p>
          )}
        </div>

        <div className="box home-section">
          <h3>Quick Access</h3>
          <div className="quick">
            <button type="button" onClick={() => navigate('/profile')}>
              Saved Routines
            </button>
            <button type="button" onClick={() => navigate('/create')}>
              My Exercises
            </button>
            <button type="button" onClick={() => navigate('/explore')}>
              Explore
            </button>
          </div>
        </div>

        <div className="box home-section">
          <div className="between">
            <h3>Long-term goal</h3>
            <CatSprite catId={catId} size={33} animated={catMotion} className="tiny-cat" />
          </div>
          <p className="muted goal-text">
            Play confident solos over ii–V–I progressions with {cat.name}.
          </p>
          <div className="bar">
            <i style={{ width: `${longTermPct}%` }} />
          </div>
          <small>{longTermPct}% toward your gentle milestone (300 min on this device)</small>
        </div>
      </div>
    </section>
  );
}
