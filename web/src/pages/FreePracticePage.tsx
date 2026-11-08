import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChordGrid } from '../components/ChordGrid';
import { useApp } from '../context/AppContext';
import { useAppearance } from '../context/AppearanceContext';
import { DecorativeCat } from '../features/cats/DecorativeCat';
import { RECORDED_BACKING_TRACKS, isUsableRecordedTrack } from '../features/recordings/recordingCatalog';
import type { PracticeSessionRecord } from '../types/content';
import { formatPracticeTime } from './practicePlayerLogic';
import { MetronomePage } from './MetronomePage';
import { TunerPage } from './TunerPage';
import './FreePracticePage.css';

type Picker = 'exercise' | 'chart' | 'routine' | 'track' | null;
type QueueKind = 'technique' | 'exercise' | 'chart' | 'routine';
type PracticeTool = 'metronome' | 'tuner';
type QueueItem = { key: string; kind: QueueKind; sourceId: string; title: string; done: boolean };

const TECHNIQUES = ['Scales', 'Improvisation', 'Ear training', 'Rhythm', 'Articulation'];
const AVAILABLE_RECORDINGS = RECORDED_BACKING_TRACKS.filter(isUsableRecordedTrack);
const PIXEL_ART = '/visuals/new-assets/2026-11-07-sharp-pixel/';

/**
 * Free Practice is an independent, timer-first session. Selecting a chart,
 * exercise, routine, or recording never silently substitutes a random chart
 * or changes the session clock.
 */
export function FreePracticePage() {
  const navigate = useNavigate();
  const { addSession, showToast, exercises, charts, routines, catId } = useApp();
  const { catMode } = useAppearance();
  const clock = useRef({ accumulatedMs: 0, startedAt: null as number | null });
  const saveInFlight = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastToolTrigger = useRef<HTMLButtonElement | null>(null);
  const toolDialogRef = useRef<HTMLDivElement | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [picker, setPicker] = useState<Picker>(null);
  const [search, setSearch] = useState('');
  const [customTechnique, setCustomTechnique] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedMeasure, setSelectedMeasure] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState('');
  const [tool, setTool] = useState<PracticeTool | null>(null);
  const [finished, setFinished] = useState<PracticeSessionRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const elapsedMs = () => clock.current.accumulatedMs +
    (clock.current.startedAt === null ? 0 : Math.max(0, Date.now() - clock.current.startedAt));

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setSeconds(Math.floor(elapsedMs() / 1000)), 250);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!tool) return;
    const frame = requestAnimationFrame(() => toolDialogRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [tool]);

  // An in-page tool does not unmount this timer; navigation elsewhere is still
  // a deliberate departure. Playback stops when the page actually unmounts.
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const toggleClock = () => {
    if (finished) return;
    if (clock.current.startedAt !== null) {
      clock.current.accumulatedMs = elapsedMs();
      clock.current.startedAt = null;
      setRunning(false);
    } else {
      clock.current.startedAt = Date.now();
      setRunning(true);
    }
    setSeconds(Math.floor(elapsedMs() / 1000));
  };

  const openPicker = (next: Exclude<Picker, null>) => {
    setPicker(current => current === next ? null : next);
    setSearch('');
  };

  const addItem = (kind: QueueKind, sourceId: string, title: string) => {
    setQueue(current => [...current, { key: crypto.randomUUID(), kind, sourceId, title, done: false }]);
    setPicker(null);
    setSearch('');
    setCustomTechnique('');
  };

  const addTechnique = (value: string) => {
    const title = value.trim();
    if (title) addItem('technique', title, title);
  };

  const activeItem = queue.find(item => item.key === expandedKey);
  const activeChart = activeItem?.kind === 'chart' ? charts.find(chart => chart.id === activeItem.sourceId) : null;
  const activeExercise = activeItem?.kind === 'exercise' ? exercises.find(item => item.id === activeItem.sourceId) : null;
  const activeRoutine = activeItem?.kind === 'routine' ? routines.find(item => item.id === activeItem.sourceId) : null;
  const recording = AVAILABLE_RECORDINGS.find(item => item.id === recordingId) ?? null;
  const pickerOptions = picker === 'exercise' ? exercises.map(item => ({ id: item.id, title: item.title, description: item.description ?? item.category }))
    : picker === 'chart' ? charts.map(item => ({ id: item.id, title: item.title, description: item.concert_key + ' · ' + item.feel }))
    : picker === 'routine' ? routines.map(item => ({ id: item.id, title: item.title, description: item.duration_minutes + ' min' }))
    : picker === 'track' ? AVAILABLE_RECORDINGS.map(item => ({ id: item.id, title: item.title, description: item.subtitle }))
    : [];
  const visibleOptions = pickerOptions.filter(item => (item.title + ' ' + item.description).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const selectOption = (id: string, title: string) => {
    if (!picker) return;
    if (picker === 'track') {
      audioRef.current?.pause();
      setRecordingId(id);
      setAudioError('');
      setPicker(null);
    } else {
      addItem(picker, id, title);
    }
  };

  const saveSession = async (record: PracticeSessionRecord) => {
    if (saved || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await addSession(record);
      // Optional detail is local-only; the existing session schema remains intact.
      try {
        localStorage.setItem('little-jazz-room:practice-feedback:v1:' + record.id, JSON.stringify({
          items: queue.map(item => ({ kind: item.kind, title: item.title, completed: item.done })),
          recordingId,
        }));
      } catch { /* storage may be unavailable */ }
      setSaved(true);
      showToast('Practice session saved.');
    } catch {
      setSaveError(true);
      showToast('Could not save your session. Try again.');
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  const finishSession = () => {
    if (finished) return;
    const durationSeconds = Math.floor(elapsedMs() / 1000);
    if (durationSeconds === 0) {
      showToast('Start the practice timer first.');
      return;
    }
    clock.current.accumulatedMs = durationSeconds * 1000;
    clock.current.startedAt = null;
    setSeconds(durationSeconds);
    setRunning(false);
    audioRef.current?.pause();
    const record: PracticeSessionRecord = {
      id: crypto.randomUUID(),
      finishedAt: new Date().toISOString(),
      durationSeconds,
    };
    setFinished(record);
    void saveSession(record);
  };

  const reset = () => {
    clock.current = { accumulatedMs: 0, startedAt: null };
    setSeconds(0);
    setRunning(false);
    setQueue(current => current.map(item => ({ ...item, done: false })));
    setPicker(null);
    setExpandedKey(null);
    setFinished(null);
    setSaved(false);
    setSaveError(false);
    audioRef.current?.pause();
  };

  const openTool = (which: PracticeTool, trigger: HTMLButtonElement) => {
    lastToolTrigger.current = trigger;
    setTool(which);
  };
  const closeTool = () => {
    setTool(null);
    requestAnimationFrame(() => lastToolTrigger.current?.focus());
  };

  if (finished) {
    return <section className="fp-page fp-completed" aria-label="Free Practice complete">
      <header className="fp-top fp-complete-header">
        <button type="button" className="fp-back" onClick={() => navigate('/practice')}><span aria-hidden="true">‹</span> Practice</button>
        <span className="fp-kicker">FREE PRACTICE</span><h1>Nice work today.</h1>
        <p>A little more music in your day.</p>
      </header>
      <div className="fp-completion-card" role="status">
        <img src={PIXEL_ART + 'practice-player/png/finish-check.png'} alt="" aria-hidden="true" />
        <h2>{saved ? 'Session Saved' : saveError ? 'Could not save' : 'Saving your session…'}</h2>
        <strong className="fp-time">{formatPracticeTime(finished.durationSeconds)}</strong>
        <p>{saved ? 'Your practice has been added to Progress.' : saveError ? 'Your practice is still here. Retry saving below.' : 'Keeping your progress up to date.'}</p>
      </div>
      {saveError && <button type="button" className="fp-primary" disabled={saving} onClick={() => void saveSession(finished)}>Retry Save</button>}
      {saved && <div className="fp-completion-actions">
        <button type="button" className="fp-primary" onClick={() => navigate('/progress')}>View Progress</button>
        <button type="button" className="fp-secondary" onClick={reset}>Practice Again</button>
      </div>}
    </section>;
  }

  return <>
    <section className="fp-page" aria-label="Free Practice">
      <header className="fp-top">
        <button type="button" className="fp-back" onClick={() => navigate('/practice')} aria-label="Back to Practice"><span aria-hidden="true">‹</span> Practice</button>
        <span className="fp-kicker">YOUR PRACTICE STUDIO</span>
        <h1>Free Practice</h1>
        <p>Play what you love, at your own pace.</p>
        {catMode && <DecorativeCat catId={catId} variant="sleeping" size={58} className="fp-header-cat" />}
      </header>

      <section className="fp-timer" aria-label="Practice time recorder">
        <div className="fp-timer-heading">
          <img src={PIXEL_ART + 'approved-isolated-icons/stopwatch.png'} alt="" aria-hidden="true" />
          <h2>Practice timer</h2>
          <span className={running ? 'fp-clock-state fp-is-running' : 'fp-clock-state'}>{running ? 'In session' : seconds ? 'Paused' : 'Ready'}</span>
        </div>
        <strong className="fp-time" role="timer" aria-live="off">{formatPracticeTime(seconds)}</strong>
        <p className="fp-timer-note">{running ? 'Your practice time is counting.' : seconds ? 'Paused. Pick up whenever you’re ready.' : 'Start the clock whenever you’re ready.'}</p>
        <button type="button" className="fp-play" aria-label={running ? 'Pause practice timer' : seconds ? 'Resume practice timer' : 'Start practice timer'} onClick={toggleClock}>
          <img src={PIXEL_ART + (running ? 'practice-player/png/pause.png' : 'approved-isolated-icons/play.png')} alt="" aria-hidden="true" />
          <span>{running ? 'Pause' : seconds ? 'Resume' : 'Start Practicing'}</span>
        </button>
      </section>
      <button type="button" className="fp-primary fp-finish" onClick={finishSession}>
        <img src={PIXEL_ART + 'practice-player/png/finish-check.png'} alt="" aria-hidden="true" />
        Finish Session
      </button>

      <section className="fp-add" aria-labelledby="fp-add-heading">
        <div className="fp-section-heading"><h2 id="fp-add-heading">Build your session</h2><span>Optional</span></div>
        <p className="fp-section-lead">Add something to work on, or just play freely.</p>
        <div className="fp-choice-list">
          {([
            ['exercise', 'Exercise', 'approved-isolated-icons/music-bubble.png', 'Skills & drills'],
            ['chart', 'Chart', 'music-note-purple-sharp.png', 'Chord study'],
            ['routine', 'Routine', 'refreshed-icons/routine-list.png', 'Your plan'],
            ['track', 'Backing Track', 'refreshed-icons/record.png', 'Recorded audio'],
          ] as const).map(([kind, label, icon, description]) => (
            <button type="button" key={kind} className="fp-choice" aria-label={label} aria-expanded={picker === kind} onClick={() => openPicker(kind)}>
              <span className="fp-choice-icon" aria-hidden="true"><img src={PIXEL_ART + icon} alt="" /></span>
              <span className="fp-choice-copy"><strong>{label}</strong><small>{description}</small></span>
              <span className="fp-chevron" aria-hidden="true">{picker === kind ? '⌄' : '›'}</span>
            </button>
          ))}
        </div>

        {picker && <div className="fp-picker" aria-label={'Choose ' + picker}>
          <div className="fp-picker-head"><strong>{picker === 'track' ? 'Backing Tracks' : picker === 'exercise' ? 'Exercises & Techniques' : picker === 'chart' ? 'Charts' : 'Routines'}</strong>
            <button type="button" onClick={() => setPicker(null)} aria-label="Close choices">×</button>
          </div>
          {picker === 'exercise' && <div className="fp-techniques" aria-label="Quick techniques">
            {TECHNIQUES.map(value => <button key={value} type="button" onClick={() => addTechnique(value)}>+ {value}</button>)}
            <form onSubmit={event => { event.preventDefault(); addTechnique(customTechnique); }} className="fp-custom">
              <input aria-label="Custom technique" value={customTechnique} onChange={event => setCustomTechnique(event.target.value)} placeholder="Custom technique" maxLength={80}/>
              <button type="submit" disabled={!customTechnique.trim()}>Add</button>
            </form>
          </div>}
          <input className="fp-search" aria-label="Search choices" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={'Search ' + (picker === 'track' ? 'tracks' : picker === 'exercise' ? 'exercises' : picker + 's')}/>
          <div className="fp-picker-results">
            {visibleOptions.map(item => <button type="button" key={item.id} onClick={() => selectOption(item.id, item.title)}>
              <span><strong>{item.title}</strong><small>{item.description}</small></span><span aria-hidden="true">+</span>
            </button>)}
            {visibleOptions.length === 0 && <p>{picker === 'track' ? 'No playable audio available.' : 'No matches.'}</p>}
          </div>
        </div>}
      </section>

      {queue.length > 0 && <section className="fp-queue" aria-label="Practice queue">
        <div className="fp-section-heading"><h2>Session activities</h2><span>{queue.filter(item => item.done).length} / {queue.length} done</span></div>
        {queue.map(item => <div className="fp-queue-item" key={item.key}>
          <div className="fp-queue-row">
            <input type="checkbox" aria-label={'Completed ' + item.title} checked={item.done}
              onChange={event => setQueue(current => current.map(entry => entry.key === item.key ? { ...entry, done: event.target.checked } : entry))}/>
            <button type="button" className="fp-queue-title" aria-expanded={expandedKey === item.key}
              onClick={() => { setSelectedMeasure(0); setExpandedKey(current => current === item.key ? null : item.key); }}>
              <span className={item.done ? 'fp-done' : ''}>{item.title}</span><small>{item.kind}</small>
            </button>
            <button type="button" className="fp-remove" aria-label={'Remove ' + item.title} onClick={() => {
              setQueue(current => current.filter(entry => entry.key !== item.key));
              if (expandedKey === item.key) setExpandedKey(null);
            }}>×</button>
          </div>
          {expandedKey === item.key && <div className="fp-detail">
            {activeChart && <div className="fp-chart">
              <ChordGrid chart={activeChart} chartKey={activeChart.concert_key} writtenPitch="C"
                selectedBar={selectedMeasure} loopRange={null} onSelectBar={setSelectedMeasure} practiceSheet />
            </div>}
            {activeExercise && <p>{activeExercise.instructions}</p>}
            {activeRoutine && <ol>{activeRoutine.steps.map((step, index) => <li key={index}>{exercises.find(exercise => exercise.id === step.exercise_id)?.title ?? step.snapshot?.title ?? 'Exercise'} · {step.duration_minutes} min</li>)}</ol>}
            {activeItem?.kind === 'technique' && <p>Practice at your own pace.</p>}
          </div>}
        </div>)}
      </section>}

      {recording && <section className="fp-audio" aria-label="Backing track">
        <div className="fp-audio-head"><strong>{recording.title}</strong><button type="button" onClick={() => {
          audioRef.current?.pause(); setRecordingId(null); setAudioError('');
        }} aria-label="Remove backing track">×</button></div>
        <audio key={recording.id} ref={audioRef} src={recording.src} controls preload="metadata"
          aria-label={recording.title + ' backing track'} onError={() => setAudioError('Audio file unavailable.')} />
        {audioError && <p role="alert">{audioError}</p>}
      </section>}

      <div className="fp-tools" aria-label="Practice tools">
        <button type="button" onClick={event => openTool('metronome', event.currentTarget)}><img src={PIXEL_ART + 'refreshed-icons/metronome.png'} alt="" aria-hidden="true" />Metronome</button>
        <button type="button" onClick={event => openTool('tuner', event.currentTarget)}><img src={PIXEL_ART + 'practice-player/png/tuner.png'} alt="" aria-hidden="true" />Tuner</button>
      </div>
    </section>

    {tool && createPortal(<div className="fp-tool-overlay" ref={toolDialogRef} role="dialog" aria-modal="true" aria-label={tool === 'tuner' ? 'Tuner' : 'Metronome'}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); closeTool(); }
        if (event.key !== 'Tab') return;
        const controls = [...(toolDialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') ?? [])];
        if (!controls.length) return;
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1]?.focus(); }
        else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0]?.focus(); }
      }}>
      {tool === 'tuner' ? <TunerPage onClose={closeTool}/> : <MetronomePage onClose={closeTool}/>}
    </div>, document.querySelector('.app-shell') ?? document.body)}
  </>;
}
