import { useState } from 'react';
import { formatPracticeTime } from '../pages/practicePlayerLogic';

export function SkipTenIcon({ forward = false }: { forward?: boolean }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="practice-skip-icon">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform={forward ? 'translate(32 0) scale(-1 1)' : undefined}>
      <path d="M8 8a11 11 0 1 1-3 11M8 3v6H2" />
    </g>
    <text x="16" y="21" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">10</text>
  </svg>;
}
export function RepeatIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="practice-tool-glyph" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14v-3a3 3 0 0 1 3-3h17m-4-4 4 4-4 4M26 18v3a3 3 0 0 1-3 3H6m4-4-4 4 4 4" />
  </svg>;
}
/** Visibility is presentation only: the parent session clock always keeps running. */
export function PracticeTimeBadge({ seconds, running }: { seconds: number; running: boolean }) {
  const [hidden, setHidden] = useState(false);
  return <button type="button" className="practice-time-badge" aria-expanded={!hidden}
    aria-label={hidden ? 'Show practice time' : 'Hide practice time'} onClick={() => setHidden(value => !value)}>
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 12C18 4 26 4 29 3c0 7-3 11-8 11M20 13l5-5" />
      <circle cx="12" cy="20" r="8"/><path d="M12 15v5l3 2"/>
    </svg>
    {!hidden && <span>Time practiced · <strong data-testid="session-elapsed">{formatPracticeTime(seconds)}</strong>{!running && seconds > 0 ? ' · Paused' : ''}</span>}
  </button>;
}
