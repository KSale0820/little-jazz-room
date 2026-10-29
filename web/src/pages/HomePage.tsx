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

const GOAL_MINUTES = 30;

export function HomePage() {
  const navigate = useNavigate();
  const { catId, catMotion, activeRoutineId, repo, routines } = useApp();
  const [lightMode, setLightMode] = useState<RoomLightingMode>(() => readLightingPreference());
  const lighting = resolveLighting(lightMode);

  const todayRoutine = activeRoutineId ? routines.find(r => r.id === activeRoutineId) : undefined;
  const practicedMinutes = useMemo(() => {
    const today = new Date().toDateString();
    return repo
      .listSessions()
      .filter(s => new Date(s.finishedAt).toDateString() === today)
      .reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  }, [repo]);

  const streak = useMemo(() => computeGentleStreak(repo.listSessions()), [repo]);

  useEffect(() => {
    writeLightingPreference(lightMode);
  }, [lightMode]);

  const cat = JAZZ_CATS.find(c => c.id === catId)!;

  return (
    <section className="page home-page" aria-label="Home">
      <JazzRoomScene
        lighting={lighting}
        lightingControl={
          <>
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
          </>
        }
        catOverlay={
          <button
            type="button"
            className="scene-cat"
            aria-label="Choose your jazz cat"
            title="Choose your jazz cat"
            onClick={() => navigate('/profile', { state: { scrollToCat: true } })}
          >
            <CatSprite catId={catId} size={110} animated={catMotion} variant="portrait" />
          </button>
        }
      />
      <div className="home-body pad-inline">
        <div className="box goal">
          <div className="between">
            <strong>Daily goal</strong>
            <strong className="tiny">
              {practicedMinutes} / {GOAL_MINUTES} min
            </strong>
          </div>
          <div className="bar">
            <i style={{ width: `${Math.min(100, (practicedMinutes / GOAL_MINUTES) * 100)}%` }} />
          </div>
          <div className="between spaced">
            <strong>Streak</strong>
            <span className="muted">{streak} practice days · no pressure</span>
          </div>
          <button type="button" className="btn primary wide start" onClick={() => navigate('/practice')}>
            ▶ Start Practicing
          </button>
        </div>
        <div className="box">
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
        <div className="box">
          <h3>Quick Access</h3>
          <div className="quick">
            <button type="button" onClick={() => navigate('/profile')}>
              <span className="pixel" aria-hidden>
                ▣
              </span>
              Saved Routines
            </button>
            <button type="button" onClick={() => navigate('/create')}>
              <span className="pixel" aria-hidden>
                ✚
              </span>
              My Exercises
            </button>
            <button type="button" onClick={() => navigate('/explore')}>
              <span className="pixel" aria-hidden>
                ⌕
              </span>
              Explore
            </button>
          </div>
        </div>
        <div className="box">
          <div className="between">
            <h3>Long-term goal</h3>
            <CatSprite catId={catId} size={33} animated={catMotion} className="tiny-cat" />
          </div>
          <p className="muted goal-text">
            Play confident solos over ii–V–I progressions with {cat.name}.
          </p>
          <div className="bar">
            <i style={{ width: '40%' }} />
          </div>
          <small>40% toward your goal (sample progress)</small>
        </div>
        <div className="room-fallbacks screen-reader-only" aria-label="Room shortcuts">
          <button type="button" className="btn" onClick={() => navigate('/practice')}>
            Open Practice
          </button>
          <button type="button" className="btn" onClick={() => navigate('/explore')}>
            Browse exercises
          </button>
          <button type="button" className="btn" onClick={() => navigate('/profile')}>
            Saved routines
          </button>
        </div>
      </div>
    </section>
  );
}

function computeGentleStreak(sessions: { finishedAt: string }[]): number {
  const days = new Set(sessions.map(s => new Date(s.finishedAt).toDateString()));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toDateString();
    if (days.has(key)) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
