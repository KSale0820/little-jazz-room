import { formatPracticeTime } from '../pages/practicePlayerLogic';

export function SkipTenIcon({ forward = false }: { forward?: boolean }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="practice-skip-icon">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform={forward ? 'translate(32 0) scale(-1 1)' : undefined}>
      <path d="M7 9a11 11 0 1 1-2 12M7 3v6h6" />
    </g>
    <text x="16" y="21" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">10</text>
  </svg>;
}
export function RepeatIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="practice-tool-glyph" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14v-3a3 3 0 0 1 3-3h17m-4-4 4 4-4 4M26 18v3a3 3 0 0 1-3 3H6m4-4-4 4 4 4" />
  </svg>;
}
/** Two geometric bars: unlike a font glyph, there are no serifs on iOS. */
export function PauseIcon({ size = 15 }: { size?: number }) {
  return <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="currentColor">
    <rect x="3" y="2" width="3" height="12" rx=".3" />
    <rect x="10" y="2" width="3" height="12" rx=".3" />
  </svg>;
}
/** Session time stays visible; the small button pauses/resumes only this timer. */
export function PracticeTimeBadge({ seconds, running, onTogglePause }: {
  seconds: number; running: boolean; onTogglePause?: () => void;
}) {
  return <div className="practice-time-badge">
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="16" cy="16" r="11"/><path d="M16 9v7l5 3"/>
    </svg>
    <span className="practice-time-caption">Time practiced</span>
    {onTogglePause && <button type="button" className="practice-time-toggle" onClick={onTogglePause}
      aria-label={running ? 'Pause practice timer' : 'Resume practice timer'} title={running ? 'Pause practice time' : 'Resume practice time'}>
      {running ? <PauseIcon size={13} /> : <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M4 2.5 13 8l-9 5.5Z" /></svg>}
    </button>}
    <strong data-testid="session-elapsed">{formatPracticeTime(seconds)}</strong>
    {!running && seconds > 0 && <span className="practice-time-paused">Paused</span>}
  </div>;
}
