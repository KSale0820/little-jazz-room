import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JazzRoomScene, type RoomHotspot } from '../components/JazzRoomScene';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { RoomPanel } from '../features/home-room/RoomPanel';
import {
  LightingPanelContent,
  NotebookPanelContent,
  PlantsPanelContent,
  StandPanelContent,
} from '../features/home-room/RoomPanels';
import { plantGrowth } from '../features/home-room/plantGrowth';
import {
  CAT_PROFILE_NAVIGATION,
  actionForObject,
  nextPanel,
  type RoomPanelId,
} from '../features/home-room/roomPanelState';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { displayNameFromUser, timeGreeting } from '../lib/greeting';
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
import '../features/home-room/home-room.css';
import './HomePage.css';

const GOAL_MINUTES = 30;

const PANEL_TITLES: Record<Exclude<RoomPanelId, null>, { title: string; eyebrow: string }> = {
  'music-stand': { title: "Today's Practice", eyebrow: 'Music stand' },
  notebook: { title: 'Saved Routines', eyebrow: 'Notebook' },
  plants: { title: 'Your Garden', eyebrow: 'Long-term progress' },
  lighting: { title: 'Room Lighting', eyebrow: 'Atmosphere' },
};

const CAT_LINES = [
  'Ready when you are.',
  'A few gentle minutes is plenty.',
  'The piano has been waiting.',
  "Let's warm up slowly.",
  'No rush. Just a little music.',
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { catId, catMotion, sessions, routines, activeRoutineId, setActiveRoutineId } = useApp();
  const [lightMode, setLightMode] = useState<RoomLightingMode>(() => readLightingPreference());
  const [activePanel, setActivePanel] = useState<RoomPanelId>(null);
  const [notes, setNotes] = useState(false);
  const [bubble, setBubble] = useState(true);
  const timers = useRef<number[]>([]);
  const lighting = resolveLighting(lightMode);

  const practicedMinutes = useMemo(() => minutesToday(sessions), [sessions]);
  const totalMinutes = useMemo(() => totalPracticeMinutes(sessions), [sessions]);
  const streak = useMemo(() => computeGentleStreak(sessions), [sessions]);
  const longTermPct = useMemo(() => longTermProgressPercent(sessions), [sessions]);
  const greeting = useMemo(() => timeGreeting(displayNameFromUser(user)), [user]);
  const growth = useMemo(() => plantGrowth(totalMinutes), [totalMinutes]);
  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  const todayRoutine = activeRoutineId ? routines.find(r => r.id === activeRoutineId) : undefined;
  const [catLine] = useState(() => CAT_LINES[new Date().getDate() % CAT_LINES.length]);

  useEffect(() => {
    writeLightingPreference(lightMode);
  }, [lightMode]);

  useEffect(() => {
    const t = window.setTimeout(() => setBubble(false), 7000);
    const pending = timers.current;
    return () => {
      window.clearTimeout(t);
      pending.forEach(window.clearTimeout);
    };
  }, []);

  const togglePanel = useCallback((id: RoomPanelId) => setActivePanel(cur => nextPanel(cur, id)), []);
  const closePanel = useCallback(() => setActivePanel(null), []);

  const startPractice = useCallback(() => {
    setActivePanel(null);
    if (prefersReducedMotion()) {
      navigate('/practice');
      return;
    }
    setNotes(true);
    timers.current.push(window.setTimeout(() => navigate('/practice'), 420));
  }, [navigate]);

  const onHotspot = (id: RoomHotspot) => {
    if (id === 'stand' || id === 'notebook') { navigate('/routines'); return; }
    setBubble(false);
    const action = actionForObject(id);
    if (action.kind === 'navigate') startPractice();
    else togglePanel(action.panel);
  };

  const panelBody = (() => {
    switch (activePanel) {
      case 'music-stand':
        return (
          <StandPanelContent
            routine={todayRoutine}
            onStart={startPractice}
            onOpenNotebook={() => setActivePanel('notebook')}
          />
        );
      case 'notebook':
        return (
          <NotebookPanelContent
            routines={routines}
            activeRoutineId={activeRoutineId}
            onSelect={setActiveRoutineId}
            onStart={startPractice}
          />
        );
      case 'plants':
        return <PlantsPanelContent totalMinutes={totalMinutes} percent={longTermPct} />;
      case 'lighting':
        return <LightingPanelContent mode={lightMode} resolved={lighting} onChange={setLightMode} />;
      default:
        return null;
    }
  })();

  const progress = Math.min(100, (practicedMinutes / GOAL_MINUTES) * 100);

  return (
    <section className="page home-room-page" aria-label="Home">
      <header className="home-header">
        <div className="home-title-chip">
          <h1 className="home-title">My Jazz Room</h1>
          <p className="home-greeting">{greeting}</p>
          <p className="home-next">
            {todayRoutine ? `Up next · ${todayRoutine.title} · ${todayRoutine.duration_minutes} min` : 'Pick a routine from the sheet music or the shelf'}
          </p>
        </div>
        <button
          type="button"
          className="home-light-btn"
          aria-label="Room lighting"
          aria-haspopup="dialog"
          aria-expanded={activePanel === 'lighting'}
          onClick={() => togglePanel('lighting')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
        </button>
        <p className="home-hint" aria-hidden="true">
          Tap the piano, shelf, sheet music or plants
        </p>
      </header>
      <div className="home-room-stage">
        <JazzRoomScene
          lighting={lighting}
          plantStage={growth.stage}
          notesActive={notes}
          onHotspot={onHotspot}
          catOverlay={
            <>
              {bubble ? (
                <p className="home-cat-bubble" aria-hidden="true">
                  {catLine}
                </p>
              ) : null}
              <button
                type="button"
                className="home-cat-btn"
                aria-label={`Your companion ${cat.name}. Open profile to choose a cat.`}
                onClick={() => navigate(CAT_PROFILE_NAVIGATION.to, { state: CAT_PROFILE_NAVIGATION.state })}
              >
                <CatSprite catId={catId} size={220} animated={catMotion} variant="floor" decorative className="home-cat-sprite" />
              </button>
            </>
          }
        />
        {activePanel ? (
          <RoomPanel
            key={activePanel}
            title={PANEL_TITLES[activePanel].title}
            eyebrow={PANEL_TITLES[activePanel].eyebrow}
            onClose={closePanel}
          >
            {panelBody}
          </RoomPanel>
        ) : null}
      </div>

      <div className="home-hud" aria-label="Today's progress">
        <div className="home-hud-goal">
          <div className="home-hud-row">
            <span className="home-hud-label">Today</span>
            <span className="home-hud-value">
              {practicedMinutes} / {GOAL_MINUTES} min
            </span>
          </div>
          <div
            className="home-hud-bar"
            role="progressbar"
            aria-label="Daily practice goal"
            aria-valuenow={Math.min(practicedMinutes, GOAL_MINUTES)}
            aria-valuemin={0}
            aria-valuemax={GOAL_MINUTES}
          >
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="home-hud-streak" title="Gentle streak, no pressure">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14z" />
            <path d="M5 19c3-5 6-8 9-10" />
          </svg>
          <span>
            <strong>{streak}</strong> day{streak === 1 ? '' : 's'}
          </span>
        </div>
        <button type="button" className="home-hud-practice" onClick={startPractice}>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
          Practice
        </button>
      </div>
    </section>
  );
}
