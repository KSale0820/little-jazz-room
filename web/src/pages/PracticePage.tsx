import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChordGrid } from '../components/ChordGrid';
import { LoopPlanSettings } from '../components/LoopPlanSettings';
import { GuidedCatCoach, GuidedLesson } from '../components/GuidedLesson';
import { normalizeGuidedLesson } from '../lib/guidedLesson';
import { exercisesById } from '../data/seed';
import { getChartById } from '../features/charts/chartRepository';
import { chartBeatAtRecordingTime, hasChartSync, isUsableRecordedTrack, recordingById, recordingTimeForSelectedBar, recordingTimeForAdjacentBar } from '../features/recordings/recordingCatalog';
import { RecordingOnlyPractice } from '../features/recordings/RecordingOnlyPractice';
import { pitchClass } from '../features/charts/chartModel';
import { formatChartMeta } from '../lib/chords';
import { beatsPerMeasure, locateSequencePlayhead, rawChartBeat, sequenceBeatForBar, sequenceDuration } from '../lib/practiceChartClock';
import type { LoopSection } from '../lib/practiceChartClock';
import { resolvePlayableStep } from '../lib/routinePlayback';
import { useApp } from '../context/AppContext';
import type { WrittenPitch } from '../types/content';
import { elapsedMilliseconds, formatPracticeTime } from './practicePlayerLogic';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { TunerPage } from './TunerPage';
import { MetronomePage } from './MetronomePage';
import './PracticePage.css';
import './PracticePlayerApproved.css';

const CHROMA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
type Panel = 'instructions' | 'chart' | 'player';
type PracticeTool = 'tuner' | 'metronome' | 'settings';
type Completion = {
  id: string;
  finishedAt: string;
  durationSeconds: number;
  routineId?: string;
  exerciseId?: string;
  title: string;
  chartTitle: string;
  recordingTitle?: string;
};

/**
 * The timer measures real wall-clock elapsed time, including time spent on a
 * background tab, rather than counting setInterval callbacks. When a
 * rights-cleared recording is configured, the native media element controls
 * audio time, while session time remains a separate elapsed-time record.
 */
type PracticeToolIcon = 'mixer' | 'tempo' | 'loop' | 'tuner' | 'metronome';
function PracticeToolGlyph({ name }: { name: PracticeToolIcon }) {
  // Approved P02: thin rounded evergreen outlines, matching five tool tiles.
  const paths: Record<PracticeToolIcon, React.ReactNode> = {
    mixer: <>
      <path d="M8 3v26M16 3v26M24 3v26" />
      <rect x="5.3" y="11" width="5.4" height="7" rx="2.6" fill="#eeecdf" />
      <rect x="13.3" y="17" width="5.4" height="7" rx="2.6" fill="#eeecdf" />
      <rect x="21.3" y="8" width="5.4" height="7" rx="2.6" fill="#eeecdf" />
    </>,
    tempo: <>
      <circle cx="16" cy="18" r="11" />
      <path d="M16 7V3M12 3h8M16 18V10M16 18l4.6 5.4M23.8 8.8l2.3-2.3" />
    </>,
    loop: <>
      <path d="M23.8 9.6A10.6 10.6 0 0 0 7 9L5 12.5" />
      <path d="M5.2 6.5 5 12.6l6-.3M8.2 22.4A10.6 10.6 0 0 0 25 23l2-3.5" />
      <path d="M26.8 25.5 27 19.4l-6 .3" />
    </>,
    tuner: <><path d="M10 5v12a6 6 0 0 0 12 0V5M16 23v6M12.5 29h7" /></>,
    metronome: <>
      <path d="M7 27 12.7 7h6L25 27Z M5 27h22" />
      <path d="m16.4 21 7.2-15" />
      <path d="M22.1 6.3 26 4.6" />
      <circle cx="16.4" cy="21" r="1.3" fill="currentColor" stroke="none" />
    </>,
  };
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="practice-tool-glyph"
    fill="none" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">
    {paths[name]}
  </svg>;
}
export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    charts, exercises, routines, activeRoutineId, addSession, showToast, catId,
  } = useApp();
  const requestedChart = searchParams.get('chart');
  const requestedRecording = searchParams.get('recording');
  const requestedRoutine = searchParams.get('routine');
  const freeMode = searchParams.get('mode') === 'free';
  // Explicit chart deep links open Free Practice even if the last routine is active.
  const routineId = !requestedChart && !requestedRecording && !freeMode ? (requestedRoutine ?? activeRoutineId) : null;
  const routine = routineId ? routines.find(item => item.id === routineId) ?? null : null;
  const missingRoutine = Boolean(requestedRoutine && !routine);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = routine?.steps[stepIndex] ?? null;
  const playableStep = useMemo(
    () => currentStep ? resolvePlayableStep(currentStep, exercises, exercisesById) : null,
    [currentStep, exercises],
  );
  const initialChart = requestedChart ?? recordingById(requestedRecording)?.chartId ?? playableStep?.chart_id ?? charts[0]?.id ?? 'blues-f-12';
  const [chartId, setChartId] = useState(initialChart);
  const [chartKey, setChartKey] = useState(getChartById(initialChart, charts)?.concert_key ?? 'F');
  const [writtenPitch, setWrittenPitch] = useState<WrittenPitch>('C');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopSections, setLoopSections] = useState<LoopSection[]>([{ startBar: 1, endBar: 4, plays: 2 }]);
  const [repeatWholePlan, setRepeatWholePlan] = useState(false);
  const [loopOpen, setLoopOpen] = useState(false);
  const loopTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [musicalClock, setMusicalClock] = useState({ chartBeat: 0, startedAtMs: null as number | null });
  const [panel, setPanel] = useState<Panel>(routine ? 'instructions' : 'chart');
  const [activeTool, setActiveTool] = useState<PracticeTool | null>(null);
  const toolTriggerRef = useRef<HTMLButtonElement | null>(null);
  const toolOverlayRef = useRef<HTMLDivElement | null>(null);
  const [tempo, setTempo] = useState(100);
  const [tempoInput, setTempoInput] = useState('100');

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const suppressAudioPauseRef = useRef(false);
  const [recordingPosition, setRecordingPosition] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingPlaying, setRecordingPlaying] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const openTool = (tool: PracticeTool, trigger: HTMLButtonElement) => {
    toolTriggerRef.current = trigger;
    setActiveTool(tool);
  };
  const closeTool = () => {
    setActiveTool(null);
    requestAnimationFrame(() => toolTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!activeTool) return;
    const focusId = requestAnimationFrame(() => toolOverlayRef.current?.querySelector<HTMLElement>('.tool-back, .practice-settings-dialog header button')?.focus());
    return () => cancelAnimationFrame(focusId);
  }, [activeTool]);

  const resolvedChart = getChartById(chartId, charts);
  const missingChart = !resolvedChart;
  // Hooks remain unconditional, but a missing chart renders an explicit error below.
  const chart = resolvedChart ?? charts[0]!;
  const recordingFromUrl = recordingById(requestedRecording);
  const invalidRecordingLink = Boolean(requestedRecording &&
    (!recordingFromUrl || !isUsableRecordedTrack(recordingFromUrl) ||
      (requestedChart !== null && recordingFromUrl.chartId !== requestedChart)));
  const standaloneRecording = recordingFromUrl && recordingFromUrl.chartId === null &&
    isUsableRecordedTrack(recordingFromUrl) ? recordingFromUrl : null;
  const activeRecording = recordingFromUrl && hasChartSync(recordingFromUrl) &&
    recordingFromUrl.chartId === chartId && isUsableRecordedTrack(recordingFromUrl)
    ? recordingFromUrl : null;
  const chosenExercise = exercisesById[playableStep?.exercise_id ?? ''] ?? exercises.find(item => item.id === playableStep?.exercise_id);
  const lesson = useMemo(() => playableStep
    ? normalizeGuidedLesson(playableStep, chosenExercise, currentStep?.snapshot)
    : null, [playableStep, chosenExercise, currentStep?.snapshot]);
  const stepMinutes = currentStep?.duration_minutes ?? playableStep?.duration_minutes ?? 0;
  const targetSeconds = stepMinutes * 60;
  const isRunning = startedAtMs !== null;
  const currentStepMs = elapsedMilliseconds(stepMs, startedAtMs, nowMs);
  const elapsedSeconds = Math.floor((priorMs + currentStepMs) / 1000);
  const stepSeconds = Math.floor(currentStepMs / 1000);
  const formProgress = routine ? Math.round(((stepIndex + 1) / routine.steps.length) * 100) : 0;
  const stepProgress = targetSeconds ? Math.min(100, Math.round(stepSeconds / targetSeconds * 100)) : 0;

  useEffect(() => {
    setStepIndex(0);
    setPanel(routine ? 'instructions' : 'chart');
    setPriorMs(0);
    setStepMs(0);
    setStartedAtMs(null);
    setNowMs(performance.now());
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
    setCompletion(null);
    setSaveState('idle');
    savePromiseRef.current = null;
  }, [activeRoutineId, requestedChart, requestedRoutine, requestedRecording, freeMode]);

  useEffect(() => {
    setRecordingPosition(0);
    setRecordingDuration(0);
    setRecordingPlaying(false);
    setRecordingError(null);
    suppressAudioPauseRef.current = false;
  }, [requestedRecording]);

  useEffect(() => {
    if (!activeRecording || !isRunning) return;
    const timer = window.setInterval(() => setRecordingPosition(audioRef.current?.currentTime ?? 0), 50);
    return () => window.clearInterval(timer);
  }, [activeRecording?.id, isRunning]);

  useEffect(() => {
    const incomingChart = requestedChart ?? recordingById(requestedRecording)?.chartId;
    if (!incomingChart) return;
    setChartId(incomingChart);
    setChartKey(getChartById(incomingChart, charts)?.concert_key ?? 'F');
    setLoopEnabled(false);
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
  }, [requestedChart, requestedRecording, charts]);

  useEffect(() => {
    if (!playableStep?.chart_id || requestedChart || requestedRecording) return;
    const chosen = getChartById(playableStep.chart_id, charts);
    if (!chosen) {
      setChartId(playableStep.chart_id);
      return;
    }
    setChartId(chosen.id);
    setChartKey(chosen.concert_key);
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
    setLoopEnabled(false);
    setLoopSections([{ startBar: 1, endBar: Math.min(chosen.bars.length, 4), plays: 2 }]);
    setRepeatWholePlan(false);
  }, [playableStep?.chart_id, playableStep?.exercise_id, charts, requestedChart, requestedRecording]);

  useEffect(() => {
    if (chosenExercise?.suggested_bpm != null) {
      const bpm = Math.max(40, Math.min(240, chosenExercise.suggested_bpm));
      setTempo(bpm);
      setTempoInput(String(bpm));
    }
  }, [chosenExercise?.id, chosenExercise?.suggested_bpm]);



  useEffect(() => {
    if (!isRunning || completion) return;
    const timerId = window.setInterval(() => setNowMs(performance.now()), 50);
    return () => window.clearInterval(timerId);
  }, [isRunning, completion]);

  const activeSections = loopEnabled && loopSections.length ? loopSections : null;
  // The media element is the master clock. Honor the original video's exact
  // four complete choruses, shortened final chorus and three-bar ending tag.
  const recordedBeat = activeRecording
    ? chartBeatAtRecordingTime(recordingPosition, activeRecording, chart.time_signature, chart.bars.length)
    : 0;
  const playhead = locateSequencePlayhead(
    chart,
    activeRecording ? { chartBeat: recordedBeat, startedAtMs: null } : musicalClock,
    nowMs,
    activeRecording?.recordedBpm ?? tempo,
    activeRecording ? null : activeSections,
    activeRecording ? false : repeatWholePlan,
  );
  const currentSection = activeSections && playhead.sectionIndex !== null ? activeSections[playhead.sectionIndex] : null;
  const loopRange: [number, number] | null = currentSection ? [currentSection.startBar, currentSection.endBar] : null;
  const loopSummary = activeSections ? activeSections.length + ' section' + (activeSections.length === 1 ? '' : 's') : 'Off';
  const planStatus = activeRecording ? 'Recording plays at its original key and tempo' : playhead.ended ? 'Chart finished' : currentSection
    ? 'Section ' + ((playhead.sectionIndex ?? 0) + 1) + ' of ' + activeSections!.length + ' · Pass ' + playhead.pass + ' of ' + currentSection.plays
    : 'Chart once';

  function chooseChart(id: string) {
    const next = getChartById(id, charts);
    if (!next) return;
    audioRef.current?.pause();
    const now = performance.now();
    setChartId(id);
    setChartKey(next.concert_key);
    setLoopEnabled(false);
    setLoopSections([{ startBar: 1, endBar: Math.min(next.bars.length, 4), plays: 2 }]);
    setRepeatWholePlan(false);
    setMusicalClock({ chartBeat: 0, startedAtMs: isRunning ? now : null });
    setNowMs(now);
  }

  function setKeyBySemitone(delta: number) {
    const index = pitchClass(chartKey) ?? -1;
    setChartKey(CHROMA[((index < 0 ? 0 : index) + delta + 12) % 12]!);
  }

  function changeTempo(nextBpm: number) {
    const bpm = Math.max(40, Math.min(240, Math.round(nextBpm)));
    if (!Number.isFinite(bpm)) return;
    const now = performance.now();
    setMusicalClock(current => ({
      chartBeat: rawChartBeat(current, now, tempo, chart),
      startedAtMs: current.startedAtMs === null ? null : now,
    }));
    setTempo(bpm);
    setTempoInput(String(bpm));
    setNowMs(now);
  }

  function openLoop(trigger: HTMLButtonElement) {
    if (activeRecording) {
      showToast('Recording loops are not available yet. The audio plays as recorded.');
      return;
    }
    loopTriggerRef.current = trigger;
    setLoopOpen(true);
  }

  function closeLoop() {
    setLoopOpen(false);
    requestAnimationFrame(() => loopTriggerRef.current?.focus());
  }

  function applyLoop(enabled: boolean, sections: LoopSection[], repeatPlan: boolean) {
    const now = performance.now();
    setLoopEnabled(enabled);
    setLoopSections(sections);
    setRepeatWholePlan(repeatPlan);
    // A new sequence begins from its first bar; preserve the session timer.
    setMusicalClock({ chartBeat: 0, startedAtMs: isRunning ? now : null });
    setNowMs(now);
    closeLoop();
  }

  function seekRecording(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : recordingDuration;
    const next = Math.max(0, Math.min(seconds, duration > 0 ? duration : seconds));
    audio.currentTime = next;
    setRecordingPosition(next);
  }

  function moveToBar(index: number) {
    const now = performance.now();
    const next = Math.max(0, Math.min(index, chart.bars.length - 1));
    if (activeRecording) {
      seekRecording(recordingTimeForSelectedBar(next, recordingPosition, activeRecording, chart.time_signature, chart.bars.length));
      return;
    }
    const sequenceBeat = sequenceBeatForBar(chart, activeSections, next);
    if (sequenceBeat === null) setLoopEnabled(false);
    setMusicalClock({
      chartBeat: sequenceBeat ?? next * beatsPerMeasure(chart),
      startedAtMs: isRunning ? now : null,
    });
    setNowMs(now);
  }

  function stepMeasure(delta: number) {
    if (activeRecording) {
      seekRecording(recordingTimeForAdjacentBar(delta, recordingPosition, activeRecording, chart.time_signature, chart.bars.length));
      return;
    }
    const now = performance.now();
    const beats = beatsPerMeasure(chart);
    const duration = sequenceDuration(chart, activeSections);
    const raw = rawChartBeat(musicalClock, now, tempo, chart);
    const offset = activeSections && repeatWholePlan ? raw % duration : raw;
    const intended = Math.floor(offset / beats) * beats + delta * beats;
    const next = activeSections && repeatWholePlan
      ? (intended + duration) % duration : Math.max(0, Math.min(duration - beats, intended));
    setMusicalClock({ chartBeat: next, startedAtMs: isRunning ? now : null });
    setNowMs(now);
  }

  function toggleTimer() {
    if (activeRecording) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        void audio.play().catch(() =>
          setRecordingError('Unable to play this file. Check the recording format and file location.'));
      } else {
        audio.pause();
      }
      return;
    }
    togglePracticeClock();
  }

  function togglePracticeClock() {
    const now = performance.now();
    const playing = startedAtMs === null;
    setMusicalClock(current => {
      const beat = rawChartBeat(current, now, tempo, chart);
      const duration = sequenceDuration(chart, activeSections);
      return {
        chartBeat: playing && (!activeSections || !repeatWholePlan) && beat >= duration ? 0 : beat,
        startedAtMs: playing ? now : null,
      };
    });
    if (playing) setStartedAtMs(now);
    else {
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
    setPanel('instructions');
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
  }

  function finishSession() {
    if (completion) return;
    suppressAudioPauseRef.current = true;
    audioRef.current?.pause();
    const now = performance.now();
    const finishedStamp = Date.now();
    const finalStepMs = elapsedMilliseconds(stepMs, startedAtMs, now);
    const durationSeconds = Math.floor((priorMs + finalStepMs) / 1000);
    setStepMs(finalStepMs);
    setStartedAtMs(null);
    setMusicalClock(current => ({ chartBeat: rawChartBeat(current, now, tempo, chart), startedAtMs: null }));
    setNowMs(now);
    setCompletion({
      // One stable UUID per finished session, reused across failed save retries.
      id: crypto.randomUUID(),
      finishedAt: new Date(finishedStamp).toISOString(),
      durationSeconds,
      routineId: routine?.id,
      exerciseId: playableStep?.exercise_id,
      title: routine?.title ?? chart.title,
      chartTitle: chart.title,
      recordingTitle: activeRecording?.title,
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
          routineTitle: record.routineId ? record.title : undefined,
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
    suppressAudioPauseRef.current = false;
    if (audioRef.current) audioRef.current.currentTime = 0;
    setRecordingPosition(0);
    setStepIndex(0);
    setPriorMs(0);
    setStepMs(0);
    setStartedAtMs(null);
    setNowMs(performance.now());
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
    setCompletion(null);
    setNotes('');
    setRating(0);
    setSaveState('idle');
    setPanel(routine ? 'instructions' : 'chart');
    savePromiseRef.current = null;
  }

  if (standaloneRecording) {
    return <RecordingOnlyPractice recording={standaloneRecording} />;
  }

  if (missingRoutine) {
    return <section className="practice-player" role="alert" aria-label="Routine unavailable">
      <h1>Routine unavailable</h1>
      <p>The requested routine could not be found for this account. Nothing else was substituted.</p>
      <button type="button" onClick={() => navigate('/routines')}>Back to Routines</button>
    </section>;
  }

  if (invalidRecordingLink) {
    return <section className="practice-player" role="alert" aria-label="Recording unavailable">
      <h1>Recording unavailable</h1>
      <p>This recording is not configured for the requested chart. Nothing else was substituted.</p>
      <button type="button" onClick={() => navigate('/tracks')}>Back to Tracks</button>
    </section>;
  }

  if (missingChart) {
    return <section className="practice-player" role="alert" aria-label="Chart unavailable">
      <h1>Chart unavailable</h1>
      <p>The requested chart could not be found for this account. Nothing else was substituted.</p>
      <button type="button" onClick={() => navigate('/my-charts')}>Back to My Charts</button>
    </section>;
  }

  if (completion) {
    return (
      <section className="practice-complete" aria-label="Practice session complete">
        <button className="practice-complete-close" type="button" aria-label="Go home and save session" onClick={() => void leaveAfterSave('/')}>×</button>
        <div className="practice-complete-hero">
          <div className="practice-confetti" aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
          </div>
          <div className="practice-celebrate" aria-hidden="true">
            <svg width="65" height="65" viewBox="0 0 80 80" fill="none">
              <g stroke="#eab051" strokeWidth="3" strokeLinecap="round">
                <path d="M40 5v7M10 38h8M62 38h8M17 17l6 6M57 17l-6 6M17 59l6-6M57 59l-6-6" />
              </g>
              <rect x="35" y="7" width="10" height="8" rx="2" fill="#285143" transform="rotate(8 40 11)" />
              <path d="M57 16l6-6" stroke="#285143" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="40" cy="43" r="24" stroke="#285143" strokeWidth="5" fill="#fff9ed"/>
              <path d="M40 24v19l-9 9" stroke="#285143" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="40" cy="43" r="3" fill="#285143"/>
            </svg>
          </div>
          <h1>Great practice!</h1>
          <p className="practice-complete-time">{formatPracticeTime(completion.durationSeconds, true)}</p>
          <p className="practice-complete-date">{new Date(completion.finishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="practice-complete-summary">
          <img src={VISUAL_ASSETS.room.approved.twilight} alt="" />
          <div>
            <strong>{completion.title}</strong>
            <span>{completion.routineId ? 'Guided Practice' : 'Free Practice'}</span>
            <small>{completion.chartTitle} · {completion.recordingTitle ? 'Recorded backing track' : 'Chart only'}</small>
          </div>
        </div>
        <div className="practice-complete-notes">
          <label className="practice-notes-label" htmlFor="practice-notes">Notes <span>Optional</span></label>
          <textarea id="practice-notes" value={notes} maxLength={500} rows={2} disabled={saveState !== 'idle'} onChange={event => setNotes(event.target.value)} placeholder="What went well? What to work on?" />
        </div>
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
        <div className="practice-complete-footer" aria-label="Your jazz companion is celebrating your practice">
          <CatSprite catId={catId} variant="floor" size={170} className="practice-playing-cat" decorative />
          <span>{JAZZ_CATS.find(cat => cat.id === catId)?.name ?? 'Your companion'} · great work!</span>
        </div>
      </section>
    );
  }

  return (
    <>
    <section className={`practice-player ${routine ? 'practice-guided' : 'practice-free'} ${routine && panel === 'instructions' ? 'practice-instructions' : ''} ${routine && panel === 'player' ? 'practice-guided-player-view' : ''}`} aria-label="Shared practice player">
      <header className="practice-player-head">
        <button className="practice-back" type="button" onClick={() => navigate('/practice')} aria-label="Back to Practice">‹</button>
        <div className="practice-title-group">
          <span className="practice-overline">{routine ? 'Guided Practice' : 'Free Practice'}</span>
          <h1>{routine?.title ?? chart.title}</h1>
          <p>{routine
            ? 'Step ' + (stepIndex + 1) + ' of ' + routine.steps.length + ' · ' + (playableStep?.title ?? 'Exercise')
            : formatChartMeta(chart) + ' · Key ' + chart.concert_key.replace('b', '♭')}</p>
          {chart.style_instruction && <p className="practice-chart-style">{chart.style_instruction}</p>}
        </div>
        <button className="practice-more" type="button" aria-label="Finish session" onClick={finishSession}>⋮</button>
      </header>

      {activeRecording && <audio
        key={activeRecording.id} ref={audioRef} src={activeRecording.src} preload="metadata"
        onTimeUpdate={event => setRecordingPosition(event.currentTarget.currentTime)}
        onSeeked={event => setRecordingPosition(event.currentTarget.currentTime)}
        onLoadedMetadata={event => setRecordingDuration(event.currentTarget.duration)}
        onPlay={() => {
          setRecordingPlaying(true);
          setRecordingError(null);
          if (!isRunning && !suppressAudioPauseRef.current) togglePracticeClock();
        }}
        onPause={() => {
          setRecordingPlaying(false);
          if (isRunning && !suppressAudioPauseRef.current) togglePracticeClock();
        }}
        onEnded={() => setRecordingPlaying(false)}
        onError={() => setRecordingError('Recording could not be loaded. Check the audio file and format.')}
        aria-label={activeRecording.title + ' backing track'} />}
      <p className="practice-audio-state" data-testid="chart-playhead" title={planStatus}><strong>{activeRecording ? 'Recorded Track' : 'Chart Only'}</strong> · Bar {playhead.barIndex + 1} · Beat {Math.floor(playhead.beatInBar) + 1} · {activeRecording ? activeRecording.recordedBpm + ' BPM audio' : 'No recording'}</p>
      {activeRecording && recordingError && <p role="alert" className="practice-recording-error">{recordingError}</p>}

      {routine && (
        <div className="practice-guided-progress" role="progressbar" aria-label="Routine steps completed"
          aria-valuemin={0} aria-valuemax={routine.steps.length} aria-valuenow={stepIndex}>
          <span style={{ width: formProgress + '%' }} />
        </div>
      )}

      <div className="practice-segments" role="tablist" aria-label={routine ? 'Guided practice views' : 'Player view'}>
        {routine && <button type="button" role="tab" aria-controls="practice-instructions-panel" aria-selected={panel === 'instructions'} onClick={() => setPanel('instructions')} className={panel === 'instructions' ? 'selected' : undefined}>Instructions</button>}
        <button type="button" role="tab" aria-selected={panel === 'chart'} onClick={() => setPanel('chart')} className={panel === 'chart' ? 'selected' : undefined}>Chart</button>
        <button type="button" role="tab" aria-selected={panel === 'player'} onClick={() => setPanel('player')} className={panel === 'player' ? 'selected' : undefined}>Player</button>
      </div>

      {routine && lesson && panel === 'instructions' ? (
        <div id="practice-instructions-panel" className="practice-lesson-panel" role="tabpanel" aria-label="Instructions">
          <GuidedLesson key={stepIndex} lesson={lesson} stepIndex={stepIndex} totalSteps={routine.steps.length} />
        </div>
      ) : panel === 'chart' ? (
        <div className="practice-notation-panel" role="tabpanel" aria-label="Jazz chord chart">
          <div className="practice-chart-toolbar">
            <label htmlFor="player-chart">{routine && !playableStep?.chart_id ? "Reference chart" : "Study chart"}</label>
            <select id="player-chart" value={chartId} disabled={Boolean(activeRecording)} onChange={event => chooseChart(event.target.value)} aria-label="Choose practice chart">
              {charts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          <div className={`practice-chart-scroll practice-chart-all ${chart.bars.length > 16 ? 'chart-dense' : 'chart-standard'}`}
            aria-label={`Complete chord chart, all ${chart.bars.length} measures visible`}>
            <ChordGrid chart={chart} chartKey={chartKey} writtenPitch={writtenPitch}
              selectedBar={playhead.barIndex} activeBar={playhead.barIndex}
              activeEventIndex={playhead.eventIndex} loopRange={loopRange}
              onSelectBar={moveToBar} showSectionLabels practiceSheet />
          </div>
          <p className="practice-chart-caption">All {chart.bars.length} measures · Tap a measure to move the playhead</p>
        </div>
      ) : (
        <div className="practice-art-panel" role="tabpanel" aria-label={activeRecording ? 'Recorded backing track player' : 'Chart only player'}>
          <img src={VISUAL_ASSETS.sharedMvp.covers.rainy} alt="Cozy rainy-night jazz practice room" />
          <div className="practice-art-caption"><strong>{chart.title}</strong><span>{formatChartMeta(chart)}</span></div>
          {activeRecording ? <div className="practice-no-audio practice-recorded-controls">
            <strong>Recorded Backing Track</strong>
            <p>{activeRecording.title} · Original recording at {activeRecording.recordedBpm} BPM · {recordingPlaying ? 'Playing' : 'Paused'}</p>
            <label htmlFor="recording-scrubber">Recording position</label>
            <input id="recording-scrubber" type="range" min={0}
              max={recordingDuration > 0 ? recordingDuration : 1}
              step={0.05} value={Math.min(recordingPosition, recordingDuration > 0 ? recordingDuration : 1)}
              disabled={!recordingDuration}
              aria-label="Seek recording"
              onChange={event => seekRecording(Number(event.target.value))} />
            <button type="button" onClick={() => seekRecording(0)}>Restart recording</button>
            <small>Recorded tempo and key are fixed. Chart controls do not modify the sound.</small>
          </div> : <div className="practice-no-audio"><strong>Chart Only · No Recording</strong><p>Backing-track playback and stem mixing are unavailable. Your practice timer works independently.</p></div>}
        </div>
      )}

      {routine && panel === 'chart' && (
        <aside className="practice-guided-head" aria-label="Current guided exercise">
          <strong>{lesson?.title ?? playableStep?.title ?? 'Exercise'}</strong>
          <p>{lesson?.goal ?? 'Follow the exercise and practice at your own pace.'}</p>
        </aside>
      )}
      {routine && (
        <div className="practice-step-controls">
          <button type="button" onClick={() => goStep(-1)} disabled={stepIndex === 0} aria-label="Previous routine step">‹</button>
          <div><strong>Step {stepIndex + 1} of {routine.steps.length}</strong><span>{playableStep?.title ?? 'Exercise'}</span></div>
          <button type="button" className="practice-chart-shortcut" onClick={() => setPanel(current => current === 'chart' ? 'instructions' : 'chart')} aria-label={panel === 'chart' ? 'Show instructions' : 'Show chart'}>{panel === 'chart' ? 'Instructions' : 'Chart'}</button>
          <button type="button" className="practice-next" onClick={() => stepIndex === routine.steps.length - 1 ? finishSession() : goStep(1)}>{stepIndex === routine.steps.length - 1 ? 'Finish' : 'Next Step ›'}</button>
        </div>
      )}

      <div className="practice-transport">
        <div className="practice-timeline" role="progressbar" aria-label="Practice step timer progress"
          aria-valuemin={0} aria-valuemax={targetSeconds || 1} aria-valuenow={Math.min(stepSeconds, targetSeconds || 1)}>
          <span style={{ width: stepProgress + '%' }} />
          <i style={{ left: stepProgress + '%' }} />
        </div>
        <div className="practice-clock"><strong data-testid="session-elapsed">{formatPracticeTime(elapsedSeconds)}</strong><span>{targetSeconds ? formatPracticeTime(targetSeconds) + ' step goal' : (isRunning ? 'Practicing' : elapsedSeconds ? 'Paused' : 'Ready') + (activeRecording ? ' · Recorded track' : ' · No recording')}</span></div>
        <div className="practice-control-row">
          <button className="practice-secondary-transport" type="button" aria-label="Configure loop" onClick={event => openLoop(event.currentTarget)} aria-pressed={loopEnabled}>
            <PracticeToolGlyph name="loop" />
          </button>
          <button className="practice-measure-btn" type="button" aria-label="Previous measure" onClick={() => stepMeasure(-1)}>◀❙</button>
          <button className="practice-timer-button" type="button" onClick={toggleTimer} aria-label={activeRecording ? (recordingPlaying ? 'Pause recording and practice timer' : 'Play recording and start practice timer') : isRunning ? 'Pause practice timer' : (priorMs + stepMs) ? 'Resume practice timer' : 'Start practice timer'}>
            {isRunning ? 'Ⅱ' : '▶'}
            <span className="practice-timer-label">{isRunning ? 'Pause' : (priorMs + stepMs) ? 'Resume' : 'Start'}</span>
          </button>
          <button className="practice-measure-btn" type="button" aria-label="Next measure" onClick={() => stepMeasure(1)}>❙▶</button>
          <button className="practice-secondary-transport" type="button" aria-label="Toggle Chart or Player view"
            onClick={() => setPanel(current => current === 'chart' ? 'player' : 'chart')}>☷</button>
        </div>
        {panel === 'player' && (
          <div className="practice-chart-controls practice-player-pills" id="practice-inline-settings">
            <label>Key<select value={CHROMA[pitchClass(chartKey) ?? 0]} onChange={event => setChartKey(event.target.value)} aria-label="Transpose concert chart key">{CHROMA.map(key => <option key={key} value={key}>{key.replace('b', '♭')}</option>)}</select></label>
            <label>Tempo<select value={tempo} onChange={event => changeTempo(Number(event.target.value))} aria-label="Reference tempo in beats per minute">{[60, 70, 80, 90, 100, 110, 120, 140, 160, 180].concat(chosenExercise?.suggested_bpm ?? []).filter((bpm, index, all) => all.indexOf(bpm) === index).sort((a,b) => a-b).map(bpm => <option key={bpm} value={bpm}>{bpm} BPM</option>)}</select></label>
            <label>Instrument<select value={writtenPitch} onChange={event => setWrittenPitch(event.target.value as WrittenPitch)} aria-label="Transposing instrument"><option value="C">Concert</option><option value="Bb">B♭</option><option value="Eb">E♭</option></select></label>
          </div>
        )}
        <p className="practice-reference-note">{activeRecording ? 'Chart follows the recording. Tempo/key settings do not change the recorded sound.' : 'Play follows the chart visually at the selected BPM; recorded audio is not available.'}</p>
        <button className="practice-finish-action" type="button" onClick={finishSession}>Finish Session</button>
      </div>
      {routine && panel === 'instructions' && lesson && (
        <div className="practice-coach-dock"><GuidedCatCoach key={stepIndex} lesson={lesson} catId={catId} /></div>
      )}
      <div className="practice-utility-row" aria-label="Practice tools">
        <button type="button" disabled title="Mixer is Preview only"><PracticeToolGlyph name="mixer" /><span>Mixer</span><small>Preview</small></button>
        <button type="button" onClick={event => openTool('settings', event.currentTarget)}><PracticeToolGlyph name="tempo" /><span>Tempo/Key</span></button>
        <button type="button" onClick={event => openLoop(event.currentTarget)}
          aria-pressed={loopEnabled}><PracticeToolGlyph name="loop" /><span>Loop</span></button>
        <button type="button" onClick={event => openTool('tuner', event.currentTarget)}><PracticeToolGlyph name="tuner" /><span>Tuner</span></button>
        <button type="button" onClick={event => openTool('metronome', event.currentTarget)}><PracticeToolGlyph name="metronome" /><span>Metronome</span></button>
      </div>
    </section>
    {loopOpen && createPortal(
      <LoopPlanSettings totalBars={chart.bars.length} enabled={loopEnabled} sections={loopSections}
        repeatPlan={repeatWholePlan} onApply={applyLoop} onClose={closeLoop} />,
      document.querySelector('.app-shell') ?? document.body
    )}
    {activeTool && createPortal(
      <div
        ref={toolOverlayRef}
        className="practice-tool-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={activeTool === 'tuner' ? 'Tuner within practice' : activeTool === 'metronome' ? 'Metronome within practice' : 'Tempo and key settings'}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); closeTool(); }
          if (event.key !== 'Tab') return;
          const controls = [...(toolOverlayRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') ?? [])];
          if (!controls.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }}
      >
        {activeTool === 'tuner' ? <TunerPage onClose={closeTool} /> : activeTool === 'metronome' ? <MetronomePage onClose={closeTool} /> : (
          <div className="practice-settings-dialog">
            <header><h2>Tempo &amp; Key</h2><button type="button" onClick={closeTool} aria-label="Close settings and return to session">×</button></header>
            <p>{activeRecording ? 'Set visual chart transposition and reference tempo. The recording remains at its original pitch and speed.' : 'Set chart transposition and your reference practice tempo. No recording is available.'}</p>
      <section className="practice-musical-controls" aria-label="Musical chart controls">
        <div className="practice-control-pair">
          <div className="practice-control-field">
            <label htmlFor="practice-key">Key: {chartKey.replace('b', '♭')}</label>
            <div className="practice-stepper">
              <button type="button" aria-label="Transpose down one semitone" onClick={() => setKeyBySemitone(-1)}>−</button>
              <select id="practice-key" value={chartKey} onChange={event => setChartKey(event.target.value)} aria-label="Concert chart key">
                {CHROMA.map(key => <option key={key} value={key}>{key.replace('b', '♭')}</option>)}
              </select>
              <button type="button" aria-label="Transpose up one semitone" onClick={() => setKeyBySemitone(1)}>+</button>
            </div>
          </div>
          <div className="practice-control-field">
            <label htmlFor="practice-bpm">Tempo: {tempo} BPM</label>
            <div className="practice-stepper">
              <button type="button" aria-label="Decrease tempo" onClick={() => changeTempo(tempo - 1)}>−</button>
              <input id="practice-bpm" type="number" inputMode="numeric" min={40} max={240} step={1}
                value={tempoInput} aria-label="Tempo in beats per minute"
                onChange={event => {
                  const next = event.target.value;
                  setTempoInput(next);
                  if (/^\d+$/.test(next) && Number(next) >= 40 && Number(next) <= 240) changeTempo(Number(next));
                }}
                onBlur={() => changeTempo(Number(tempoInput) || tempo)} />
              <button type="button" aria-label="Increase tempo" onClick={() => changeTempo(tempo + 1)}>+</button>
            </div>
          </div>
        </div>
        <div className="practice-control-pair">
          <div className="practice-control-field">
            <label htmlFor="practice-pitch">Instrument / Written Pitch</label>
            <select id="practice-pitch" value={writtenPitch} onChange={event => setWrittenPitch(event.target.value as WrittenPitch)}>
              <option value="C">Concert</option>
              <option value="Bb">B♭ instrument</option>
              <option value="Eb">E♭ instrument</option>
            </select>
          </div>
          <div className="practice-control-field">
            <span className="practice-control-heading">Loop</span>
            <button type="button" className="practice-loop-open" onClick={event => openLoop(event.currentTarget)} aria-haspopup="dialog">
              <span>{loopSummary}</span><span aria-hidden="true">Edit ›</span>
            </button>
          </div>
        </div>

      </section>
          </div>
        )}
      </div>,
      document.querySelector('.app-shell') ?? document.body
    )}
    </>
  );
}
