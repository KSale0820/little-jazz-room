import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JazzRoomScene } from '../components/JazzRoomScene';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
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
  const { catId, catMotion, repo } = useApp();
  const [lightMode, setLightMode] = useState<RoomLightingMode>(() => readLightingPreference());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lighting = resolveLighting(lightMode);

  const practicedMinutes = useMemo(() => {
    const today = new Date().toDateString();
    return repo
      .listSessions()
      .filter(s => new Date(s.finishedAt).toDateString() === today)
      .reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  }, [repo]);

  const totalMinutes = useMemo(
    () => repo.listSessions().reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0),
    [repo]
  );

  const streak = useMemo(() => computeGentleStreak(repo.listSessions()), [repo]);
  const greeting = useMemo(() => timeGreeting(), []);
  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  const progress = Math.min(100, (practicedMinutes / GOAL_MINUTES) * 100);

  useEffect(() => {
    writeLightingPreference(lightMode);
  }, [lightMode]);

  return (
    <section className="page home-page" aria-label="Home">
      <JazzRoomScene
        lighting={lighting}
        greeting={greeting}
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
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
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
        <div className="home-progress" role="progressbar" aria-valuenow={practicedMinutes} aria-valuemin={0} aria-valuemax={GOAL_MINUTES}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="home-stats-row">
          <span className="home-stat">
            <span className="home-stat-icon" aria-hidden>
              🔥
            </span>
            <strong>{streak}</strong> days
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
    </section>
  );
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, Kat.';
  if (h < 17) return 'Good afternoon, Kat.';
  return 'Good evening, Kat.';
}

function computeGentleStreak(sessions: { finishedAt: string }[]): number {
  const days = new Set(sessions.map(s => new Date(s.finishedAt).toDateString()));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
