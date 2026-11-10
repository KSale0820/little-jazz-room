import { useEffect, useState } from 'react';

type Theme = 'classic' | 'midnight' | 'blue-note';
const THEMES: { id: Theme; label: string; description: string }[] = [
  { id: 'classic', label: 'Cozy Classic', description: 'Existing ivory and evergreen' },
  { id: 'midnight', label: 'Midnight Jazz', description: 'Charcoal, sage, lilac' },
  { id: 'blue-note', label: 'Blue Note', description: 'Deep navy, paper, brass' },
];
const KEY = 'little-jazz-room:theme-review:v1';

export function ThemeReviewSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      return THEMES.some(option => option.id === stored) ? stored as Theme : 'classic';
    } catch { return 'classic'; }
  });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute('data-review-theme', theme);
    try { window.localStorage.setItem(KEY, theme); } catch { /* optional */ }
    return () => document.documentElement.removeAttribute('data-review-theme');
  }, [theme]);

  return <aside className="theme-review" aria-label="Team theme comparison">
    <button type="button" className="theme-review-toggle" onClick={() => setOpen(value => !value)}
      aria-expanded={open} aria-controls="theme-review-options">
      Compare themes {open ? '×' : '▾'}
    </button>
    {open && <div id="theme-review-options" className="theme-review-popover">
      <strong>Team theme preview</strong>
      <p>Same app and functionality. Choose an appearance.</p>
      <div className="theme-review-options">
        {THEMES.map(option => <button key={option.id} type="button" aria-pressed={theme === option.id}
          onClick={() => { setTheme(option.id); setOpen(false); }}>
          <span className={'theme-review-swatch theme-review-swatch-' + option.id} aria-hidden="true" />
          <span><b>{option.label}</b><small>{option.description}</small></span>
        </button>)}
      </div>
      <small className="theme-review-note">Review only. Not on the class-demo branch.</small>
    </div>}
  </aside>;
}
