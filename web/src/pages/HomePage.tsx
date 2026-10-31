import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { displayNameFromUser, timeGreeting } from '../lib/greeting';
import { computeGentleStreak, minutesToday } from '../lib/practiceStats';
import {
  readLightingPreference, resolveLighting,
} from '../lib/roomLighting';
import './HomePage.css';

const GOAL_MINUTES = 30;
type Hotspot = 'practice' | 'routines' | 'charts' | 'tracks';

const HOTSPOTS: { id: Hotspot; text: string; description: string; to: string }[] = [
  { id: 'practice', text: 'Practice', description: 'Piano: open Practice', to: '/practice' },
  { id: 'routines', text: 'Routines', description: 'Music stand: browse routines', to: '/routines' },
  { id: 'charts', text: 'Charts', description: 'Bookshelf: browse charts', to: '/charts' },
  { id: 'tracks', text: 'Tracks', description: 'Record player: browse tracks', to: '/tracks' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { catId, catMotion, sessions, routines, activeRoutineId, setActiveRoutineId } = useApp();
  const lighting = resolveLighting(readLightingPreference());

  const greeting = useMemo(() => timeGreeting(displayNameFromUser(user)), [user]);
  const todayMinutes = useMemo(() => minutesToday(sessions), [sessions]);
  const streak = useMemo(() => computeGentleStreak(sessions), [sessions]);
  const routine = routines.find(r => r.id === activeRoutineId)
    ?? routines.find(r => r.id === 'daily-warm-up')
    ?? routines[0];
  const companion = JAZZ_CATS.find(cat => cat.id === catId);
  const todayProgress = Math.min(100, todayMinutes / GOAL_MINUTES * 100);

  const openRoutine = () => {
    if (!routine) { navigate('/routines'); return; }
    setActiveRoutineId(routine.id);
    navigate('/player');
  };

  return (
    <section className="h01-page" aria-label="Home">
      <div className="h01-scene-window">
        <div className="h01-scene-image-frame">
          <img
            className="h01-room-image"
            src={VISUAL_ASSETS.room.approved[lighting]}
            alt=""
            aria-hidden="true"
          />
          <div className="h01-hotspots">
            {HOTSPOTS.map(h => (
              <button
                key={h.id}
                type="button"
                className={`h01-hotspot h01-hotspot--${h.id}`}
                aria-label={h.description}
                onClick={() => navigate(h.to)}
              >
                <span className="h01-hotspot-label"><span className="h01-hotspot-dot" aria-hidden="true" />{h.text}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="h01-companion"
            onClick={() => navigate('/profile', { state: { scrollToCat: true } })}
            aria-label={`Change companion: ${companion?.name ?? 'jazz cat'}`}
          >
            <CatSprite catId={catId} variant="floor" size={132} animated={catMotion} decorative />
          </button>
        </div>
        <div className="h01-scene-fade" aria-hidden="true" />
        <header className="h01-header">
          <div className="h01-greeting">
            <span className="h01-sprig" aria-hidden="true">❧</span>
            <div>
              <h1>{greeting}</h1>
              <p>Let's practice a little jazz today.</p>
            </div>
          </div>
          <button type="button" className="h01-settings-button" aria-label="Settings" onClick={() => navigate('/profile')}>⚙</button>
        </header>
      </div>

      <div className="h01-content">
        <div className="h01-quick-actions">
          <button type="button" className="h01-primary-button" onClick={() => navigate('/practice')}>Start Practice</button>
          <button type="button" className="h01-secondary-button" onClick={() => navigate('/tracks')}>Browse Tracks</button>
        </div>

        <section className="h01-daily-card" aria-label="Today's practice">
          <div className="h01-card-title">
            <h2>Today's Practice</h2>
            <button type="button" className="h01-change-button" onClick={() => navigate('/routines')} aria-label="Choose another routine">
              <span aria-hidden="true">↻</span> Change
            </button>
          </div>
          {routine ? (
            <div className="h01-daily-details">
              <button type="button" className="h01-routine-link" onClick={openRoutine} aria-label={`Practice ${routine.title}`}>
                <img src={VISUAL_ASSETS.approvedDecor.books} alt="" className="h01-daily-art" />
                <span className="h01-daily-copy">
                  <strong>{routine.title} <span className="h01-middle-dot">·</span> {routine.duration_minutes} min</strong>
                  <small>{routine.steps.length} guided steps <span className="h01-middle-dot">·</span> {routine.level}</small>
                  <small>Recorded backing tracks: Preview</small>
                </span>
              </button>
              <button type="button" className="h01-play-button" onClick={openRoutine} aria-label={`Open practice player for ${routine.title}`}><span aria-hidden="true">▶</span></button>
            </div>
          ) : (
            <button type="button" className="h01-routine-empty" onClick={() => navigate('/routines')}>Browse guided routines</button>
          )}
        </section>

        <button type="button" className="h01-stats-card" onClick={() => navigate('/progress')} aria-label={`Open progress. ${todayMinutes} minutes today; ${streak} day streak`}>
          <span className="h01-stats-icon" aria-hidden="true"><i /><i /><i /></span>
          <span className="h01-stats-today">
            <strong>{todayMinutes} min today</strong>
            <span className="h01-progress-track"><i style={{ width: `${todayProgress}%` }} /></span>
          </span>
          <span className="h01-stats-divider" />
          <span className="h01-flame" aria-hidden="true">♨</span>
          <span className="h01-stats-streak"><strong>{streak} day streak</strong><small>Keep it going!</small></span>
        </button>
      </div>
    </section>
  );
}
