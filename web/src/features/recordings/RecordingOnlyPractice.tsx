import { GreatPracticeCompletion } from '../../components/GreatPracticeCompletion';
import { PracticeTimeBadge, SkipTenIcon, RepeatIcon } from '../../components/PracticeMediaControls';
import { TunerPage } from '../../pages/TunerPage';
import { PracticeMetronomeSheet } from '../../components/PracticeMetronomeSheet';
import { usePracticeMetronome } from '../../lib/usePracticeMetronome';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { VISUAL_ASSETS } from '../../assets/visualManifest';
import { useApp } from '../../context/AppContext';
import { formatPracticeTime } from '../../pages/practicePlayerLogic';
import type { RecordedBackingTrack } from './recordingCatalog';


type RecordingToolIconName = 'mixer' | 'tempo' | 'loop' | 'tuner' | 'metronome';
function RecordingToolIcon({ kind }: { kind: RecordingToolIconName }) {
  const icons: Record<RecordingToolIconName, React.ReactNode> = {
    mixer: <><path d="M8 3v26M16 3v26M24 3v26"/><rect x="5.3" y="11" width="5.4" height="7" rx="2.6"/><rect x="13.3" y="17" width="5.4" height="7" rx="2.6"/><rect x="21.3" y="8" width="5.4" height="7" rx="2.6"/></>,
    tempo: <><circle cx="16" cy="18" r="11"/><path d="M16 7V3M12 3h8M16 18V10M16 18l4.6 5.4M23.8 8.8l2.3-2.3"/></>,
    loop: <><path d="M23.8 9.6A10.6 10.6 0 0 0 7 9L5 12.5"/><path d="M5.2 6.5 5 12.6l6-.3M8.2 22.4A10.6 10.6 0 0 0 25 23l2-3.5"/><path d="M26.8 25.5 27 19.4l-6 .3"/></>,
    tuner: <path d="M10 5v12a6 6 0 0 0 12 0V5M16 23v6M12.5 29h7"/>,
    metronome: <><path d="M7 27 12.7 7h6L25 27Z M5 27h22"/><path d="m16.4 21 7.2-15"/><circle cx="16.4" cy="21" r="1.3" fill="currentColor" stroke="none"/></>,
  };
  return <svg className="practice-tool-glyph" viewBox="0 0 32 32" aria-hidden="true" fill="none"
    stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">{icons[kind]}</svg>;
}

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
  // Same audio engine as Practice Hub, Free Practice and the chart player.
  // Keep it mounted while the metronome sheet is closed.
  const metronome = usePracticeMetronome();
  const [tool, setTool] = useState<'tuner' | 'metronome' | null>(null);
  const [repeatRecording, setRepeatRecording] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<{ id: string; durationSeconds: number; finishedAt: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // An unlinked recording has no verified bar-one timestamp, so the click
    // track stays independent but can use its known source tempo by default.
    if (recording.recordedBpm) metronome.changeBpm(recording.recordedBpm);
  }, [recording.id, recording.recordedBpm, metronome.changeBpm]);

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
    metronome.stop();
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
        setSaveState('error');
        setError('Could not save the session. Please try again.');
        saveRef.current = null;
        return false;
      }
    })();
    saveRef.current = task;
    return task;
  };

  // The recording-only flow also saves once on Finish, not on Done.
  useEffect(() => { if (completion) void save(); }, [completion?.id]);

  const restart = () => {
    if (saveState !== 'saved') return;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    clockRef.current = { accumulatedMs: 0, startedAtMs: null };
    setElapsedSeconds(0);
    setPosition(0);
    setEnded(false);
    setPlaying(false);
    setCompletion(null);
    setSaveState('idle');
    saveRef.current = null;
    setError(null);
  };

  if (completion) return <GreatPracticeCompletion key={completion.id}
    record={completion}
    title={recording.title}
    subtitle="Audio-only practice · Recorded backing track"
    summaryArt={VISUAL_ASSETS.room.approved.twilight}
    activities={[{
      id: recording.id, title: recording.title,
      detail: recording.key + (recording.recordedBpm ? ' · ' + recording.recordedBpm + ' BPM' : ''),
      status: 'practiced',
    }]}
    status={saveState}
    onRetry={() => void save()}
    onDone={() => navigate('/practice')}
    onPracticeAgain={restart} />;

  return <section className="practice-player practice-free practice-recording-p02 practice-unified" aria-label="Shared practice player">
    <header className="practice-player-head">
      <button type="button" className="practice-back" onClick={() => navigate('/tracks')} aria-label="Back to Tracks">‹</button>
      <div className="practice-title-group">
        <span className="practice-overline">FREE PRACTICE</span>
        <h1>{recording.title}</h1>
        <p>Backing Track · {recording.style || 'Jazz'}</p>
      </div>
    </header>
    <audio ref={audioRef} src={recording.src} preload="metadata" loop={repeatRecording}
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
      onError={() => setError('Audio unavailable. Check that the recording is installed and playable.')} />
    <div className="practice-unlinked-chart" role="status"><strong>No chart linked</strong>
      <p>There isn't a verified chord chart for this recording yet. Practice with the recording below.</p></div>
    {error && <p role="alert" className="practice-recording-error">{error}</p>}
    <div className="practice-transport" aria-label={"Practice elapsed " + formatPracticeTime(elapsedSeconds)}>
      <div className="practice-recording-seek">
        <input id="audio-only-scrubber" type="range" min="0" max={duration > 0 ? duration : 1}
          step="0.05" value={Math.min(position, duration > 0 ? duration : 1)}
          disabled={duration <= 0} aria-label="Seek recording"
          onChange={event => seek(Number(event.target.value))}
          style={{ '--recording-progress': (duration > 0 ? Math.min(100, 100 * position / duration) : 0) + '%' } as React.CSSProperties} />
        <div className="practice-recording-times">
          <span>{formatPracticeTime(Math.floor(position))} / {formatPracticeTime(Math.floor(duration))}</span>
        </div>
      </div>
      <div className="practice-control-row">

        <button type="button" className="practice-measure-btn" onClick={() => seek((audioRef.current?.currentTime ?? 0) - 10)}
          aria-label="Back 10 seconds"><SkipTenIcon /></button>
        <button type="button" className="practice-timer-button" onClick={toggleAudio}
          aria-label={playing ? 'Pause recording' : 'Play recording'}>
          {playing ? 'Ⅱ' : '▶'}<span className="practice-timer-label">{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button type="button" className="practice-measure-btn" onClick={() => seek((audioRef.current?.currentTime ?? 0) + 10)}
          aria-label="Forward 10 seconds"><SkipTenIcon forward /></button>

        <button className="practice-secondary-transport" type="button"
          onClick={() => setRepeatRecording(value => !value)}
          aria-label="Repeat recording" aria-pressed={repeatRecording}>
          <RepeatIcon />
        </button>
      </div>
      <div className="practice-chart-controls practice-player-pills">
        <label>Key · original<input value={recording.key || 'Unspecified'} readOnly aria-label="Original recording key" /></label>
        <label>BPM · original<input value={recording.recordedBpm ?? 'Unspecified'} readOnly aria-label="Original recording BPM" /></label>
        <label>Instrument<input value="No chart" disabled aria-label="Written pitch unavailable without a chart" /></label>
      </div>
      <p className="practice-reference-note">Original recording · {recording.key} · {recording.recordedBpm ? recording.recordedBpm + ' BPM' : 'Tempo unspecified'}. Pitch and speed are fixed.</p>
      <div className="practice-session-row"><button type="button" className="practice-finish-action" onClick={finish}>Finish Session</button><PracticeTimeBadge seconds={elapsedSeconds} running={playing} /></div>
    </div>
    <div className="practice-utility-row practice-recording-tools" aria-label="Practice tools">
      <button type="button" disabled title="Stem mixer requires separate stem recordings"><RecordingToolIcon kind="mixer" /><span>Mixer</span><small>Preview</small></button>
      <button type="button" onClick={() => setTool('tuner')}><RecordingToolIcon kind="tuner" /><span>Tuner</span></button>
      <button type="button" onClick={() => setTool('metronome')}><RecordingToolIcon kind="metronome" /><span>Metronome</span></button>
    </div>
    {tool === 'tuner' && <div className="practice-tool-overlay" role="dialog" aria-modal="true"
      aria-label="Tuner within practice" onKeyDown={event => { if (event.key === 'Escape') setTool(null); }}>
      <TunerPage onClose={() => setTool(null)} />
    </div>}
    {tool === 'metronome' && createPortal(
      <PracticeMetronomeSheet controller={metronome} onClose={() => setTool(null)} />,
      document.body
    )}
    {ended && <p role="status" className="practice-recording-ended">Recording finished · Restart by moving the playhead to the beginning.</p>}
  </section>;
}
