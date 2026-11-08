import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

type Picker = 'goal' | 'exercise' | 'chart' | 'routine' | 'track' | null;
type QueueKind = 'technique' | 'goal' | 'exercise' | 'chart' | 'routine';
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
  const [phase, setPhase] = useState<'intro' | 'setup' | 'active'>('intro');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [showChoices, setShowChoices] = useState(true);
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

  // The app scrolls inside .viewport. Each stage should open at the top,
  // particularly when finishing from an expanded chart or picker.
  useEffect(() => {
    const viewport = document.querySelector<HTMLElement>('.app-shell .viewport');
    if (viewport) viewport.scrollTop = 0;
  }, [phase, finished]);

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
      if (phase === 'setup') {
        setExpandedKey(null);
        setPicker(null);
      }
      setPhase('active');
      setShowChoices(false);
    }
    setSeconds(Math.floor(elapsedMs() / 1000));
  };

  const openPicker = (next: Exclude<Picker, null>) => {
    setPicker(current => current === next ? null : next);
    setSearch('');
    setShowChoices(true);
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
  const addGoal = (value: string) => {
    const title = value.trim();
    if (title) addItem('goal', title, title);
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
    } else if (picker !== 'goal') {
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
    setPhase('intro');
    setTargetMinutes(25);
    setShowChoices(true);
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
      </header>
      <div className="fp-completion-card" role="status">
        <h1>✦ Practice Complete! ✦</h1>
        <div className="fp-completed-duration"><img src={PIXEL_ART + 'approved-isolated-icons/stopwatch.png'} alt="" aria-hidden="true" />
          <span><strong>{formatPracticeTime(finished.durationSeconds)}</strong><small>Practice Time</small></span>
        </div>
        <div className="fp-completed-summary">
          <h2>Session Summary</h2>
          {queue.map(item => <div key={item.key} className="fp-summary-line">
            <span className="fp-summary-symbol" aria-hidden="true">{item.kind === 'goal' ? '◎' : item.kind === 'chart' ? '♬' : '♫'}</span>
            <span><strong>{item.kind === 'goal' ? 'Goal' : item.kind === 'chart' ? 'Chart' : item.kind === 'routine' ? 'Routine' : item.kind === 'exercise' ? 'Exercise' : 'Technique'}:</strong> {item.title}</span>
          </div>)}
          {recordingId && <div className="fp-summary-line"><span className="fp-summary-symbol" aria-hidden="true">◉</span><span><strong>Track:</strong> {recording?.title ?? 'Recorded track'}</span></div>}
          {queue.length === 0 && !recordingId && <p>Free-form practice, at your own pace.</p>}
        </div>
        <div className="fp-completion-shelf" aria-hidden="true">
          <img src="/visuals/pixel-motifs/approved/plant-pot.png" alt="" />
          {catMode && <DecorativeCat catId={catId} variant="sitting" size={68} className="fp-summary-cat" />}
          <img src={PIXEL_ART + 'music-note-purple-sharp.png'} alt="" />
        </div>
        <p className="fp-save-status">{saved ? 'Session Saved ✓' : saveError ? 'Save failed. Your session can be retried.' : 'Saving your practice…'}</p>
      </div>
      {saveError && <button type="button" className="fp-primary" disabled={saving} onClick={() => void saveSession(finished)}>Retry Save</button>}
      {saved && <div className="fp-completion-actions">
        <button type="button" className="fp-primary" onClick={() => navigate('/progress')}>✓ View Saved Session</button>
        <button type="button" className="fp-secondary" onClick={reset}>Practice Again</button>
      </div>}
    </section>;
  }

  return <>
    <section className="fp-page" aria-label="Free Practice">
      <header className="fp-top">
        <div className="fp-heading-row">
          <h1>Practice</h1>
          <img src={PIXEL_ART + 'approved-isolated-icons/sprout.png'} alt="" aria-hidden="true" />
        </div>
        <div className="fp-segments" role="group" aria-label="Practice type">
          <button type="button" className="fp-segment-current" aria-pressed="true">Free Practice</button>
          <button type="button" onClick={() => navigate('/routines')} aria-pressed="false">Routines</button>
        </div>
      </header>

      {phase === 'intro' ? <section className="fp-intro" aria-label="Start Free Practice">
        <div className="fp-intro-art"><img src={PIXEL_ART + 'approved-isolated-icons/stopwatch.png'} alt="" /></div>
        <h2>Free Practice</h2>
        <p>A flexible practice session.<br/>Set a timer, then optionally add goals, exercises, charts, or a track.</p>
        <button type="button" className="fp-primary fp-intro-start" onClick={() => setPhase('setup')}>
          <img src={PIXEL_ART + 'approved-isolated-icons/play.png'} alt="" aria-hidden="true" />Start Practice
        </button>
        <div className="fp-intro-shelf" aria-hidden="true">
          <img className="fp-intro-plant" src="/visuals/pixel-motifs/approved/plant-pot.png" alt="" />
          {catMode && <DecorativeCat catId={catId} variant="sleeping" size={82} className="fp-intro-cat" />}
          <img className="fp-intro-note" src={PIXEL_ART + 'music-note-purple-sharp.png'} alt="" />
        </div>
      </section> : <>
      {phase === 'setup'
        ? <div className="fp-target-picker" aria-label="Practice time target">
            <button type="button" aria-label="Decrease time goal by 5 minutes" disabled={targetMinutes <= 5} onClick={() => setTargetMinutes(v => Math.max(5, v - 5))}>−</button>
            <strong>{formatPracticeTime(targetMinutes * 60)}</strong>
            <button type="button" aria-label="Increase time goal by 5 minutes" disabled={targetMinutes >= 240} onClick={() => setTargetMinutes(v => Math.min(240, v + 5))}>+</button>
          </div>
        : <section className="fp-timer" aria-label="Practice time recorder">
            <div className="fp-timer-ring" style={{ '--fp-progress': Math.min(100, seconds / (targetMinutes * 60) * 100) + '%' } as CSSProperties}>
              <strong className="fp-time" role="timer" aria-live="off">{formatPracticeTime(seconds)}</strong>
              <span>/ {formatPracticeTime(targetMinutes * 60)}</span>
              {!running && <span className="fp-paused-pill">Ⅱ Paused</span>}
            </div>
            <div className="fp-timer-shelf" aria-hidden="true">
              <img src="/visuals/pixel-motifs/approved/plant-pot.png" alt="" />
              {catMode && <DecorativeCat catId={catId} variant={running ? 'sitting' : 'sleeping'} size={66} className="fp-timer-cat" />}
              <img src={PIXEL_ART + 'music-note-purple-sharp.png'} alt="" />
            </div>
          </section>}
      {(phase === 'active' || queue.length > 0 || Boolean(recording)) && <section className="fp-queue" aria-label="Practice queue">
        <div className="fp-session-head">
          <h2>{phase === 'active' ? 'This Session' : 'Selected Activities'}</h2>
          {phase === 'active' && <button type="button" className="fp-edit" aria-expanded={showChoices} onClick={() => { setShowChoices(v => !v); setPicker(null); }}>Edit</button>}
        </div>
        {queue.length === 0 && !recording && <p className="fp-queue-empty">Just you and the music. Add something whenever you like.</p>}
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
            {activeItem?.kind === 'goal' && <p>Keep this goal in mind as you practice. Mark it complete when you're happy with your progress.</p>}
          </div>}
        </div>)}
        {recording && <div className="fp-selected-recording"><strong>Track:</strong> {recording.title}</div>}
      </section>}

      {(phase === 'setup' || showChoices) && <section className="fp-add" aria-labelledby="fp-add-heading">
        <h2 id="fp-add-heading">Add to This Session <span>(Optional)</span></h2>
        <div className="fp-choice-list">
          {([
            ['goal', 'Goal', 'approved-isolated-icons/sprout.png'],
            ['exercise', 'Exercise', 'approved-isolated-icons/music-bubble.png'],
            ['chart', 'Chart', 'music-note-purple-sharp.png'],
            ['routine', 'Routine', 'refreshed-icons/routine-list.png'],
            ['track', 'Backing Track', 'refreshed-icons/record.png'],
          ] as const).map(([kind, label, icon]) => (
            <button type="button" key={kind} className="fp-choice" aria-label={label} aria-expanded={picker === kind} onClick={() => openPicker(kind)}>
              <span className="fp-choice-icon" aria-hidden="true"><img src={PIXEL_ART + icon} alt="" /></span>
              <span className="fp-choice-copy"><strong>{label}</strong></span>
              <span className="fp-chevron" aria-hidden="true">{picker === kind ? '⌄' : '›'}</span>
            </button>
          ))}
        </div>
        {picker && <div className="fp-picker" aria-label={'Choose ' + picker}>
          <div className="fp-picker-head"><strong>{picker === 'goal' ? 'Set a Focus Goal' : picker === 'track' ? 'Backing Tracks' : picker === 'exercise' ? 'Exercises & Techniques' : picker === 'chart' ? 'Charts' : 'Routines'}</strong>
            <button type="button" onClick={() => setPicker(null)} aria-label="Close choices">×</button>
          </div>
          {picker === 'goal' && <form onSubmit={event => { event.preventDefault(); addGoal(customTechnique); }} className="fp-custom">
            <input aria-label="Custom practice goal" value={customTechnique} onChange={event => setCustomTechnique(event.target.value)} placeholder="What would you like to work on?" maxLength={80}/>
            <button type="submit" disabled={!customTechnique.trim()}>Add Goal</button>
          </form>}
          {picker === 'exercise' && <div className="fp-techniques" aria-label="Quick techniques">
            {TECHNIQUES.map(value => <button key={value} type="button" onClick={() => addTechnique(value)}>+ {value}</button>)}
          </div>}
          {picker !== 'goal' && <>
            <input className="fp-search" aria-label="Search choices" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={'Search ' + (picker === 'track' ? 'tracks' : picker === 'exercise' ? 'exercises' : picker + 's')}/>
            <div className="fp-picker-results">
              {visibleOptions.map(item => <button type="button" key={item.id} onClick={() => selectOption(item.id, item.title)}>
                <span><strong>{item.title}</strong><small>{item.description}</small></span><span aria-hidden="true">+</span>
              </button>)}
              {visibleOptions.length === 0 && <p>{picker === 'track' ? 'No playable audio available.' : 'No matches.'}</p>}
            </div>
          </>}
        </div>}
      </section>}

      {phase === 'setup' ? <button type="button" className="fp-primary fp-start-workspace" aria-label="Start practice timer" onClick={toggleClock}>
          <img src={PIXEL_ART + 'approved-isolated-icons/play.png'} alt="" aria-hidden="true" />Start Practice
        </button> : <div className="fp-session-actions">
          <button type="button" className="fp-pause-action" aria-label={running ? 'Pause practice timer' : 'Resume practice timer'} onClick={toggleClock}>
            <img src={PIXEL_ART + (running ? 'practice-player/png/pause.png' : 'approved-isolated-icons/play.png')} alt="" aria-hidden="true" />
            {running ? 'Pause' : 'Resume'}
          </button>
          <button type="button" className="fp-finish-action" onClick={finishSession}>Finish Session</button>
        </div>}

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
      </>}
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
