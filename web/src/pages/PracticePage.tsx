import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PracticeTimeBadge } from '../components/PracticeMediaControls';
import { ChordGrid } from '../components/ChordGrid';
import { LoopPlanSettings } from '../components/LoopPlanSettings';
import { GuidedCatCoach, GuidedLesson } from '../components/GuidedLesson';
import { normalizeGuidedLesson } from '../lib/guidedLesson';
import { exercisesById } from '../data/seed';
import { getChartById } from '../features/charts/chartRepository';
import { chartBeatAtRecordingTime, hasChartSync, isUsableRecordedTrack, recordingById, recordingTimeForSelectedBar } from '../features/recordings/recordingCatalog';
import { RecordingOnlyPractice } from '../features/recordings/RecordingOnlyPractice';
import { pitchClass } from '../features/charts/chartModel';
import { formatChartMeta } from '../lib/chords';
import { beatsPerMeasure, locateSequencePlayhead, rawChartBeat, sequenceBeatForBar, sequenceDuration } from '../lib/practiceChartClock';
import type { LoopSection } from '../lib/practiceChartClock';
import { resolvePlayableStep } from '../lib/routinePlayback';
import { defaultPlayerSettings, makeSavedExercise, settingsChanged, type RoutineStepOutcome, type RoutineStepOutcomes } from '../lib/routinePlayerSettings';
import { useApp } from '../context/AppContext';
import type { WrittenPitch } from '../types/content';
import { elapsedMilliseconds, formatPracticeTime } from './practicePlayerLogic';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { TunerPage } from './TunerPage';
import { MetronomePage } from './MetronomePage';
import './PracticePage.css';
import './PracticePlayerApproved.css';
import './CleanPixelPractice.css';
import './PracticePlayerPixelV2.css';
import './PracticePlayerReferenceV3.css';
import './PracticePlayerCompactV4.css';
import './PracticePlayerDemoRefresh.css';
import './PracticePlayerPixelDemoIntegration.css';
import './RoutinePlayerRefresh.css';

function displayChartForm(form: string): string {
  const bluesBars = /^blues-(\d+)$/i.exec(form.trim());
  if (bluesBars) return `${bluesBars[1]}-bar Blues`;
  const formBars = /^(\d+)-bar form\b/i.exec(form.trim());
  if (formBars) return `${formBars[1]}-bar form`;
  const namedForm = /^(aaba|abac)-(\d+)$/i.exec(form.trim());
  if (namedForm) return `${namedForm[2]}-bar ${namedForm[1].toUpperCase()}`;
  return form.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

const CHROMA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
type Panel = 'instructions' | 'chart';
type PracticeTool = 'tuner' | 'metronome';
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
type PracticeToolIcon = 'mixer' | 'tuner' | 'metronome';
type PlayerPixelIconName = 'mixer' | 'tuner' | 'metronome' | 'play' | 'pause' | 'repeat' | 'skip-back' | 'skip-forward' | 'step-up' | 'step-down' | 'finish-check';

const PLAYER_PIXEL_ROOT = '/visuals/new-assets/2026-11-07-sharp-pixel/practice-player';
const SHARP_PIXEL_ROOT = '/visuals/new-assets/2026-11-07-sharp-pixel';
const PLAYER_PIXEL_ICONS: Record<PlayerPixelIconName, string> = {
  mixer: `${PLAYER_PIXEL_ROOT}/svg/mixer.svg`,
  tuner: `${PLAYER_PIXEL_ROOT}/svg/tuner.svg`,
  metronome: `${SHARP_PIXEL_ROOT}/refreshed-icons/metronome.png`,
  play: `${PLAYER_PIXEL_ROOT}/svg/play.svg`,
  pause: `${PLAYER_PIXEL_ROOT}/svg/pause.svg`,
  repeat: `${SHARP_PIXEL_ROOT}/approved-isolated-icons/repeat.png`,
  'skip-back': `${PLAYER_PIXEL_ROOT}/svg/skip-back.svg`,
  'skip-forward': `${PLAYER_PIXEL_ROOT}/svg/skip-forward.svg`,
  'step-up': `${PLAYER_PIXEL_ROOT}/svg/step-up.svg`,
  'step-down': `${PLAYER_PIXEL_ROOT}/svg/step-down.svg`,
  'finish-check': `${PLAYER_PIXEL_ROOT}/svg/finish-check.svg`,
};

const MONOCHROME_PLAYER_ICONS: ReadonlySet<PlayerPixelIconName> = new Set([
  'play', 'pause', 'repeat', 'skip-back', 'skip-forward', 'step-up', 'step-down', 'finish-check',
]);

function PlayerPixelIcon({ name, className = 'practice-pixel-icon' }: { name: PlayerPixelIconName; className?: string }) {
  const src = PLAYER_PIXEL_ICONS[name];
  // Monochrome controls inherit their button's semantic text color. Masking the
  // transparent silhouette keeps the pixel edges crisp in both Light and Dark.
  if (MONOCHROME_PLAYER_ICONS.has(name)) {
    return <span className={`${className} practice-pixel-mask`}
      style={{ '--practice-pixel-mask': `url("${src}")` } as CSSProperties}
      aria-hidden="true" />;
  }
  return <img src={src} className={className} alt="" aria-hidden="true" draggable={false} />;
}

function PracticeToolGlyph({ name }: { name: PracticeToolIcon }) {
  return <PlayerPixelIcon name={name} className="practice-tool-glyph practice-pixel-icon" />;
}
export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    charts, exercises, routines, activeRoutineId, addSession, showToast, catId, repo, refreshLocal,
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
  const [stepOutcomes, setStepOutcomes] = useState<RoutineStepOutcomes>({});
  const [stepsOpen, setStepsOpen] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | 'finish' | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [journalOpen, setJournalOpen] = useState(false);
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
  const [panel, setPanel] = useState<Panel>(routine && !playableStep?.chart_id ? 'instructions' : 'chart');
  const [activeTool, setActiveTool] = useState<PracticeTool | null>(null);
  const toolTriggerRef = useRef<HTMLButtonElement | null>(null);
  const toolOverlayRef = useRef<HTMLDivElement | null>(null);
  const [tempo, setTempo] = useState(100);
  const [tempoInput, setTempoInput] = useState('100');
  const recordingLoopRef = useRef<{ start: number; end: number; plays: number; remaining: number }[]>([]);
  const recordingLoopRepeat = useRef(false);
  const recordingLoopIndex = useRef(0);
  const [repeatRecording, setRepeatRecording] = useState(false);

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

  const stepChart = playableStep?.chart_id ? getChartById(playableStep.chart_id, charts) : null;
  const stepHasChart = Boolean(stepChart);
  const instructionsOnly = Boolean(routine && !stepHasChart);
  const stepDefaults = useMemo(
    () => defaultPlayerSettings(stepChart?.concert_key ?? chart.concert_key, chosenExercise?.suggested_bpm, playableStep?.player_settings),
    [stepChart?.concert_key, chart.concert_key, chosenExercise?.suggested_bpm, playableStep?.player_settings],
  );
  const currentSettings = {
    reference_bpm: tempo, chart_key: chartKey, written_pitch: writtenPitch,
    loop_enabled: loopEnabled, loop_sections: loopSections, repeat: repeatWholePlan,
  };
  const editedStepSettings = Boolean(routine && stepHasChart && settingsChanged(currentSettings, stepDefaults));
  const completeCount = Object.values(stepOutcomes).filter(status => status === 'complete').length;
  const isRunning = startedAtMs !== null;
  const currentStepMs = elapsedMilliseconds(stepMs, startedAtMs, nowMs);
  const elapsedSeconds = Math.floor((priorMs + currentStepMs) / 1000);

  const formProgress = routine && routine.steps.length ? Math.round(completeCount / routine.steps.length * 100) : 0;

  useEffect(() => {
    setStepIndex(0);
    setStepOutcomes({});
    setStepsOpen(false);
    setPendingStep(null);
    setJournalOpen(false);
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
    const recordedBpm = recordingById(requestedRecording)?.recordedBpm;
    if (recordedBpm) {
      setTempo(recordedBpm);
      setTempoInput(String(recordedBpm));
    }
  }, [requestedRecording]);

  useEffect(() => {
    if (!activeRecording || !isRunning) return;
    const timer = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const plan = recordingLoopRef.current;
      const section = plan[recordingLoopIndex.current];
      if (section && audio.currentTime >= section.end) {
        if (--section.remaining <= 0) recordingLoopIndex.current++;
        if (recordingLoopIndex.current >= plan.length && recordingLoopRepeat.current) {
          recordingLoopIndex.current = 0;
          plan.forEach(item => { item.remaining = item.plays; });
        }
        const next = plan[recordingLoopIndex.current];
        if (next) audio.currentTime = next.start;
        else { recordingLoopRef.current = []; setLoopEnabled(false); }
      }
      setRecordingPosition(audio.currentTime);
    }, 50);
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
    if (!routine) {
      if (chosenExercise?.suggested_bpm != null) {
        const bpm = Math.max(40, Math.min(240, chosenExercise.suggested_bpm));
        setTempo(bpm);
        setTempoInput(String(bpm));
      }
      return;
    }
    // Loading a step's preset changes only player state, never the source exercise.
    setTempo(stepDefaults.reference_bpm);
    setTempoInput(String(stepDefaults.reference_bpm));
    setChartKey(stepDefaults.chart_key);
    setWrittenPitch(stepDefaults.written_pitch);
    setLoopEnabled(stepDefaults.loop_enabled);
    setLoopSections(stepDefaults.loop_sections.length ? stepDefaults.loop_sections.map(section => ({ ...section }))
      : [{ startBar: 1, endBar: Math.min(stepChart?.bars.length ?? chart.bars.length, 4), plays: 2 }]);
    setRepeatWholePlan(stepDefaults.repeat);
    setPanel(stepHasChart ? 'chart' : 'instructions');
  }, [routine?.id, stepIndex, stepDefaults, stepHasChart]);

  useEffect(() => {
    if (!isRunning || completion) return;
    const timerId = window.setInterval(() => setNowMs(performance.now()), 50);
    return () => window.clearInterval(timerId);
  }, [isRunning, completion]);

  // Repeat remains independent of the section Loop settings: in chart-only mode
  // it repeats the whole chart, while a configured loop repeats its chosen plan.
  const activeSections = loopEnabled && loopSections.length ? loopSections
    : (!activeRecording && repeatWholePlan ? [{ startBar: 1, endBar: chart.bars.length, plays: 1 }] : null);
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
  const loopRange: [number, number] | null = loopEnabled && currentSection ? [currentSection.startBar, currentSection.endBar] : null;
  // Existing chart sections power the recorded-player preview; editing still uses LoopPlanSettings.
  const demoSections = chart.bars.flatMap((bar, index) => bar.section ? [{ label: bar.section, startBar: index + 1 }] : [])
    .filter((item, index, all) => all.findIndex(candidate => candidate.label === item.label) === index);
  const planStatus = activeRecording ? 'Recording plays at its original key and tempo' : playhead.ended ? 'Chart finished'
    : !loopEnabled && repeatWholePlan ? 'Repeating whole chart'
    : currentSection ? 'Section ' + ((playhead.sectionIndex ?? 0) + 1) + ' of ' + activeSections!.length + ' · Pass ' + playhead.pass + ' of ' + currentSection.plays
    : 'Chart once';

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
    loopTriggerRef.current = trigger;
    setLoopOpen(true);
  }

  function closeLoop() {
    setLoopOpen(false);
    requestAnimationFrame(() => loopTriggerRef.current?.focus());
  }

  function applyLoop(enabled: boolean, sections: LoopSection[], repeatPlan: boolean) {
    const now = performance.now();
    if (activeRecording) {
      recordingLoopIndex.current = 0;
      recordingLoopRepeat.current = repeatPlan;
      recordingLoopRef.current = enabled ? sections.map(section => {
        const start = recordingTimeForSelectedBar(section.startBar - 1, audioRef.current?.currentTime ?? 0, activeRecording, chart.time_signature, chart.bars.length);
        const end = start + (section.endBar - section.startBar + 1) * chart.time_signature[0] * 240 / (activeRecording.recordedBpm * chart.time_signature[1]);
        return { start, end: Math.min(end, recordingDuration), plays: section.plays, remaining: section.plays };
      }) : [];
      if (enabled && recordingLoopRef.current[0]) seekRecording(recordingLoopRef.current[0].start);
    }
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
    const next = Math.max(0, Math.min(seconds, duration > 0 ? duration : 0));
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

  // Keep a time-based transport even in chart-only mode, without pretending
  // that a backing-track recording exists. The chart follower is the clock.
  const chartSecondsPerBeat = 240 / (tempo * chart.time_signature[1]);
  const chartSequenceSeconds = sequenceDuration(chart, activeSections) * chartSecondsPerBeat;
  const chartPositionSeconds = Math.min(chartSequenceSeconds, (repeatWholePlan && chartSequenceSeconds > 0
    ? playhead.sequenceBeat * chartSecondsPerBeat % chartSequenceSeconds
    : playhead.sequenceBeat * chartSecondsPerBeat));

  function seekChartSeconds(seconds: number) {
    const now = performance.now();
    const clamped = Math.max(0, Math.min(chartSequenceSeconds, seconds));
    setMusicalClock({ chartBeat: clamped / chartSecondsPerBeat, startedAtMs: isRunning ? now : null });
    setNowMs(now);
  }

  function stepMeasure(delta: number) {
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

  function goStep(next: number | 'finish') {
    if (!routine) return;
    setPendingStep(null);
    setStepsOpen(false);
    if (next === 'finish') { finishSession(); return; }
    if (next === stepIndex || next < 0 || next >= routine.steps.length) return;
    // Stop audio before changing chart/step, while preserving accumulated practice time.
    suppressAudioPauseRef.current = true;
    audioRef.current?.pause();
    const now = performance.now();
    setPriorMs(value => value + elapsedMilliseconds(stepMs, startedAtMs, now));
    setStepMs(0);
    setStartedAtMs(null);
    setNowMs(now);
    setStepIndex(next);
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
    suppressAudioPauseRef.current = false;
  }

  function requestStep(next: number | 'finish') {
    if (!routine || next === stepIndex) return;
    if (editedStepSettings) {
      setCustomTitle((playableStep?.title ?? 'Exercise') + ' (custom)');
      setPendingStep(next);
      setStepsOpen(false);
      return;
    }
    goStep(next);
  }

  function saveEditedExerciseAndContinue() {
    if (pendingStep === null || !customTitle.trim()) return;
    try {
      const exercise = makeSavedExercise(
        chosenExercise, customTitle, playableStep?.instructions ?? '', playableStep?.chart_id ?? null,
        currentStep?.duration_minutes ?? playableStep?.duration_minutes ?? 5, currentSettings,
      );
      repo.saveLocalExercise(exercise);
      refreshLocal();
      showToast('Saved as a new exercise in My Exercises on this device.');
      goStep(pendingStep);
    } catch {
      showToast('Could not save the customized exercise. Your settings are still here.');
    }
  }

  function updateOutcome(value: RoutineStepOutcome | '') {
    setStepOutcomes(previous => {
      const next = { ...previous };
      if (value) next[stepIndex] = value;
      else delete next[stepIndex];
      return next;
    });
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
            JSON.stringify({ notes: savedNotes, rating: savedRating, routineStepOutcomes: routine ? stepOutcomes : undefined }),
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
    setStepOutcomes({});
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

  const journalControl = (
    <button className="practice-demo-journal" type="button" aria-label="Session journal"
      onClick={() => setJournalOpen(true)} title="Practice journal">
      <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18M10.5 8h6M10.5 12h6M10.5 16h4"/>
      </svg>
    </button>
  );

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
    <section className={`practice-player ${routine ? 'practice-guided' : 'practice-free'} ${activeRecording ? 'practice-has-recording' : ''} ${routine && panel === 'instructions' ? 'practice-instructions' : ''} ${instructionsOnly ? 'practice-routine-instruction-only' : ''} practice-unified ${activeRecording ? 'practice-demo-refresh' : ''}`} aria-label="Shared practice player">
      {activeRecording ? (
      <header className="practice-player-head">
        <button className="practice-back" type="button" onClick={() => navigate('/practice')} aria-label="Back to Practice">‹</button>
        <div className="practice-title-group">
          <h1>{routine?.title ?? chart.title}</h1>
          <p>{routine
            ? 'Step ' + (stepIndex + 1) + ' of ' + routine.steps.length + ' · ' + (playableStep?.title ?? 'Exercise')
            : formatChartMeta(chart) + ' · Key ' + chart.concert_key.replace('b', '♭')}</p>
          {chart.style_instruction && <p className="practice-chart-style">{chart.style_instruction}</p>}
        </div>
        {activeRecording && <button type="button" className="practice-demo-chart-pencil"
          aria-label="Chart notes (planned)" title="Chart notes: coming later"
          onClick={() => showToast("Chart annotations are planned. Your chart has not been changed.")}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 16 11-11 4 4-11 11-5 1 1-5Z"/><path d="m13.5 6.5 4 4"/>
          </svg>
        </button>}
      </header>
      ) : (
        <>
      <header className="practice-player-head">
        <button className="practice-back" type="button" onClick={() => navigate('/practice')} aria-label="Back to Practice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg>
        </button>
        <span className="practice-page-heading">Practice</span>
        {!instructionsOnly && <div className="practice-header-actions">
          <details className="practice-header-more">
            <summary aria-label="More practice options" title="More practice options">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
            </summary>
            <div className="practice-more-panel">
              <label htmlFor="practice-instrument">Transposing instrument</label>
              <select id="practice-instrument" value={writtenPitch} onChange={event => setWrittenPitch(event.target.value as WrittenPitch)}
                aria-label="Transposing instrument">
                <option value="C">Concert</option><option value="Bb">B♭</option><option value="Eb">E♭</option>
              </select>
              <div className="practice-measure-jump" role="group" aria-label="Measure navigation">
                <button type="button" onClick={() => stepMeasure(-1)}>Previous measure</button>
                <button type="button" onClick={() => stepMeasure(1)}>Next measure</button>
              </div>
              <p>{formatChartMeta(chart)} · Key {chart.concert_key.replace('b', '♭')}</p>
              {!chart.is_custom && chart.style_instruction && <p>{chart.style_instruction}</p>}
              <p>{activeRecording ? 'Recorded audio plays at its original speed and pitch.' : 'Chart-only practice follows the selected BPM; no recording is attached.'}</p>
            </div>
          </details>
        </div>}
      </header>
      <div className="practice-title-group">
        <h1>{routine?.title ?? chart.title}</h1>
        <div className="practice-chart-tags" aria-label="Chart details">
          <span>{routine ? 'Guided Practice' : chart.feel ? chart.feel.charAt(0).toUpperCase() + chart.feel.slice(1) : 'Practice chart'}</span>
          <span>{routine ? 'Step ' + (stepIndex + 1) + ' of ' + routine.steps.length : chart.difficulty || 'All levels'}</span>
          {(!routine || stepHasChart) && <span>{displayChartForm(chart.form) || chart.time_signature.join('/')}</span>}
        </div>
        {(!routine || stepHasChart) && chart.is_custom && chart.style_instruction && <p className="practice-chart-style">{chart.style_instruction}</p>}
      </div>
        </>
      )}

      {activeRecording && <audio
        key={activeRecording.id} ref={audioRef} src={activeRecording.src} preload="metadata" loop={repeatRecording}
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
      <p className="practice-audio-state" data-testid="chart-playhead" title={instructionsOnly ? 'Instructions-only exercise' : planStatus}>
        {instructionsOnly ? <><strong>Instructions only</strong> · Practice at your own pace</> :
          <><strong>{activeRecording ? 'Recorded Track' : 'Chart Only'}</strong> · Bar {playhead.barIndex + 1} · Beat {Math.floor(playhead.beatInBar) + 1} · {activeRecording ? activeRecording.recordedBpm + ' BPM audio' : 'No recording'}</>}
      </p>
      {activeRecording && recordingError && <p role="alert" className="practice-recording-error">{recordingError}</p>}

      {routine && <>
        <div className="practice-routine-overview-bar">
          <span>{completeCount} of {routine.steps.length} exercises completed</span>
          <button type="button" onClick={() => setStepsOpen(true)} aria-label="View all routine exercises">All steps ☷</button>
        </div>
        <div className="practice-guided-progress" role="progressbar" aria-label="Completed routine exercises"
          aria-valuemin={0} aria-valuemax={routine.steps.length} aria-valuenow={completeCount}>
          <span style={{ width: formProgress + '%' }} />
        </div>
      </>}

      {routine && stepHasChart && <div className="practice-segments" role="tablist" aria-label={routine ? 'Guided practice views' : 'Player view'}>
        {routine && <button type="button" role="tab" aria-controls="practice-instructions-panel" aria-selected={panel === 'instructions'} onClick={() => setPanel('instructions')} className={panel === 'instructions' ? 'selected' : undefined}>Instructions</button>}
        <button type="button" role="tab" aria-selected={panel === 'chart'} onClick={() => setPanel('chart')} className={panel === 'chart' ? 'selected' : undefined}>Chart</button>
      </div>}

      {routine && lesson && (instructionsOnly || panel === 'instructions') ? (
        <div id="practice-instructions-panel" className="practice-lesson-panel" role="tabpanel" aria-label="Instructions">
          <GuidedLesson key={stepIndex} lesson={lesson} stepIndex={stepIndex} totalSteps={routine.steps.length} />
        </div>
      ) : (
        <div className="practice-notation-panel" role="tabpanel" aria-label="Jazz chord chart">

          <div className={`practice-chart-scroll practice-chart-all ${chart.bars.length > 16 ? 'chart-dense' : 'chart-standard'}`}
            aria-label={`Complete chord chart, ${chart.bars.length} measures`}>
            <ChordGrid chart={chart} chartKey={chartKey} writtenPitch={writtenPitch}
              selectedBar={playhead.barIndex} activeBar={playhead.barIndex}
              activeEventIndex={playhead.eventIndex} loopRange={loopRange}
              onSelectBar={moveToBar} showSectionLabels practiceSheet />
          </div>

        </div>
      )}

      {routine && stepHasChart && panel === 'chart' && (
        <aside className="practice-guided-head" aria-label="Current guided exercise">
          <strong>{lesson?.title ?? playableStep?.title ?? 'Exercise'}</strong>
          <p>{lesson?.goal ?? 'Follow the exercise and practice at your own pace.'}</p>
        </aside>
      )}
      {routine && <>
        <div className="practice-step-controls">
          <button type="button" onClick={() => requestStep(stepIndex - 1)} disabled={stepIndex === 0} aria-label="Previous routine step">‹</button>
          <div><strong>Step {stepIndex + 1} of {routine.steps.length}</strong><span>{playableStep?.title ?? 'Exercise'} · {currentStep?.duration_minutes ?? playableStep?.duration_minutes ?? 0} min goal</span></div>
          {stepHasChart && <button type="button" className="practice-chart-shortcut" onClick={() => setPanel(current => current === 'chart' ? 'instructions' : 'chart')} aria-label={panel === 'chart' ? 'Show instructions' : 'Show chart'}>{panel === 'chart' ? 'Instructions' : 'Chart'}</button>}
          <button type="button" className="practice-next" onClick={() => requestStep(stepIndex === routine.steps.length - 1 ? 'finish' : stepIndex + 1)}>{stepIndex === routine.steps.length - 1 ? 'Finish Routine' : 'Next Step ›'}</button>
        </div>
        <div className="practice-routine-outcome" aria-label="Exercise completion">
          <button type="button" className={stepOutcomes[stepIndex] === 'complete' ? 'selected' : ''}
            aria-pressed={stepOutcomes[stepIndex] === 'complete'}
            onClick={() => updateOutcome(stepOutcomes[stepIndex] === 'complete' ? '' : 'complete')}>
            ✓ {stepOutcomes[stepIndex] === 'complete' ? 'Completed' : 'Mark Complete'}
          </button>
          <label>
            <span className="sr-only">Exercise outcome</span>
            <select aria-label="Exercise outcome" value={stepOutcomes[stepIndex] ?? ''}
              onChange={event => updateOutcome(event.target.value as RoutineStepOutcome | '')}>
              <option value="">Not marked</option>
              <option value="complete">Complete</option>
              <option value="needs-work">Needs work</option>
              <option value="skipped">Skipped</option>
            </select>
          </label>
        </div>
      </>}

      {instructionsOnly ? (
        <section className="practice-routine-tools-only" aria-label="Instructions-only practice tools">
          <button type="button" className="practice-routine-timer" onClick={togglePracticeClock}
            aria-label={isRunning ? 'Pause practice timer' : (priorMs + stepMs) ? 'Resume practice timer' : 'Start practice timer'}>
            <PlayerPixelIcon name={isRunning ? 'pause' : 'play'} />
            {isRunning ? 'Pause practice timer' : (priorMs + stepMs) ? 'Resume practice timer' : 'Start practice timer'}
          </button>
          <div className="practice-utility-row practice-routine-simple-tools" aria-label="Practice tools">
            <button type="button" onClick={event => openTool('metronome', event.currentTarget)}>
              <PracticeToolGlyph name="metronome" /><span>Metronome</span>
            </button>
            <button type="button" onClick={event => openTool('tuner', event.currentTarget)}>
              <PracticeToolGlyph name="tuner" /><span>Tuner</span>
            </button>
          </div>
          <div className="practice-session-row">
            <PracticeTimeBadge seconds={elapsedSeconds} running={isRunning} />
            <div className="practice-routine-session-actions">
              <button className="practice-finish-action" type="button" onClick={finishSession}>
                <PlayerPixelIcon name="finish-check" /><span>Finish Session</span>
              </button>
              {journalControl}
            </div>
          </div>
        </section>
      ) : activeRecording ? (
      <div className="practice-transport">
        {activeRecording && <div className="practice-recording-seek">
          <input id="recording-scrubber" type="range" min={0} max={recordingDuration || 1}
            step={0.05} value={Math.min(recordingPosition, recordingDuration || 1)} disabled={!recordingDuration}
            aria-label="Seek recording" onChange={event => seekRecording(Number(event.target.value))} />
          <div className="practice-recording-times">{formatPracticeTime(Math.floor(recordingPosition))} / {formatPracticeTime(Math.floor(recordingDuration))}</div>
        </div>}
        <div className="practice-control-row">
          <button className="practice-measure-btn" type="button"
            aria-label={activeRecording ? 'Back 10 seconds' : 'Previous measure'}
            onClick={() => activeRecording ? seekRecording((audioRef.current?.currentTime ?? 0) - 10) : stepMeasure(-1)}>
            {activeRecording ? <PlayerPixelIcon name="skip-back" /> : '◀❙'}
          </button>
          <button className="practice-timer-button" type="button" onClick={toggleTimer}
            aria-label={activeRecording ? (recordingPlaying ? 'Pause recording' : 'Play recording') : isRunning ? 'Pause practice timer' : (priorMs + stepMs) ? 'Resume practice timer' : 'Start practice timer'}>
            <PlayerPixelIcon name={(activeRecording ? recordingPlaying : isRunning) ? "pause" : "play"} className="practice-pixel-icon practice-play-pixel" />
          </button>
          <button className="practice-measure-btn" type="button"
            aria-label={activeRecording ? 'Forward 10 seconds' : 'Next measure'}
            onClick={() => activeRecording ? seekRecording((audioRef.current?.currentTime ?? 0) + 10) : stepMeasure(1)}>
            {activeRecording ? <PlayerPixelIcon name="skip-forward" /> : '❙▶'}
          </button>
          <button className="practice-secondary-transport" type="button"
            aria-label={activeRecording ? 'Repeat recording' : 'Configure loop'}
            aria-pressed={activeRecording ? repeatRecording : loopEnabled}
            onClick={event => activeRecording ? setRepeatRecording(value => !value) : openLoop(event.currentTarget)}>
            <PlayerPixelIcon name="repeat" />
          </button>
        </div>

            <div className="practice-demo-settings" id="practice-inline-settings" aria-label="Playback settings">
              <div className="practice-demo-setting practice-demo-bpm">
                <label htmlFor="practice-demo-bpm">BPM</label>
                <div className="practice-demo-input-stepper">
                  <input id="practice-demo-bpm" aria-label="Reference tempo in beats per minute" type="number" min={40} max={240}
                    value={tempoInput} onChange={event => { setTempoInput(event.target.value); if (+event.target.value >= 40 && +event.target.value <= 240) changeTempo(+event.target.value); }}
                    onBlur={() => changeTempo(+tempoInput || tempo)} />
                  <div className="practice-demo-updown">
                    <button type="button" aria-label="Increase reference BPM" onClick={() => changeTempo(tempo + 1)}>⌃</button>
                    <button type="button" aria-label="Decrease reference BPM" onClick={() => changeTempo(tempo - 1)}>⌄</button>
                  </div>
                </div>
              </div>
              <div className="practice-demo-setting practice-demo-key">
                <label htmlFor="practice-demo-key">Key</label>
                <div className="practice-demo-input-stepper">
                  <select id="practice-demo-key" value={CHROMA[pitchClass(chartKey) ?? 0]} onChange={event => setChartKey(event.target.value)}
                    aria-label="Transpose concert chart key">{CHROMA.map(key => <option key={key} value={key}>{key.replace('b', '♭')}</option>)}</select>
                  <div className="practice-demo-updown">
                    <button type="button" aria-label="Increase chart key by semitone" onClick={() => setChartKey(CHROMA[((pitchClass(chartKey) ?? 0) + 1) % 12])}>⌃</button>
                    <button type="button" aria-label="Decrease chart key by semitone" onClick={() => setChartKey(CHROMA[((pitchClass(chartKey) ?? 0) + 11) % 12])}>⌄</button>
                  </div>
                </div>
              </div>
              <label className="practice-demo-setting practice-demo-instrument" htmlFor="practice-demo-instrument">
                <span>Instrument</span>
                <select id="practice-demo-instrument" value={writtenPitch} onChange={event => setWrittenPitch(event.target.value as WrittenPitch)}
                  aria-label="Transposing instrument"><option value="C">Concert</option><option value="Bb">B♭</option><option value="Eb">E♭</option></select>
              </label>
              <button type="button" className="practice-demo-original"
                aria-label="Reset reference BPM to original recording tempo"
                onClick={() => { changeTempo(activeRecording.recordedBpm); setChartKey(chart.concert_key); }}>Original</button>
            </div>
            <p className="practice-reference-note practice-demo-audio-note">Reference BPM and chart key only; audio stays at its original speed and pitch.</p>
            <section className="practice-demo-loop" aria-label="Loop sections preview">
              <strong className="practice-demo-loop-title">Loop</strong>
              <div className="practice-demo-loop-items">
                <button type="button" className={`practice-demo-loop-part ${!loopEnabled ? 'selected' : ''}`}
                  aria-label="Edit whole-tune loop settings" title="Configure in loop settings"
                  onClick={event => openLoop(event.currentTarget)}>
                  <span>Whole</span><span className="practice-demo-count"><b>{repeatWholePlan && loopEnabled ? '∞' : '1×'}</b><i aria-hidden="true">⌃<em>⌄</em></i></span>
                </button>
                {demoSections.map(section => {
                  const configured = loopEnabled ? loopSections.find(item => item.startBar === section.startBar) : null;
                  return <button key={section.label} type="button" className={`practice-demo-loop-part ${configured ? "selected" : ""}`}
                    aria-label={`Edit ${section.label} repeat count in loop settings`} title="Configure in loop settings"
                    onClick={event => openLoop(event.currentTarget)}>
                    <span>{section.label}</span><span className="practice-demo-count"><b>{configured?.plays ?? 1}×</b><i aria-hidden="true">⌃<em>⌄</em></i></span>
                  </button>;
                })}
                <button type="button" className="practice-demo-add-section" title="Open existing loop plan editor to add a section"
                  onClick={event => openLoop(event.currentTarget)}>+ Section</button>
              </div>
            </section>
            <div className="practice-utility-row practice-demo-tools" aria-label="Practice tools">
              <div className="practice-demo-metronome-wrap">
                <button className="practice-demo-tool-main" type="button" onClick={event => openTool('metronome', event.currentTarget)}>
                  <PracticeToolGlyph name="metronome" /><span>Metronome</span>
                </button>
                <button className="practice-demo-metronome-switch" type="button"
                  aria-label="Open Metronome to start or stop it. Chart quick toggle is not implemented yet."
                  title="Quick on/off is planned. Use Metronome settings for now."
                  onClick={event => openTool('metronome', event.currentTarget)}>Off <span aria-hidden="true" className="practice-demo-switch-knob" /></button>
              </div>
              <button type="button" onClick={event => openTool('tuner', event.currentTarget)}>
                <PracticeToolGlyph name="tuner" /><span>Tuner</span>
              </button>
              {!routine && <button type="button" disabled title="Mixer is Preview only">
                <PracticeToolGlyph name="mixer" /><span>Mixer</span><small>Preview</small>
              </button>}
            </div>
            <div className="practice-session-row practice-demo-session-row">
              <PracticeTimeBadge seconds={elapsedSeconds} running={isRunning} />
              <div className="practice-demo-session-actions">
                <button className="practice-finish-action" type="button" onClick={finishSession}><span aria-hidden="true">✓</span> Finish Session</button>
                {journalControl}
              </div>
            </div>
      </div>
      ) : (
      <div className="practice-transport">
        {activeRecording ? (
          <div className="practice-recording-seek">
            <input id="recording-scrubber" type="range" min={0} max={recordingDuration || 1}
              step={0.05} value={Math.min(recordingPosition, recordingDuration || 1)} disabled={!recordingDuration}
              aria-label="Seek recording" onChange={event => seekRecording(Number(event.target.value))} />
            <div className="practice-recording-times">
              <span>{formatPracticeTime(Math.floor(recordingPosition))}</span>
              <span>{formatPracticeTime(Math.floor(recordingDuration))}</span>
            </div>
          </div>
        ) : (
          <div className="practice-chart-seek">
            <input type="range" min={0} max={Math.max(1, chartSequenceSeconds)}
              step={0.25} value={chartPositionSeconds} aria-label="Seek within chord chart practice"
              onChange={event => seekChartSeconds(Number(event.target.value))} />
            <div className="practice-recording-times">
              <span>{formatPracticeTime(Math.floor(chartPositionSeconds))}</span>
              <span>−{formatPracticeTime(Math.ceil(Math.max(0, chartSequenceSeconds - chartPositionSeconds)))}</span>
            </div>
          </div>
        )}
        <div className="practice-control-row" role="group" aria-label="Playback and chart navigation">
          <button className="practice-measure-btn" type="button"
            aria-label="Back 10 seconds"
            onClick={() => activeRecording ? seekRecording((audioRef.current?.currentTime ?? 0) - 10) : seekChartSeconds(chartPositionSeconds - 10)}>
            <PlayerPixelIcon name="skip-back" /><span>10s</span>
          </button>
          <button className="practice-loop-control" type="button"
            aria-label="Configure loop" aria-pressed={loopEnabled}
            onClick={event => openLoop(event.currentTarget)}>Loop</button>
          <button className="practice-timer-button" type="button" onClick={toggleTimer}
            aria-label={activeRecording ? (recordingPlaying ? 'Pause recording' : 'Play recording') : isRunning ? 'Pause practice timer' : (priorMs + stepMs) ? 'Resume practice timer' : 'Start practice timer'}>
            <PlayerPixelIcon name={(activeRecording ? recordingPlaying : isRunning) ? 'pause' : 'play'} className="practice-pixel-icon practice-play-pixel" />
          </button>
          <button className="practice-secondary-transport practice-repeat-control" type="button"
            aria-label="Repeat playback"
            aria-pressed={activeRecording ? repeatRecording : repeatWholePlan}
            onClick={() => activeRecording ? setRepeatRecording(value => !value) : setRepeatWholePlan(value => !value)}>
            <PlayerPixelIcon name="repeat" /><span>Repeat</span>
          </button>
          <button className="practice-measure-btn" type="button"
            aria-label="Forward 10 seconds"
            onClick={() => activeRecording ? seekRecording((audioRef.current?.currentTime ?? 0) + 10) : seekChartSeconds(chartPositionSeconds + 10)}>
            <PlayerPixelIcon name="skip-forward" /><span>10s</span>
          </button>
        </div>
        <div className="practice-chart-controls practice-player-pills" id="practice-inline-settings" aria-label="Musical settings">
          <div className="practice-bpm-field">
            <label htmlFor="practice-bpm-value">BPM</label>
            <div className="bpm-stepper">
              <input id="practice-bpm-value" aria-label="Reference tempo in beats per minute"
                type="number" min={40} max={240} value={tempoInput}
                onChange={event => {
                  setTempoInput(event.target.value);
                  if (+event.target.value >= 40 && +event.target.value <= 240) changeTempo(+event.target.value);
                }} onBlur={() => changeTempo(+tempoInput || tempo)} />
              <div className="practice-stepper-arrows">
                <button type="button" aria-label="Increase reference BPM" onClick={() => changeTempo(tempo + 1)}><PlayerPixelIcon name="step-up" /></button>
                <button type="button" aria-label="Decrease reference BPM" onClick={() => changeTempo(tempo - 1)}><PlayerPixelIcon name="step-down" /></button>
              </div>
            </div>
          </div>
          <div className="practice-key-field">
            <label htmlFor="practice-concert-key">Key</label>
            <div className="practice-key-stepper">
              <select id="practice-concert-key" value={CHROMA[pitchClass(chartKey) ?? 0]}
                onChange={event => setChartKey(event.target.value)} aria-label="Transpose concert chart key">
                {CHROMA.map(key => <option key={key} value={key}>{key.replace('b', '♭')}</option>)}
              </select>
              <div className="practice-stepper-arrows">
                <button type="button" aria-label="Raise concert key one semitone"
                  onClick={() => setChartKey(CHROMA[((pitchClass(chartKey) ?? 0) + 1) % CHROMA.length])}><PlayerPixelIcon name="step-up" /></button>
                <button type="button" aria-label="Lower concert key one semitone"
                  onClick={() => setChartKey(CHROMA[((pitchClass(chartKey) ?? 0) + CHROMA.length - 1) % CHROMA.length])}><PlayerPixelIcon name="step-down" /></button>
              </div>
            </div>
          </div>
          <button type="button" className="practice-original-reset" onClick={() => {
            changeTempo(chosenExercise?.suggested_bpm ?? 100);
            setChartKey(chart.concert_key);
          }}>Original</button>

        </div>
        <p className="practice-reference-note">{activeRecording
          ? 'BPM and key are chart references. Recorded audio keeps its original speed and pitch.'
          : 'The chart follows your chosen BPM. No recording is attached.'}</p>
      </div>
      )}
      {!activeRecording && !instructionsOnly && (
        <>
      <div className="practice-utility-row" aria-label="Practice tools">
        <button type="button" onClick={event => openTool('metronome', event.currentTarget)}>
          <PracticeToolGlyph name="metronome" /><span>Metronome</span>
        </button>
        <button type="button" onClick={event => openTool('tuner', event.currentTarget)}>
          <PracticeToolGlyph name="tuner" /><span>Tuner</span>
        </button>
        {!routine && <button type="button" disabled title="Mixer is Preview only">
          <PracticeToolGlyph name="mixer" /><span>Mixer</span><small>Preview</small>
        </button>}
      </div>
      <div className="practice-session-row">
        <PracticeTimeBadge seconds={elapsedSeconds} running={isRunning} />
        {routine ? (
          <div className="practice-routine-session-actions">
            <button className="practice-finish-action" type="button" onClick={finishSession}>
              <PlayerPixelIcon name="finish-check" /><span>Finish Session</span>
            </button>
            {journalControl}
          </div>
        ) : (
          <button className="practice-finish-action" type="button" onClick={finishSession}>
            <PlayerPixelIcon name="finish-check" /><span>Finish Session</span>
          </button>
        )}
      </div>
        </>
      )}
      {routine && panel === 'instructions' && lesson && (
        <div className="practice-coach-dock"><GuidedCatCoach key={stepIndex} lesson={lesson} catId={catId} /></div>
      )}

    </section>
    {stepsOpen && routine && createPortal(
      <div className="practice-routine-dialog-backdrop" onClick={() => setStepsOpen(false)}>
        <section className="practice-routine-dialog" role="dialog" aria-modal="true" aria-label="Routine exercise overview"
          onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setStepsOpen(false); }}>
          <header><h2>{routine.title}</h2><button type="button" onClick={() => setStepsOpen(false)} autoFocus aria-label="Close routine overview">×</button></header>
          <p>{completeCount} of {routine.steps.length} completed. Select an exercise to jump to it.</p>
          <div className="practice-routine-step-list">
            {routine.steps.map((step, index) => {
              const playable = resolvePlayableStep(step, exercises, exercisesById);
              const outcome = stepOutcomes[index];
              return <button type="button" key={index} className={index === stepIndex ? 'current' : ''}
                aria-current={index === stepIndex ? 'step' : undefined}
                onClick={() => { setStepsOpen(false); requestStep(index); }}>
                <span className="practice-routine-step-number">{index + 1}</span>
                <span className="practice-routine-step-summary"><strong>{playable.title}</strong>
                  <small>{step.duration_minutes} min · {playable.chart_id ? 'Chart' : 'Instructions'}</small></span>
                <span className="practice-routine-step-state">{outcome === 'complete' ? '✓ Done' : outcome === 'needs-work' ? 'Needs work' : outcome === 'skipped' ? 'Skipped' : index === stepIndex ? 'Current' : 'Not marked'}</span>
              </button>;
            })}
          </div>
        </section>
      </div>, document.querySelector('.app-shell') ?? document.body
    )}
    {pendingStep !== null && createPortal(
      <div className="practice-routine-dialog-backdrop">
        <section className="practice-routine-dialog" role="dialog" aria-modal="true" aria-label="Save modified exercise settings"
          onKeyDown={event => { if (event.key === 'Escape') setPendingStep(null); }}>
          <header><h2>Save your changes?</h2><button type="button" onClick={() => setPendingStep(null)} aria-label="Cancel changing exercises">×</button></header>
          <p>You changed this exercise's player settings. The original routine will remain unchanged.</p>
          <div className="practice-routine-change-summary">
            <span>BPM: {stepDefaults.reference_bpm} → {tempo}</span>
            <span>Key: {stepDefaults.chart_key} → {chartKey}</span>
            <span>Loop and instrument settings are included when you save.</span>
          </div>
          <label className="practice-routine-save-label">New exercise name
            <input type="text" maxLength={100} value={customTitle} onChange={event => setCustomTitle(event.target.value)} />
          </label>
          <button type="button" className="practice-routine-primary" disabled={!customTitle.trim()}
            onClick={saveEditedExerciseAndContinue}>Save as New Exercise</button>
          <button type="button" className="practice-routine-secondary" onClick={() => { const next = pendingStep; setPendingStep(null); if (next !== null) goStep(next); }}>Continue Without Saving</button>
          <button type="button" className="practice-routine-link" onClick={() => setPendingStep(null)}>Keep practicing</button>
        </section>
      </div>, document.querySelector('.app-shell') ?? document.body
    )}
    {journalOpen && createPortal(
      <div className="practice-routine-dialog-backdrop" onClick={() => setJournalOpen(false)}>
        <section className="practice-routine-dialog" role="dialog" aria-modal="true" aria-label="Session journal"
          onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setJournalOpen(false); }}>
          <header><h2>Practice journal</h2><button type="button" onClick={() => setJournalOpen(false)} aria-label="Close journal">×</button></header>
          <p>What went well? What needs more work? Your notes will be saved when you finish the session.</p>
          <label className="practice-routine-save-label">Session notes
            <textarea rows={6} maxLength={500} value={notes}
              onChange={event => setNotes(event.target.value)} placeholder="Add a quick note…" autoFocus />
          </label>
          <button type="button" className="practice-routine-primary" onClick={() => setJournalOpen(false)}>Done</button>
        </section>
      </div>, document.querySelector('.app-shell') ?? document.body
    )}
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
        aria-label={activeTool === 'tuner' ? 'Tuner within practice' : activeTool === 'metronome' ? 'Metronome within practice' : 'Metronome within practice'}
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
        {activeTool === 'tuner' ? <TunerPage onClose={closeTool} /> : <MetronomePage onClose={closeTool} />}
      </div>,
      document.querySelector('.app-shell') ?? document.body
    )}
    </>
  );
}
