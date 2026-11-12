import { formatPracticeTime } from '../pages/practicePlayerLogic';

/**
 * One compact, shared footer for every Free Practice state.
 * Playback transport is intentionally separate from the session clock.
 */
export function FreePracticeSessionBar({
  seconds, running, onToggleTimer, onPrevious, onNext, canPrevious, canNext, onFinish, onJournal,
}: {
  seconds: number;
  running: boolean;
  onToggleTimer: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  onFinish: () => void;
  onJournal: () => void;
}) {
  const timerAction = running ? 'Pause practice timer' : seconds > 0 ? 'Resume practice timer' : 'Start practice timer';

  return (
    <div className="fp-session-footer" role="group" aria-label="Free Practice session controls">
      <div className="fp-session-clock" aria-label={'Time practiced ' + formatPracticeTime(seconds)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 6.5v5.8l3.5 2.1" />
        </svg>
        <span data-testid="session-elapsed">{formatPracticeTime(seconds)}</span>
      </div>
      <button className="fp-session-icon fp-session-toggle" type="button" onClick={onToggleTimer}
        aria-label={timerAction} title={timerAction}>
        {running
          ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" /></svg>
          : <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7.5 4.5 19 12 7.5 19.5z" /></svg>}
      </button>
      <button className="fp-session-icon" type="button" onClick={onPrevious}
        disabled={!canPrevious} aria-label="Previous practice item" title="Previous practice item">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 5-7 7 7 7" /></svg>
      </button>
      <button className="fp-session-icon" type="button" onClick={onNext}
        disabled={!canNext} aria-label="Next practice item" title="Next practice item">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m9.5 5 7 7-7 7" /></svg>
      </button>
      <button className="fp-session-finish" type="button" onClick={onFinish} aria-label="Finish Session">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12 5 5 10-10" /></svg>
        <span>Finish Session</span>
      </button>
      <button className="fp-session-icon fp-session-journal" type="button" onClick={onJournal}
        aria-label="Open session journal" title="Session journal">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="15" height="18" rx="2" />
          <path d="M8 3v18M10.5 8h6M10.5 12h6M10.5 16h4" />
        </svg>
      </button>
    </div>
  );
}
