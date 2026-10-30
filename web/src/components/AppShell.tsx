import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { PixelIcon, type NavRoute } from './PixelIcon';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './AppShell.css';

const NAV: { to: string; route: NavRoute; label: string }[] = [
  { to: '/', route: 'home', label: 'Home' },
  { to: '/explore', route: 'explore', label: 'Explore' },
  { to: '/create', route: 'create', label: 'Create' },
  { to: '/practice', route: 'practice', label: 'Practice' },
  { to: '/profile', route: 'profile', label: 'Profile' },
];

export function AppShell() {
  const { toast, showToast } = useApp();
  const { configured, user, signOut, authError } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const result = await signOut();
    if (result.error) showToast(`Could not sign out: ${result.error}`);
    setSigningOut(false);
  };
  const message = toast ?? authError;

  return (
    <div className="app-root">
      <a className="skip-link" href="#main-viewport">
        Skip to content
      </a>
      <aside className="app-sidebar" aria-label="Main navigation">
        <div className="app-brand">
          <strong>Little Jazz Room</strong>
          <span>Practice · Companion · A brighter you</span>
        </div>
        {configured ? (
          <div className="team-auth-panel">
            {user ? (
              <>
                <small className="team-auth-label">Signed in</small>
                <button type="button" className="btn tiny wide" disabled={signingOut} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <NavLink className="btn tiny wide" to="/signin">
                Team sign-in
              </NavLink>
            )}
          </div>
        ) : null}
        <nav className="sidebar-nav">
          {NAV.map(({ to, route, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'current' : undefined)}>
              <PixelIcon route={route} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <main className="app-shell">
          <div className="phone-status" aria-hidden>
            <span>9:41</span>
            <span>◼︎ ▮ ▰</span>
          </div>
          {configured ? (
            <div className="mobile-auth-bar">
              {user ? (
                <button type="button" className="btn tiny" disabled={signingOut} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              ) : (
                <NavLink className="btn tiny" to="/signin">
                  Sign in
                </NavLink>
              )}
            </div>
          ) : null}
          <div className="viewport" id="main-viewport">
            <Outlet />
          </div>
          <nav className="bottom-nav" aria-label="Main navigation">
            {NAV.map(({ to, route, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'current' : undefined)}>
                <PixelIcon route={route} />
                {label}
              </NavLink>
            ))}
          </nav>
        </main>
      </div>
      {message ? (
        <div className="toast-message" role="status">
          {message}
        </div>
      ) : null}
    </div>
  );
}
