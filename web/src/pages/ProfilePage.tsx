import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CatChooser, CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';

export function ProfilePage() {
  const {
    catId,
    chooseCat,
    catSaveError,
    catMotion,
    setCatMotion,
    repo,
    routines,
    showToast,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const sessions = repo.listSessions();
  const sessionCount = sessions.length;
  const minutes = sessions.reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  const routineCount = routines.length;

  const markedDays = useMemo(() => {
    const set = new Set(sessions.map(s => new Date(s.finishedAt).getDate()));
    return set;
  }, [sessions]);

  const cat = JAZZ_CATS.find(c => c.id === catId)!;

  return (
    <section className="page profile-page pad tight" aria-label="Profile">
      <div className="pageheading">
        <h1>Progress</h1>
        <span className="mutebadge">Your jazz companion</span>
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
        <input
          type="checkbox"
          checked={catMotion}
          onChange={e => setCatMotion(e.target.checked)}
        />
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
        <h3>Practice calendar</h3>
        <div className="days" aria-label="Practice calendar sample">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} className={markedDays.has(i + 1) ? 'marked' : undefined}>
              {i + 1}
            </span>
          ))}
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
            <button type="button" className="mutelink" onClick={() => navigate('/practice')}>
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
