import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CatChooser, CatSprite, JAZZ_CATS, isVisibleCatId } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cumulativePracticeMinutes, readPreviouslySelectedCat, readSavedUnlocks, saveUnlockedCompanions, unlockedCompanions } from '../lib/companionUnlocks';
import { useAppearance } from '../context/AppearanceContext';
import './ProfilePage.css';

export function ProfilePage() {
  const {
    catId, chooseCat, catSaveError,
    catMotion, setCatMotion,
    sessions, routines,
    showToast, setActiveRoutineId,
  } = useApp();
  const { theme, mode, setMode, catMode, setCatMode } = useAppearance();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const sessionCount  = sessions.length;
  const minutes       = sessions.reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  const routineCount  = routines.length;

  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  const accountKey = user?.id ?? 'local';
  const unlockMinutes = cumulativePracticeMinutes(sessions);
  // Previously selected companions remain available, even if historic practice
  // records did not migrate. Earned IDs are cached per account for continuity.
  const unlockedIds = unlockedCompanions(
    unlockMinutes,
    readSavedUnlocks(accountKey),
    // Read the account-scoped stored selection rather than an in-flight catId
    // from another account during authentication transitions.
    readPreviouslySelectedCat(accountKey),
  );
  const unlockedSignature = unlockedIds.join(',');
  useEffect(() => {
    saveUnlockedCompanions(accountKey, unlockedIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountKey, unlockedSignature]);

  return (
    <section className="page profile-page" aria-label="Profile">

      {/* ── Page heading ── */}
      <div className="profile-heading">
        <div className="profile-heading-text">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Your companion and appearance settings.</p>
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

      {/* ── Current pixel companion trio chooser; retired IDs preserved separately ── */}
      <div ref={chooserRef} className="profile-section">
        <CatChooser
          catId={catId}
          unlockedIds={unlockedIds}
          practiceMinutes={unlockMinutes}
          onSelect={async id => {
            if (!isVisibleCatId(id) || !unlockedIds.includes(id)) return;
            await chooseCat(id);
            showToast(`${JAZZ_CATS.find(c => c.id === id)!.name} is now your companion.`);
          }}
        />
        {catSaveError ? <p className="profile-save-error">{catSaveError}</p> : null}
      </div>

      {/* Appearance preferences live in the existing Profile/Settings destination. */}
      <section className="box profile-section profile-appearance-settings" aria-labelledby="appearance-heading">
        <h3 id="appearance-heading">Settings · Appearance</h3>
        <p className="profile-appearance-help">Choose a palette for your practice space.</p>
        <div className="profile-theme-choices" role="group" aria-label="Color theme">
          <button type="button" className="profile-theme-choice" aria-pressed={theme === 'light'} onClick={() => setMode('light')}>Light</button>
          <button type="button" className="profile-theme-choice" aria-pressed={theme === 'dark'} onClick={() => setMode('dark')}>Dark</button>
        </div>
        {mode === 'system'
          ? <p className="profile-appearance-note">Following your device appearance until you choose a theme.</p>
          : <p className="profile-appearance-note">Your theme choice is saved on this device.</p>}
        <label className="profile-cat-mode-label">
          <input type="checkbox" checked={catMode} onChange={event => setCatMode(event.target.checked)} />
          <span><strong>Cat Mode</strong><small>Show optional scene cats in Home, Tuner and Metronome. Your Progress companion, avatars and rewards always remain.</small></span>
        </label>
      </section>

      {/* ── Motion preference ── */}
      <label className="profile-motion-label">
        <input type="checkbox" checked={catMotion} onChange={e => setCatMotion(e.target.checked)} />
        Gentle cat animation
      </label>

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
