import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { useAppearance } from '../context/AppearanceContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

export function SettingsPage() {
  const { theme, mode, setMode, catMode, setCatMode } = useAppearance();
  const { catMotion, setCatMotion, showToast } = useApp();
  const { configured, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) showToast(`Could not sign out: ${error}`);
      else navigate('/profile');
    } catch {
      showToast('Could not sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <section className="page settings-page" aria-label="Settings">
      <header className="settings-heading">
        <Link className="settings-back" to="/profile" aria-label="Back to profile"><span aria-hidden="true">‹</span></Link>
        <div>
          <img className="settings-brand" src={VISUAL_ASSETS.brand.wordmark} alt="Little Jazz Room" />
          <h1>Settings</h1>
          <p>Make your studio feel like yours.</p>
        </div>
      </header>

      <section className="settings-panel" aria-labelledby="settings-appearance-title">
        <div className="settings-panel-title">
          <span className="settings-panel-icon" aria-hidden="true">◐</span>
          <div>
            <h2 id="settings-appearance-title">Appearance</h2>
            <p>Choose a comfortable look for your sessions.</p>
          </div>
        </div>
        <div className="settings-group-label" id="settings-palette-label">Color theme</div>
        <div className="profile-theme-choices" role="group" aria-labelledby="settings-palette-label">
          <button type="button" className="profile-theme-choice" aria-pressed={theme === 'light'}
            onClick={() => setMode('light')}>
            <span className="settings-theme-preview settings-theme-preview-light" aria-hidden="true"><i /><i /><i /></span>
            <span className="settings-theme-copy"><strong>Light</strong><small>Sunny Studio</small></span>
            <span className="settings-selection-mark" aria-hidden="true">{theme === 'light' ? '✓' : ''}</span>
          </button>
          <button type="button" className="profile-theme-choice" aria-pressed={theme === 'dark'}
            onClick={() => setMode('dark')}>
            <span className="settings-theme-preview settings-theme-preview-dark" aria-hidden="true"><i /><i /><i /></span>
            <span className="settings-theme-copy"><strong>Dark</strong><small>Charcoal Studio</small></span>
            <span className="settings-selection-mark" aria-hidden="true">{theme === 'dark' ? '✓' : ''}</span>
          </button>
        </div>
        <p className="settings-caption">{mode === 'system'
          ? 'Following your device appearance until you make a selection.'
          : 'Your choice is saved on this device.'}</p>
      </section>

      <section className="settings-panel" aria-labelledby="settings-personal-title">
        <div className="settings-panel-title">
          <span className="settings-panel-icon" aria-hidden="true">♫</span>
          <div><h2 id="settings-personal-title">Companions</h2><p>A little personality, when you want it.</p></div>
        </div>
        <label className="settings-toggle-row">
          <span className="settings-toggle-copy">
            <strong>Cat Mode</strong>
            <small>Show optional decorative cats in the studio tools. Your selected companion, avatars and rewards stay visible.</small>
          </span>
          <input type="checkbox" role="switch" checked={catMode} onChange={event => setCatMode(event.target.checked)} />
          <span className="settings-switch" aria-hidden="true" />
        </label>
        <label className="settings-toggle-row">
          <span className="settings-toggle-copy">
            <strong>Gentle cat animation</strong>
            <small>Allow subtle companion motion. Your device's reduced-motion setting is always respected.</small>
          </span>
          <input type="checkbox" role="switch" checked={catMotion} onChange={event => setCatMotion(event.target.checked)} />
          <span className="settings-switch" aria-hidden="true" />
        </label>
        <Link className="settings-inline-link" to="/profile" state={{ scrollToCat: true }}>
          Change your companion <span aria-hidden="true">›</span>
        </Link>
      </section>

      <section className="settings-panel" aria-labelledby="settings-account-title">
        <div className="settings-panel-title">
          <span className="settings-panel-icon" aria-hidden="true">♙</span>
          <div><h2 id="settings-account-title">Account</h2><p>Your account and saved practice.</p></div>
        </div>
        <div className="settings-account-row">
          <span className="settings-account-avatar" aria-hidden="true">{user?.email?.charAt(0).toUpperCase() ?? '♪'}</span>
          <span className="settings-account-identity">
            <strong>{user?.email ?? 'Local practice profile'}</strong>
            <small>{user ? 'Signed in' : 'Practice saved on this device'}</small>
          </span>
        </div>
        {configured && (user
          ? <button type="button" className="settings-account-action" disabled={signingOut}
              onClick={() => void handleSignOut()}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
          : <Link className="settings-account-action" to="/signin">Team sign in</Link>)}
      </section>
      <p className="settings-footnote">Your appearance preferences do not change practice history or companion unlocks.</p>
    </section>
  );
}
