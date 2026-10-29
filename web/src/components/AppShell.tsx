import { NavLink, Outlet } from 'react-router-dom';
import { PixelIcon, type NavRoute } from './PixelIcon';
import { useApp } from '../context/AppContext';
import './AppShell.css';

const NAV: { to: string; route: NavRoute; label: string }[] = [
  { to: '/', route: 'home', label: 'Home' },
  { to: '/explore', route: 'explore', label: 'Explore' },
  { to: '/create', route: 'create', label: 'Create' },
  { to: '/practice', route: 'practice', label: 'Practice' },
  { to: '/profile', route: 'profile', label: 'Profile' },
];

export function AppShell() {
  const { toast } = useApp();

  return (
    <div className="app-root">
      <a className="skip-link" href="#main-viewport">
        Skip to content
      </a>
      <header className="site-header">
        <h1>Little Jazz Room</h1>
        <p>Light music-first practice · local Phase 1 prototype</p>
      </header>
      <main className="phone-frame">
        <div className="phone-status" aria-hidden>
          <span>9:41</span>
          <span>◼︎ ▮ ▰</span>
        </div>
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
      {toast ? (
        <div className="toast-message" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
