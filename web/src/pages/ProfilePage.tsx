import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CatChooser, CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { RoomArt } from '../components/RoomArt';
import { PageAtmosphere } from '../components/PageAtmosphere';
import { resolveLighting, readLightingPreference } from '../lib/roomLighting';
import { useApp } from '../context/AppContext';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function ProfilePage() {
  const {
    catId,
    chooseCat,
    catSaveError,
    catMotion,
    setCatMotion,
    sessions,
    routines,
    showToast,
    setActiveRoutineId,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const sessionCount = sessions.length;
  const minutes = sessions.reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  const routineCount = routines.length;

  const markedDays = useMemo(() => {
    const set = new Set<number>();
    for (const s of sessions) {
      const d = new Date(s.finishedAt);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [sessions, calendarMonth, calendarYear]);

  const calendarCells = useMemo(() => {
    const first = new Date(calendarYear, calendarMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calendarMonth, calendarYear]);

  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  const profileLighting = resolveLighting(readLightingPreference());

  const shiftMonth = (delta: number) => {
    const d = new Date(calendarYear, calendarMonth + delta, 1);
    setCalendarMonth(d.getMonth());
    setCalendarYear(d.getFullYear());
  };

  return (
    <section className="page profile-page pad tight" aria-label="Profile">
      <PageAtmosphere title="Progress" subtitle="Your jazz companion and practice history." badge="Your jazz companion" />
      <div className="profile-room-banner botanical-frame" aria-hidden>
        <RoomArt lighting={profileLighting} />
        <div className="profile-banner-cat">
          <CatSprite catId={catId} size={120} animated={catMotion} variant="sprite" decorative />
        </div>
      </div>
      <div className="box">
        <div className="between">
          <div>
            <h3>My Jazz Journey</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {cat.instrument} · Learning jazz
            </p>
          </div>
          <button
            type="button"
            className="profile-cat"
            aria-label="Choose your jazz cat"
            onClick={() => chooserRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CatSprite catId={catId} size={64} animated={catMotion} variant="portrait" />
          </button>
        </div>
      </div>
      <div ref={chooserRef}>
        <CatChooser
          catId={catId}
          onSelect={async id => {
            await chooseCat(id);
            showToast(`${JAZZ_CATS.find(c => c.id === id)!.name} is now your companion.`);
          }}
        />
      </div>
      {catSaveError ? <p className="muted">{catSaveError}</p> : null}
      <label className="tiny row" style={{ marginTop: 8 }}>
        <input type="checkbox" checked={catMotion} onChange={e => setCatMotion(e.target.checked)} />
        Gentle cat animation
      </label>
      <h3 className="section-title">
        Practice stats <span className="muted">(this device)</span>
      </h3>
      <div className="statgrid">
        <div className="stat">
          <b>{sessionCount}</b>
          <span>sessions</span>
        </div>
        <div className="stat">
          <b>{minutes}</b>
          <span>minutes</span>
        </div>
        <div className="stat">
          <b>{routineCount}</b>
          <span>routines in catalog</span>
        </div>
      </div>
      <div className="box">
        <div className="between">
          <h3>Practice calendar</h3>
          <div className="row">
            <button type="button" className="btn tiny" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
              ‹
            </button>
            <strong className="tiny">
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </strong>
            <button type="button" className="btn tiny" aria-label="Next month" onClick={() => shiftMonth(1)}>
              ›
            </button>
          </div>
        </div>
        <div className="days calendar-grid" aria-label={`Practice calendar for ${MONTH_NAMES[calendarMonth]} ${calendarYear}`}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
            <span key={`${label}-${i}`} className="calendar-dow">
              {label}
            </span>
          ))}
          {calendarCells.map((day, i) =>
            day === null ? (
              <span key={`pad-${i}`} className="calendar-pad" aria-hidden />
            ) : (
              <span key={day} className={markedDays.has(day) ? 'marked' : undefined}>
                {day}
              </span>
            )
          )}
        </div>
      </div>
      <div className="box">
        <h3>Saved routines</h3>
        {routines.slice(0, 6).map(r => (
          <div key={r.id} className="minirow">
            <div>
              <strong>{r.title}</strong>
              <br />
              <small>
                {r.duration_minutes} min · {r.is_seed === false ? 'Yours' : 'Seed sample'}
              </small>
            </div>
            <button
              type="button"
              className="mutelink"
              onClick={() => {
                setActiveRoutineId(r.id);
                navigate('/practice');
              }}
            >
              Practice
            </button>
          </div>
        ))}
      </div>
      <div className="box">
        <h3>Achievements</h3>
        <p className="muted" style={{ marginTop: 7 }}>
          First practice · gentle streak · first routine (preview badges)
        </p>
      </div>
      <div className="box">
        <h3>Friends and challenges</h3>
        <p className="muted" style={{ marginTop: 7 }}>
          Preview · Share goals and community challenges in a future release.
        </p>
      </div>
    </section>
  );
}
