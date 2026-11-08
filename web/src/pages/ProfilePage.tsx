import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { CatChooser, CatSprite, JAZZ_CATS, isVisibleCatId } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cumulativePracticeMinutes, readPreviouslySelectedCat, readSavedUnlocks, saveUnlockedCompanions, unlockedCompanions } from '../lib/companionUnlocks';
import './ProfilePage.css';

export function ProfilePage() {
  const { catId, chooseCat, catSaveError, catMotion, sessions, routines, showToast, setActiveRoutineId } = useApp();
  const { configured, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const cat = JAZZ_CATS.find(c => c.id === catId) ?? JAZZ_CATS[0];
  const accountKey = user?.id ?? 'local';
  const practiceMinutes = cumulativePracticeMinutes(sessions);
  // Keep previously earned and selected companions even if older sessions were migrated.
  const unlockedIds = unlockedCompanions(
    practiceMinutes,
    readSavedUnlocks(accountKey),
    readPreviouslySelectedCat(accountKey),
  );
  const unlockedSignature = unlockedIds.join(',');
  useEffect(() => {
    saveUnlockedCompanions(accountKey, unlockedIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountKey, unlockedSignature]);

  return (
    <section className="page profile-page" aria-label="Profile">
      <header className="profile-heading">
        <div>
          <img className="profile-brand" src={VISUAL_ASSETS.brand.wordmark} alt="Little Jazz Room" />
          <h1 className="profile-title">Your Profile</h1>
          <p className="profile-subtitle">Your little corner of the studio.</p>
        </div>
        <Link className="profile-settings-link" to="/settings" aria-label="Open settings">
          <span aria-hidden="true">⚙</span><span>Settings</span>
        </Link>
      </header>

      <section className="profile-companion-card" aria-label="Selected jazz companion">
        <div className="profile-companion-info">
          <span className="profile-companion-badge">Your companion</span>
          <h2 className="profile-companion-name">{cat.name}</h2>
          <p className="profile-companion-detail">{cat.instrument}</p>
          <p className="profile-companion-detail profile-companion-muted">{cat.personality}</p>
          <button
            type="button"
            className="profile-companion-change"
            onClick={() => chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Choose companion <span aria-hidden="true">↘</span>
          </button>
        </div>
        <div className="profile-companion-art">
          <CatSprite catId={catId} size={140} animated={catMotion} variant="floor" />
        </div>
      </section>

      <div className="profile-stats-grid" aria-label="Your practice totals">
        <div className="profile-stat"><strong>{sessions.length}</strong><span>sessions</span></div>
        <div className="profile-stat"><strong>{practiceMinutes}</strong><span>minutes practiced</span></div>
        <div className="profile-stat"><strong>{routines.length}</strong><span>routines</span></div>
      </div>

      <div ref={chooserRef} className="profile-section profile-chooser">
        <CatChooser
          catId={catId}
          unlockedIds={unlockedIds}
          practiceMinutes={practiceMinutes}
          onSelect={async id => {
            if (!isVisibleCatId(id) || !unlockedIds.includes(id)) return;
            await chooseCat(id);
            showToast(`${JAZZ_CATS.find(c => c.id === id)!.name} is now your companion.`);
          }}
        />
        {catSaveError ? <p className="profile-save-error" role="status">{catSaveError}</p> : null}
        <p className="profile-chooser-note">Milo unlocks after 60 completed practice minutes. Maple unlocks after 300. Earned companions stay unlocked.</p>
      </div>

      <section className="profile-panel profile-section" aria-labelledby="profile-account-heading">
        <div className="profile-panel-heading">
          <h2 id="profile-account-heading">Account</h2>
          <span className="profile-account-pill">{user ? 'Signed in' : 'Local'}</span>
        </div>
        <p className="profile-account-value">{user?.email ?? 'Local practice profile'}</p>
        <p className="profile-panel-description">{user
          ? 'Your account connects your saved practice where cloud sync is available.'
          : 'Practice is saved on this device. Sign in if your team has an account.'}</p>
        {configured && !user ? <Link className="profile-account-action" to="/signin">Team sign in</Link> : null}
        <Link className="profile-account-action" to="/settings">Account & appearance settings <span aria-hidden="true">›</span></Link>
      </section>

      <section className="profile-panel profile-section" aria-labelledby="profile-routines-heading">
        <div className="profile-panel-heading">
          <h2 id="profile-routines-heading">Saved routines</h2>
          <Link className="profile-account-action" to="/routines">View all <span aria-hidden="true">›</span></Link>
        </div>
        {routines.length === 0 ? <p className="profile-panel-description">No routines yet. Create one when you're ready.</p> : (
          <div className="profile-routines-list">
            {routines.slice(0, 3).map(r => (
              <div key={r.id} className="profile-routine-row">
                <div><strong>{r.title}</strong><small>{r.duration_minutes} min · {r.is_seed === false ? 'Yours' : 'Studio routine'}</small></div>
                <button type="button" className="profile-routine-practice" onClick={() => {
                  setActiveRoutineId(r.id);
                  navigate('/player');
                }}>Practice</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
