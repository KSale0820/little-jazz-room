import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { CatSprite, COMPANION_UNLOCK_MINUTES, JAZZ_CATS, isVisibleCatId } from '../features/cats/CatCompanion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cumulativePracticeMinutes, readPreviouslySelectedCat, readSavedUnlocks, saveUnlockedCompanions, unlockedCompanions } from '../lib/companionUnlocks';
import './ProfilePage.css';

/** One profile/settings surface. /profile and /settings both reach this screen. */
export function ProfilePage() {
  const { catId, chooseCat, catSaveError, catMotion, sessions, showToast } = useApp();
  const { configured, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLElement>(null);
  const [signingOut, setSigningOut] = useState(false);

  const accountKey = user?.id ?? 'local';
  const practiceMinutes = cumulativePracticeMinutes(sessions);
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

  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const selectedCat = JAZZ_CATS.find(cat => cat.id === catId) ?? JAZZ_CATS[0];
  const displayNameSource: unknown = user?.user_metadata?.display_name ??
    user?.user_metadata?.full_name ?? user?.user_metadata?.name;
  const displayName = typeof displayNameSource === 'string' && displayNameSource.trim()
    ? displayNameSource.trim() : (user?.email?.split('@')[0] || 'Jazz learner');

  const onSelectCompanion = async (id: typeof JAZZ_CATS[number]['id']) => {
    if (!isVisibleCatId(id) || !unlockedIds.includes(id)) return;
    await chooseCat(id);
    showToast(`${JAZZ_CATS.find(cat => cat.id === id)!.name} is now your companion.`);
  };

  const onSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const result = await signOut();
      if (result.error) showToast(`Could not sign out: ${result.error}`);
      else navigate('/practice');
    } catch {
      showToast('Could not sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <section className="page profile-page" aria-label="Profile Settings">
      <header className="profile-top">
        <div className="profile-brand-row">
          <img className="profile-ornament profile-ornament-left" src={VISUAL_ASSETS.approvedPixelMotifs.hangingPlant} alt="" aria-hidden="true" />
          <img className="profile-brand" src={VISUAL_ASSETS.brand.wordmark} alt="Little Jazz Room" />
          <img className="profile-ornament profile-ornament-right" src={VISUAL_ASSETS.approvedPixelMotifs.planterBox} alt="" aria-hidden="true" />
        </div>
        <h1 className="profile-title">Profile Settings</h1>
        <p className="profile-subtitle">Manage your profile, companion, and account.</p>
      </header>

      <section className="profile-identity" aria-label="Your profile">
        <div className="profile-companion-art">
          <CatSprite catId={catId} size={76} animated={catMotion} variant="portrait" />
        </div>
        <div className="profile-identity-copy">
          <strong>{displayName}</strong>
          <span>{user ? 'Jazz learner' : 'Local jazz learner'}</span>
        </div>
        <a className="profile-edit-link" href="#profile-account-heading">Account details <span aria-hidden="true">›</span></a>
      </section>

      <section className="profile-companions profile-section" ref={chooserRef} aria-labelledby="choose-cat-heading">
        <div className="profile-section-title">
          <span className="profile-section-symbol" aria-hidden="true">♫</span>
          <div>
            <h2 id="choose-cat-heading">Your Companion</h2>
            <p>Choose your jazz-cat companion.</p>
          </div>
        </div>
        <div className="jazz-cat-grid profile-cat-grid" role="group" aria-label="Jazz cat companions">
          {JAZZ_CATS.map(cat => {
            const needed = COMPANION_UNLOCK_MINUTES[cat.id];
            const unlocked = unlockedIds.includes(cat.id) || catId === cat.id;
            const selected = catId === cat.id;
            const progress = needed === 0 || unlocked ? 100 : Math.min(100, 100 * practiceMinutes / needed);
            return (
              <button
                type="button"
                className="board-cat-card profile-cat-card"
                key={cat.id}
                disabled={!unlocked}
                aria-pressed={selected}
                aria-label={`${cat.name}, ${selected ? 'selected' : unlocked ? 'unlocked' : `locked, ${Math.max(0, needed - practiceMinutes)} more minutes of practice to unlock`}`}
                onClick={() => { void onSelectCompanion(cat.id); }}
              >
                <span className="profile-cat-status" aria-hidden="true">{selected ? '✓' : !unlocked ? '🔒' : '✓'}</span>
                <span className="profile-cat-visual">
                  <CatSprite catId={cat.id} size={86} variant={cat.id === 'luna' ? 'sleeping' : 'portrait'} decorative />
                </span>
                <span className="board-cat-meta profile-cat-meta">
                  <strong>{cat.name}</strong>
                  {selected ? <span className="profile-selected-pill">Selected</span> :
                    unlocked ? <span className="profile-unlocked-pill">Unlocked</span> :
                      <span className="profile-cat-requirement">{needed} min to unlock</span>}
                  {needed > 0 ? (
                    <>
                      <span className="profile-cat-progress" role="progressbar" aria-label={`${cat.name} unlock progress`}
                        aria-valuemin={0} aria-valuemax={needed} aria-valuenow={unlocked ? needed : Math.min(practiceMinutes, needed)}>
                        <span style={{ width: `${progress}%` }} />
                      </span>
                      <span className="profile-cat-minutes">{unlocked ? 'Unlocked' : `${practiceMinutes} / ${needed} min`}</span>
                    </>
                  ) : <span className="profile-cat-always">Always available</span>}
                </span>
              </button>
            );
          })}
        </div>
        {catSaveError ? <p role="status" className="profile-save-error">{catSaveError}</p> : null}
        <div className="profile-unlock-hint">
          <span className="profile-hint-clock" aria-hidden="true">◷</span>
          <span><strong>Practice more to unlock new companions!</strong><small>Milo at 60 min · Maple at 300 min</small></span>
          <img src={VISUAL_ASSETS.approvedPixelMotifs.smallPlant} alt="" aria-hidden="true" />
        </div>
      </section>

      <section className="profile-account profile-section" aria-labelledby="profile-account-heading">
        <div className="profile-section-title profile-account-title">
          <span className="profile-section-symbol" aria-hidden="true">♙</span>
          <h2 id="profile-account-heading">Account &amp; More</h2>
        </div>
        <div className="profile-account-list">
          {user && <div className="profile-account-detail">
            <span className="profile-account-detail-label">Signed in as</span>
            <strong>{user.email}</strong>
          </div>}
          <Link className="profile-account-row" to="/progress">
            <span className="profile-account-row-icon" aria-hidden="true">◷</span>
            <span><strong>Practice History</strong><small>View your saved practice and milestones.</small></span>
            <span className="profile-row-chevron" aria-hidden="true">›</span>
          </Link>
          <Link className="profile-account-row" to="/routines">
            <span className="profile-account-row-icon" aria-hidden="true">♫</span>
            <span><strong>Your Routines</strong><small>Browse and manage practice routines.</small></span>
            <span className="profile-row-chevron" aria-hidden="true">›</span>
          </Link>
          {configured && (user
            ? <button className="profile-account-row" type="button" disabled={signingOut} onClick={() => void onSignOut()}>
                <span className="profile-account-row-icon" aria-hidden="true">⇥</span>
                <span><strong>{signingOut ? 'Signing out…' : 'Sign Out'}</strong><small>Sign out of your Little Jazz Room account.</small></span>
                <span className="profile-row-chevron" aria-hidden="true">›</span>
              </button>
            : <Link className="profile-account-row" to="/signin">
                <span className="profile-account-row-icon" aria-hidden="true">⇥</span>
                <span><strong>Team Sign In</strong><small>Connect your existing Little Jazz Room account.</small></span>
                <span className="profile-row-chevron" aria-hidden="true">›</span>
              </Link>)}
          {!configured && <p className="profile-account-local">Practice is saved on this device. Account sign-in is not configured in this build.</p>}
        </div>
      </section>
    </section>
  );
}
