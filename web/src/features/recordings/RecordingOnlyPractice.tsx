import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VISUAL_ASSETS } from '../../assets/visualManifest';
import { useApp } from '../../context/AppContext';
import { formatPracticeTime } from '../../pages/practicePlayerLogic';
import type { RecordedBackingTrack } from './recordingCatalog';

/** A recording without a verified chart. Never substitute an unrelated seed chart. */
export function RecordingOnlyPractice({ recording }: { recording: RecordedBackingTrack }) {
  const navigate = useNavigate();
  const { addSession } = useApp();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clockRef = useRef({ accumulatedMs: 0, startedAtMs: null as number | null });
  const saveRef = useRef<Promise<boolean> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [panel, setPanel] = useState<'chart' | 'player'>('chart');
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<{ id: string; durationSeconds: number; finishedAt: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentElapsed = () => {
    const { accumulatedMs, startedAtMs } = clockRef.current;
    return accumulatedMs + (startedAtMs === null ? 0 : Math.max(0, performance.now() - startedAtMs));
  };
  const pauseClock = () => {
    if (clockRef.current.startedAtMs === null) return;
    clockRef.current.accumulatedMs = currentElapsed();
    clockRef.current.startedAtMs = null;
    setElapsedSeconds(Math.floor(clockRef.current.accumulatedMs / 1000));
  };
  useEffect(() => {
    const timer = window.setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) setPosition(audio.currentTime);
      setElapsedSeconds(Math.floor(currentElapsed() / 1000));
    }, 100);
    return () => {
      window.clearInterval(timer);
      audioRef.current?.pause();
    };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setError(null);
      void audio.play().catch(() => setError('Playback was blocked or the file is unavailable. Try again.'));
    } else audio.pause();
  };
  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    const maximum = Number.isFinite(audio.duration) ? audio.duration : duration;
    const next = Math.max(0, Math.min(maximum > 0 ? maximum : 0, seconds));
    audio.currentTime = next;
    setPosition(next);
    setEnded(false);
  };
  const finish = () => {
    if (completion) return;
    audioRef.current?.pause();
    pauseClock();
    setPlaying(false);
    setCompletion({
      id: crypto.randomUUID(),
      durationSeconds: Math.floor(currentElapsed() / 1000),
      finishedAt: new Date().toISOString(),
    });
  };
  const save = (): Promise<boolean> => {
    if (!completion) return Promise.resolve(false);
    if (saveRef.current) return saveRef.current;
    setSaveState('saving');
    const task = (async () => {
      try {
        await addSession({
          id: completion.id, finishedAt: completion.finishedAt,
          durationSeconds: completion.durationSeconds,
        });
        setSaveState('saved');
        return true;
      } catch {
        setSaveState('idle');
        setError('Could not save the session. Please try again.');
        saveRef.current = null;
        return false;
      }
    })();
    saveRef.current = task;
    return task;
  };

  if (completion) {
    return <section className="practice-complete" aria-label="Practice session complete">
      <div className="practice-complete-hero">
        <h1>Great practice!</h1>
        <p className="practice-complete-time">{formatPracticeTime(completion.durationSeconds, true)}</p>
      </div>
      <div className="practice-complete-summary">
        <img src={VISUAL_ASSETS.room.approved.twilight} alt="" />
        <div><strong>{recording.title}</strong><span>Audio-only practice</span><small>Recorded backing track</small></div>
      </div>
      <button type="button" className="practice-primary practice-save" disabled={saveState !== 'idle'}
        onClick={() => void save()}>
        {saveState === 'saved' ? 'Session Saved ✓' : saveState === 'saving' ? 'Saving…' : 'Save Session'}
      </button>
      {error && <p role="alert" className="practice-recording-error">{error}</p>}
      <button type="button" className="practice-secondary" onClick={() => void (async () => {
        if (await save()) navigate('/progress');
      })()}>View Progress</button>
      <button type="button" className="practice-secondary" onClick={() => navigate('/tracks')}>Back to Tracks</button>
    </section>;
  }

  return <section className="practice-player practice-free" aria-label="Shared practice player">
    <header className="practice-player-head">
      <button type="button" className="practice-back" onClick={() => navigate('/tracks')} aria-label="Back to Tracks">‹</button>
      <div className="practice-title-group">
        <span className="practice-overline">Free Practice</span>
        <h1>{recording.title}</h1>
        <p>Recorded backing track · Original tempo and key</p>
      </div>
      <button className="practice-more" type="button" onClick={finish} aria-label="Finish session">⋮</button>
    </header>
    <audio ref={audioRef} src={recording.src} preload="metadata"
      aria-label={recording.title + ' backing track'}
      onLoadedMetadata={event => setDuration(event.currentTarget.duration)}
      onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
      onSeeked={event => setPosition(event.currentTarget.currentTime)}
      onPlay={() => {
        setPlaying(true);
        setEnded(false);
        setError(null);
        if (clockRef.current.startedAtMs === null) clockRef.current.startedAtMs = performance.now();
      }}
      onPause={() => { pauseClock(); setPlaying(false); }}
      onEnded={() => { pauseClock(); setPlaying(false); setEnded(true); }}
      onError={() => setError('Audio unavailable. Check that the M4A file is installed and playable.')} />
    <p className="practice-audio-state" data-testid="chart-playhead">
      <strong>Recorded Track</strong> · {formatPracticeTime(position, true)} / {formatPracticeTime(duration, true)}
    </p>
    <div className="practice-segments" role="tablist" aria-label="Player view">
      <button type="button" role="tab" aria-selected={panel === 'chart'} onClick={() => setPanel('chart')}
        className={panel === 'chart' ? 'selected' : undefined}>Chart</button>
      <button type="button" role="tab" aria-selected={panel === 'player'} onClick={() => setPanel('player')}
        className={panel === 'player' ? 'selected' : undefined}>Player</button>
    </div>
    {panel === 'chart' ? (
      <div className="practice-notation-panel" role="tabpanel" aria-label="Jazz chord chart">
        <div className="practice-unlinked-chart" role="status">
          <strong>No chart linked</strong>
          <p>This recording has no verified matching chart or beat alignment. You can still practice with its audio.</p>
        </div>
      </div>
    ) : (
      <div className="practice-art-panel" role="tabpanel" aria-label="Recorded backing track player">
        <img src={VISUAL_ASSETS.sharedMvp.covers.rainy} alt="Cozy rainy-night jazz practice room" />
        <div className="practice-art-caption"><strong>{recording.title}</strong><span>Backing track · No video</span></div>
        <div className="practice-no-audio practice-recorded-controls">
          <strong>Recorded Backing Track</strong>
          <p>{playing ? 'Playing' : ended ? 'Recording finished' : 'Paused'} · Original pitch and speed</p>
          <label htmlFor="audio-only-scrubber">Recording position</label>
          <input id="audio-only-scrubber" type="range" min="0" max={duration > 0 ? duration : 1}
            step="0.05" value={Math.min(position, duration > 0 ? duration : 1)}
            disabled={duration <= 0} aria-label="Seek recording"
            onChange={event => seek(Number(event.target.value))} />
          <button type="button" onClick={() => seek(0)}>Restart recording</button>
        </div>
      </div>
    )}
    {error && <p role="alert" className="practice-recording-error">{error}</p>}
    {ended && <p role="status" className="practice-reference-note">Recording finished. Restart to play it again.</p>}
    <div className="practice-transport">
      <div className="practice-clock">
        <strong data-testid="session-elapsed">{formatPracticeTime(elapsedSeconds)}</strong>
        <span>Practice time · {playing ? 'Playing recording' : elapsedSeconds ? 'Paused' : 'Ready'}</span>
      </div>
      <div className="practice-control-row">
        <button type="button" className="practice-secondary-transport" onClick={() => seek(0)}
          aria-label="Restart recording">↺</button>
        <button type="button" className="practice-timer-button" onClick={toggleAudio}
          aria-label={playing ? 'Pause recording and practice timer' : 'Play recording and start practice timer'}>
          {playing ? 'Ⅱ' : '▶'}<span className="practice-timer-label">{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button type="button" className="practice-secondary-transport" onClick={() => setPanel(current => current === 'chart' ? 'player' : 'chart')}
          aria-label="Toggle Chart or Player view">☷</button>
      </div>
      <p className="practice-reference-note">No chart linked. Audio playback uses the original recording; no chart or tempo is guessed.</p>
      <button type="button" className="practice-finish-action" onClick={finish}>Finish Session</button>
    </div>
  </section>;
}
