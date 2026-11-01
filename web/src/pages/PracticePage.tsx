import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChordGrid } from '../components/ChordGrid';
import { chartsById, exercisesById } from '../data/seed';
import { formatChartMeta } from '../lib/chords';
import { resolvePlayableStep } from '../lib/routinePlayback';
import { useApp } from '../context/AppContext';
import type { WrittenPitch } from '../types/content';
import { elapsedMilliseconds, formatPracticeTime } from './practicePlayerLogic';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import './PracticePage.css';

const CHROMA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
type Panel = 'chart' | 'player';
type Completion = {
  id: string;
  finishedAt: string;
  durationSeconds: number;
  routineId?: string;
  exerciseId?: string;
  title: string;
  chartTitle: string;
};

/**
 * The timer measures real wall-clock elapsed time, including time spent on a
 * background tab, rather than counting setInterval callbacks. It never starts
 * an audio transport: this demo has no licensed/recorded audio available.
 */
export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    charts, exercises, routines, activeRoutineId, addSession, showToast,
  } = useApp();
  const routine = activeRoutineId ? routines.find(item => item.id === activeRoutineId) ?? null : null;
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = routine?.steps[stepIndex] ?? null;
  const playableStep = useMemo(
    () => currentStep ? resolvePlayableStep(currentStep, exercises, exercisesById) : null,
    [currentStep, exercises],
  );
  const requestedChart = searchParams.get('chart');
  const initialChart = requestedChart && chartsById[requestedChart]
    ? requestedChart
    : charts[0]?.id ?? 'blues-f-12';
  const [chartId, setChartId] = useState(initialChart);
  const [chartKey, setChartKey] = useState(chartsById[initialChart]?.concert_key ?? 'F');
  const [writtenPitch, setWrittenPitch] = useState<WrittenPitch>('C');
  const [selectedBar, setSelectedBar] = useState(0);
  const [loopValue, setLoopValue] = useState('all');
  const [panel, setPanel] = useState<Panel>('chart');
  const [tempo, setTempo] = useState(100);

  // Prior steps are committed as milliseconds; the current step retains its
  // fractional second when paused or advanced.
  const [priorMs, setPriorMs] = useState(0);
  const [stepMs, setStepMs] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => performance.now());
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const savePromiseRef = useRef<Promise<boolean> | null>(null);

  const chart = chartsById[chartId] ?? charts[0]!;
  const chosenExercise = exercises.find(item => item.id === playableStep?.exercise_id);
  const stepMinutes = currentStep?.duration_minutes ?? playableStep?.duration_minutes ?? 0;
  const targetSeconds = stepMinutes * 60;
  const isRunning = startedAtMs !== null;
  const currentStepMs = elapsedMilliseconds(stepMs, startedAtMs, nowMs);
  const elapsedSeconds = Math.floor((priorMs + currentStepMs) / 1000);
  const stepSeconds = Math.floor(currentStepMs / 1000);
  const formProgress = routine ? Math.round(((stepIndex + 1) / routine.steps.length) * 100) : 0;

  useEffect(() => {
    setStepIndex(0);
    setPriorMs(0);
    setStepMs(0);
    setStartedAtMs(null);
    setNowMs(performance.now());
    setCompletion(null);
    setSaveState('idle');
    savePromiseRef.current = null;
  }, [activeRoutineId]);

  useEffect(() => {
    if (!playableStep?.chart_id || !chartsById[playableStep.chart_id]) return;
    const chosen = chartsById[playableStep.chart_id];
    setChartId(chosen.id);
    setChartKey(chosen.concert_key);
    setSelectedBar(0);
    setLoopValue('all');
  }, [playableStep?.chart_id, playableStep?.exercise_id]);

  useEffect(() => {
    if (chosenExercise?.suggested_bpm != null) setTempo(chosenExercise.suggested_bpm);
  }, [chosenExercise?.id, chosenExercise?.suggested_bpm]);

  useEffect(() => {
    if (!isRunning || completion) return;
    const timerId = window.setInterval(() => setNowMs(performance.now()), 200);
    return () => window.clearInterval(timerId);
  }, [isRunning, completion]);

  const loopRange = useMemo((): [number, number] | null => {
    if (loopValue === 'all') return null;
    const parts = loopValue.split('-').map(Number);
    return parts.length === 2 && parts[0] > 0 && parts[1] > 0
      ? [parts[0], parts[1]] : null;
  }, [loopValue]);

  const loopOptions = useMemo(() => {
    const groups = Array.from({ length: Math.ceil(chart.bars.length / 4) }, (_, i) => {
      const first = 1 + i * 4;
      return { value: first + '-' + Math.min(chart.bars.length, first + 3), label: first + '–' + Math.min(chart.bars.length, first + 3) };
    });
    return [{ value: 'all', label: 'All bars' }, ...groups];
  }, [chart]);

  function chooseChart(id: string) {
    const next = chartsById[id];
    if (!next) return;
    setChartId(id);
    setChartKey(next.concert_key);
    setLoopValue('all');
    setSelectedBar(0);
  }

  function toggleTimer() {
    const now = performance.now();
    if (startedAtMs === null) {
      setStartedAtMs(now);
    } else {
      setStepMs(value => elapsedMilliseconds(value, startedAtMs, now));
      setStartedAtMs(null);
    }
    setNowMs(now);
  }

  function goStep(delta: number) {
    if (!routine) return;
    const next = Math.max(0, Math.min(routine.steps.length - 1, stepIndex + delta));
    if (next === stepIndex) return;
    const now = performance.now();
    setPriorMs(value => value + elapsedMilliseconds(stepMs, startedAtMs, now));
    setStepMs(0);
    setStartedAtMs(null);
    setNowMs(now);
    setStepIndex(next);
  }

  function finishSession() {
    if (completion) return;
    const now = performance.now();
    const finishedStamp = Date.now();
    const finalStepMs = elapsedMilliseconds(stepMs, startedAtMs, now);
    const durationSeconds = Math.floor((priorMs + finalStepMs) / 1000);
    setStepMs(finalStepMs);
    setStartedAtMs(null);
    setNowMs(now);
    setCompletion({
      id: 'sess-' + finishedStamp + '-' + Math.random().toString(36).slice(2, 9),
      finishedAt: new Date(finishedStamp).toISOString(),
      durationSeconds,
      routineId: routine?.id,
      exerciseId: playableStep?.exercise_id,
      title: routine?.title ?? chart.title,
      chartTitle: chart.title,
    });
    setSaveState('idle');
    savePromiseRef.current = null;
  }

  function saveSession(): Promise<boolean> {
    if (!completion) return Promise.resolve(false);
    if (savePromiseRef.current) return savePromiseRef.current;
    const record = completion;
    const savedNotes = notes.trim();
    const savedRating = rating;
    setSaveState('saving');
    const promise = (async () => {
      try {
        await addSession({
          id: record.id,
          finishedAt: record.finishedAt,
          durationSeconds: record.durationSeconds,
          routineId: record.routineId,
          exerciseId: record.exerciseId,
        });
        // Notes and rating belong to the local class demo, not the session or
        // Supabase schema. Failures here must never cause a duplicate session.
        try {
          localStorage.setItem(
            'little-jazz-room:practice-feedback:v1:' + record.id,
            JSON.stringify({ notes: savedNotes, rating: savedRating }),
          );
        } catch { /* optional local feedback */ }
        setSaveState('saved');
        showToast('Practice session saved.');
        return true;
      } catch {
        setSaveState('idle');
        savePromiseRef.current = null;
        showToast('Could not save your session. Please try again.');
        return false;
      }
    })();
    savePromiseRef.current = promise;
    return promise;
  }

  async function leaveAfterSave(destination: string) {
    if (await saveSession()) navigate(destination);
  }

  async function practiceAgain() {
    if (!(await saveSession())) return;
    setStepIndex(0);
    setPriorMs(0);
    setStepMs(0);
    setStartedAtMs(null);
    setNowMs(performance.now());
    setSelectedBar(0);
    setCompletion(null);
    setNotes('');
    setRating(0);
    setSaveState('idle');
    setPanel('chart');
    savePromiseRef.current = null;
  }

  if (completion) {
    return (
      <section className="practice-complete" aria-label="Practice session complete">
        <button className="practice-complete-close" type="button" aria-label="Go home and save session" onClick={() => void leaveAfterSave('/')}>×</button>
        <div className="practice-confetti" aria-hidden="true">✦ · ✧ · ✦</div>
        <div className="practice-celebrate" aria-hidden="true">◷</div>
        <h1>Great practice!</h1>
        <p className="practice-complete-time">{formatPracticeTime(completion.durationSeconds, true)}</p>
        <p className="practice-complete-date">{new Date(completion.finishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <div className="practice-complete-summary">
          <img src={VISUAL_ASSETS.room.h01} alt="" />
          <div>
            <strong>{completion.title}</strong>
            <span>{completion.routineId ? 'Guided Practice' : 'Free Practice'}</span>
            <small>{completion.chartTitle} · Chart only</small>
          </div>
        </div>
        <label className="practice-notes-label" htmlFor="practice-notes">Notes <span>Optional</span></label>
        <textarea id="practice-notes" value={notes} maxLength={500} rows={2} disabled={saveState !== 'idle'} onChange={event => setNotes(event.target.value)} placeholder="What went well? What will you work on?" />
        <div className="practice-rating">
          <span>Rating <small>Optional · on this device</small></span>
          <div role="group" aria-label="Rate this practice session">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button" disabled={saveState !== 'idle'} aria-label={star + ' stars'} aria-pressed={rating === star} onClick={() => setRating(value => value === star ? 0 : star)}>
                {star <= rating ? '★' : '☆'}
              </button>
            ))}
          </div>
        </div>
        <button className="practice-primary practice-save" type="button" disabled={saveState !== 'idle'} onClick={() => void saveSession()}>
          {saveState === 'saved' ? 'Session Saved ✓' : saveState === 'saving' ? 'Saving…' : 'Save Session'}
        </button>
        <button className="practice-secondary" type="button" onClick={() => void practiceAgain()}>Practice Again</button>
        <div className="practice-complete-links">
          <button className="practice-secondary" type="button" onClick={() => void leaveAfterSave('/progress')}>View Progress</button>
          <button className="practice-secondary" type="button" onClick={() => void leaveAfterSave('/')}>Home</button>
        </div>
        <p className="practice-local-hint">Notes and ratings are stored locally for this demo.</p>
      </section>
    );
  }

  return (
    <section className="practice-player" aria-label="Shared practice player">
      <header className="practice-player-head">
        <button className="practice-back" type="button" onClick={() => navigate('/practice')} aria-label="Back to Practice">‹</button>
        <div className="practice-title-group">
          <span className="practice-overline">{routine ? 'Guided Practice' : 'Free Practice'}</span>
          <h1>{routine?.title ?? chart.title}</h1>
          <p>{routine
            ? 'Step ' + (stepIndex + 1) + ' of ' + routine.steps.length + ' · ' + (playableStep?.title ?? 'Exercise')
            : formatChartMeta(chart) + ' · Key ' + chart.concert_key.replace('b', '♭')}</p>
        </div>
        <button className="practice-more" type="button" aria-label="Finish session" onClick={finishSession}>Finish</button>
      </header>

      <p className="practice-audio-state"><strong>Chart Only</strong> · No recording available</p>

      {routine && (
        <div className="practice-guided-head">
          <div className="practice-progress-track" role="progressbar" aria-label="Routine steps completed" aria-valuemin={0} aria-valuemax={routine.steps.length} aria-valuenow={stepIndex}>
            <span style={{ width: formProgress + '%' }} />
          </div>
          <div className="practice-step-copy"><strong>{playableStep?.title ?? 'Exercise'}</strong><span>{stepMinutes} min suggested</span></div>
          <p>{playableStep?.instructions ?? 'Follow the exercise and practice at your own pace.'}</p>
        </div>
      )}

      <div className="practice-segments" role="tablist" aria-label="Player view">
        <button type="button" role="tab" aria-selected={panel === 'chart'} onClick={() => setPanel('chart')} className={panel === 'chart' ? 'selected' : undefined}>Chart</button>
        <button type="button" role="tab" aria-selected={panel === 'player'} onClick={() => setPanel('player')} className={panel === 'player' ? 'selected' : undefined}>Player</button>
      </div>

      {panel === 'chart' ? (
        <div className="practice-notation-panel" role="tabpanel" aria-label="Jazz chord chart">
          <div className="practice-chart-toolbar">
            <label htmlFor="player-chart">Study chart</label>
            <select id="player-chart" value={chartId} onChange={event => chooseChart(event.target.value)} aria-label="Choose practice chart">
              {charts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          {routine && !playableStep?.chart_id && <p className="practice-reference-note">Reference chart only. This step has no assigned chart.</p>}
          <div className="practice-chart-scroll" tabIndex={0} aria-label="Scrollable measure grid">
            <ChordGrid chart={chart} chartKey={chartKey} writtenPitch={writtenPitch} selectedBar={selectedBar} loopRange={loopRange} onSelectBar={setSelectedBar} />
          </div>
          <p className="practice-chart-caption">{chart.bars.length} measures · Tap to select · Original harmony study</p>
        </div>
      ) : (
        <div className="practice-art-panel" role="tabpanel" aria-label="Chart only player">
          <img src={VISUAL_ASSETS.room.h01} alt="Warm and cozy jazz practice room" />
          <div className="practice-art-caption"><strong>{chart.title}</strong><span>{formatChartMeta(chart)}</span></div>
          <div className="practice-no-audio"><strong>Chart Only · No Recording</strong><p>Backing-track playback and stem mixing are unavailable. Your practice timer works independently.</p></div>
        </div>
      )}

      {routine && (
        <div className="practice-step-controls">
          <button type="button" onClick={() => goStep(-1)} disabled={stepIndex === 0} aria-label="Previous routine step">‹</button>
          <div><strong>Step {stepIndex + 1} of {routine.steps.length}</strong><span>{playableStep?.title ?? 'Exercise'}</span></div>
          <button type="button" className="practice-next" onClick={() => goStep(1)} disabled={stepIndex === routine.steps.length - 1}>Next Step ›</button>
        </div>
      )}

      <div className="practice-transport">
        <div className="practice-clock"><strong data-testid="session-elapsed">{formatPracticeTime(elapsedSeconds)}</strong><span>{isRunning ? 'Practicing' : elapsedSeconds ? 'Paused' : 'Ready'} · Step {formatPracticeTime(stepSeconds)}{targetSeconds ? ' / ' + formatPracticeTime(targetSeconds) : ''}</span></div>
        <div className="practice-control-row">
          <button className="practice-measure-btn" type="button" aria-label="Previous measure" onClick={() => setSelectedBar(bar => (bar + chart.bars.length - 1) % chart.bars.length)}>‹‹</button>
          <button className="practice-timer-button" type="button" onClick={toggleTimer} aria-label={isRunning ? 'Pause practice timer' : (priorMs + stepMs) ? 'Resume practice timer' : 'Start practice timer'}>
            {isRunning ? 'Ⅱ' : '▶'}<span>{isRunning ? 'Pause' : (priorMs + stepMs) ? 'Resume' : 'Start'}</span>
          </button>
          <button className="practice-measure-btn" type="button" aria-label="Next measure" onClick={() => setSelectedBar(bar => (bar + 1) % chart.bars.length)}>››</button>
        </div>
        <div className="practice-chart-controls">
          <label>Key<select value={chartKey} onChange={event => setChartKey(event.target.value)} aria-label="Transpose concert chart key">{CHROMA.map(key => <option key={key} value={key}>{key.replace('b', '♭')}</option>)}</select></label>
          <label>Instrument<select value={writtenPitch} onChange={event => setWrittenPitch(event.target.value as WrittenPitch)} aria-label="Transposing instrument"><option value="C">Concert</option><option value="Bb">B♭</option><option value="Eb">E♭</option></select></label>
          <label>Tempo<select value={tempo} onChange={event => setTempo(Number(event.target.value))} aria-label="Reference tempo in beats per minute">{[60, 70, 80, 90, 100, 110, 120, 140, 160, 180].concat(chosenExercise?.suggested_bpm ?? []).filter((bpm, index, all) => all.indexOf(bpm) === index).sort((a,b) => a-b).map(bpm => <option key={bpm} value={bpm}>{bpm} BPM</option>)}</select></label>
          <label>Loop<select value={loopValue} onChange={event => setLoopValue(event.target.value)} aria-label="Highlight loop measures">{loopOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>
        <p className="practice-reference-note">Tempo is a reference setting. No audio or metronome sound is playing.</p>
        <button className="practice-finish-action" type="button" onClick={finishSession}>Finish Session</button>
      </div>
      <div className="practice-utility-row" aria-label="Unavailable preview tools">
        {['Mixer', 'Tuner', 'Metronome'].map(item => <button key={item} type="button" disabled title={item + ' is Preview only'}>{item}<span>Preview</span></button>)}
      </div>
    </section>
  );
}
