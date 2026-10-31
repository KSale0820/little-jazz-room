import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CatChooser, CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
import './ProfilePage.css';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export function ProfilePage() {
  const {
    catId, chooseCat, catSaveError,
    catMotion, setCatMotion,
    sessions, routines,
    showToast, setActiveRoutineId,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear,  setCalendarYear]  = useState(today.getFullYear());

  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const sessionCount  = sessions.length;
  const minutes       = sessions.reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  const routineCount  = routines.length;

  const markedDays = useMemo(() => {
    const set = new Set<number>();
    for (const s of sessions) {
      const d = new Date(s.finishedAt);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) set.add(d.getDate());
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

  const shiftMonth = (delta: number) => {
    const d = new Date(calendarYear, calendarMonth + delta, 1);
    setCalendarMonth(d.getMonth());
    setCalendarYear(d.getFullYear());
  };

  return (
    <section className="page profile-page" aria-label="Profile">

      {/* ── Page heading ── */}
      <div className="profile-heading">
        <div className="profile-heading-text">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Your jazz companion and practice history.</p>
        </div>
      </div>

      {/* ── Active companion card ── */}
      <div className="profile-companion-card">
        <div className="profile-companion-info">
          <span className="profile-companion-badge">Your companion</span>
          <h2 className="profile-companion-name">{cat.name}</h2>
          <p className="profile-companion-detail">{cat.instrument}</p>
          <p className="profile-companion-detail profile-companion-muted">{cat.age} · {cat.build} · {cat.personality}</p>
          <button
            type="button"
            className="profile-companion-change"
            onClick={() => chooserRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Change companion
          </button>
        </div>
        <div className="profile-companion-art">
          <CatSprite catId={catId} size={140} animated={catMotion} variant="floor" decorative />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="profile-stats-grid">
        <div className="profile-stat">
          <strong>{sessionCount}</strong>
          <span>sessions</span>
        </div>
        <div className="profile-stat">
          <strong>{minutes}</strong>
          <span>minutes</span>
        </div>
        <div className="profile-stat">
          <strong>{routineCount}</strong>
          <span>routines</span>
        </div>
      </div>

      {/* ── Eight-cat chooser ── */}
      <div ref={chooserRef} className="profile-section">
        <CatChooser
          catId={catId}
          onSelect={async id => {
            await chooseCat(id);
            showToast(`${JAZZ_CATS.find(c => c.id === id)!.name} is now your companion.`);
          }}
        />
        {catSaveError ? <p className="profile-save-error">{catSaveError}</p> : null}
      </div>

      {/* ── Motion preference ── */}
      <label className="profile-motion-label">
        <input type="checkbox" checked={catMotion} onChange={e => setCatMotion(e.target.checked)} />
        Gentle cat animation
      </label>

      {/* ── Practice calendar ── */}
      <div className="box profile-section">
        <div className="between">
          <h3>Practice calendar</h3>
          <div className="row">
            <button type="button" className="btn tiny" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
            <strong className="tiny">{MONTH_NAMES[calendarMonth]} {calendarYear}</strong>
            <button type="button" className="btn tiny" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
          </div>
        </div>
        <div className="days calendar-grid" aria-label={`Practice calendar for ${MONTH_NAMES[calendarMonth]} ${calendarYear}`}>
          {['S','M','T','W','T','F','S'].map((label, i) => (
            <span key={`${label}-${i}`} className="calendar-dow">{label}</span>
          ))}
          {calendarCells.map((day, i) =>
            day === null
              ? <span key={`pad-${i}`} className="calendar-pad" aria-hidden />
              : <span key={day} className={markedDays.has(day) ? 'marked' : undefined}>{day}</span>
          )}
        </div>
      </div>

      {/* ── Saved routines ── */}
      <div className="box profile-section">
        <h3>Saved routines</h3>
        {routines.slice(0, 6).map(r => (
          <div key={r.id} className="minirow">
            <div>
              <strong>{r.title}</strong>
              <br />
              <small>{r.duration_minutes} min · {r.is_seed === false ? 'Yours' : 'Seed sample'}</small>
            </div>
            <button
              type="button"
              className="mutelink"
              onClick={() => { setActiveRoutineId(r.id); navigate('/player'); }}
            >
              Practice
            </button>
          </div>
        ))}
      </div>

      {/* ── Achievements (preview) ── */}
      <div className="box profile-section">
        <h3>Achievements</h3>
        <p className="muted" style={{ marginTop: 7 }}>
          First practice · gentle streak · first routine <em>(preview badges)</em>
        </p>
      </div>

      {/* ── Friends and challenges (preview) ── */}
      <div className="box profile-section">
        <h3>Friends and challenges</h3>
        <p className="muted" style={{ marginTop: 7 }}>
          Preview · Share goals and community challenges in a future release.
        </p>
      </div>

    </section>
  );
}
