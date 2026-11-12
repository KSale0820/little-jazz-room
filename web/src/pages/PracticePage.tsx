import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PracticeTimeBadge, SkipTenIcon, RepeatIcon, PauseIcon } from '../components/PracticeMediaControls';
import { FreePracticeSessionBar } from '../components/FreePracticeSessionBar';
import { ChordGrid } from '../components/ChordGrid';
import { LoopPlanSettings } from '../components/LoopPlanSettings';
import { GuidedLesson } from '../components/GuidedLesson';
import { normalizeGuidedLesson } from '../lib/guidedLesson';
import { routineStepChartSections } from '../lib/routineStepChords';
import { exercisesById } from '../data/seed';
import { getChartById } from '../features/charts/chartRepository';
import { chartBeatAtRecordingTime, hasChartSync, isUsableRecordedTrack, recordingById, recordingTimeForSelectedBar } from '../features/recordings/recordingCatalog';
import { RecordingOnlyPractice } from '../features/recordings/RecordingOnlyPractice';
import { pitchClass } from '../features/charts/chartModel';
import { formatChartMeta } from '../lib/chords';
import { beatsPerMeasure, locateSequencePlayhead, rawChartBeat, sequenceBeatForBar, sequenceDuration } from '../lib/practiceChartClock';
import type { LoopSection } from '../lib/practiceChartClock';
import { resolvePlayableStep } from '../lib/routinePlayback';
import { defaultPlayerSettings, makeSavedExercise, settingsChanged, toggleRoutineCheck, type RoutineStepOutcomes } from '../lib/routinePlayerSettings';
import { useApp } from '../context/AppContext';
import type { WrittenPitch } from '../types/content';
import { elapsedMilliseconds, formatPracticeTime } from './practicePlayerLogic';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { TunerPage } from './TunerPage';
import { useAuth } from '../context/AuthContext';
import { localStorageScopeForUser } from '../repository/localRepository';
import { ChartAnnotationSheet, SessionJournalSheet, AddPracticeSectionSheet } from '../components/PracticePlayerSheets';
import { PracticeMetronomeSheet } from '../components/PracticeMetronomeSheet';
import { PracticeInlineLoop, ControlChevron } from '../components/PracticeInlineLoop';
import { usePracticeMetronome } from '../lib/usePracticeMetronome';
import { readLocalList, persistLocalList, notesKey, journalKey, chartAnnotationDisplay } from '../lib/practicePlayerNotes';
import type { ChartNote, PracticeJournalEntry } from '../lib/practicePlayerNotes';
import { getPlayerLoopOptions, sectionRepeatProgram, programPlays } from '../lib/practiceLoopProgram';
import type { CustomPracticeSection } from '../lib/practiceLoopProgram';
import './PracticePage.css';
import './PracticePlayerApproved.css';
import './PracticePlayerDemoRefresh.css';
import './RoutineClassDemo.css';
import './RoutineCompactV2.css';
import './RoutineFooterV3.css';
import './RoutineStepChords.css';
import './RoutineFooterV4.css';

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
  chartTitle?: string;
  recordingTitle?: string;
  routineOutcomes?: { completed: number; partial: number; unmarked: number; total: number };
};

/**
 * The timer measures real wall-clock elapsed time, including time spent on a
 * background tab, rather than counting setInterval callbacks. When a
 * rights-cleared recording is configured, the native media element controls
 * audio time, while session time remains a separate elapsed-time record.
 */
type PracticeToolIcon = 'mixer' | 'tempo' | 'loop' | 'tuner' | 'metronome';
export function PracticeToolGlyph({ name }: { name: PracticeToolIcon }) {
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
export type FreePracticePlayerSession = {
  kind: 'chart' | 'track' | 'routine';
  sourceId: string;
  sessionId: string;
  seconds: number;
  clockRunning: boolean;
  onPause: () => void;
  onFinish: () => void;
  onAdd: () => void;
  onBack: () => void;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PracticePage({ freeSession }: { freeSession?: FreePracticePlayerSession }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    charts, exercises, routines, activeRoutineId, addSession, showToast, catId, repo, refreshLocal,
  } = useApp();
  const requestedChart = freeSession?.kind === 'chart' ? freeSession.sourceId : searchParams.get('chart');
  const requestedRecording = freeSession?.kind === 'track' ? freeSession.sourceId : searchParams.get('recording');
  const requestedRoutine = freeSession?.kind === 'routine' ? freeSession.sourceId : searchParams.get('routine');
  const freeMode = Boolean(freeSession) || searchParams.get('mode') === 'free';
  // An explicit free-session queue item overrides any remembered routine.
  const routineId = freeSession
    ? requestedRoutine
    : !requestedChart && !requestedRecording && !freeMode ? (requestedRoutine ?? activeRoutineId) : null;
  const routine = routineId ? routines.find(item => item.id === routineId) ?? null : null;
  const missingRoutine = Boolean(requestedRoutine && !routine);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepOutcomes, setStepOutcomes] = useState<RoutineStepOutcomes>({});
  const [stepsOpen, setStepsOpen] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | 'finish' | null>(null);
  const [customExerciseTitle, setCustomExerciseTitle] = useState('');
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
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [tempo, setTempo] = useState(100);
  const [tempoInput, setTempoInput] = useState('100');
  const recordingLoopRef = useRef<{ start: number; end: number; plays: number; remaining: number }[]>([]);
  const recordingLoopRepeat = useRef(false);
  const recordingLoopIndex = useRef(0);
  const [repeatRecording, setRepeatRecording] = useState(false);

  // Playback state is independent of the automatically running session clock.
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => performance.now());
  // Independent wall-clock practice timer: starts when the player opens,
  // even if recorded audio or the chart-following playhead is not playing.
  const [sessionAccumulatedMs, setSessionAccumulatedMs] = useState(0);
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState<number | null>(() => freeSession ? null : performance.now());
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
  const { user } = useAuth();
  const userScope = localStorageScopeForUser(user?.id);
  const sessionDraftId = useRef(freeSession?.sessionId ?? crypto.randomUUID());
  const [chartNotes, setChartNotes] = useState<ChartNote[]>([]);
  const [journalEntries, setJournalEntries] = useState<PracticeJournalEntry[]>([]);
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [bubbleBar, setBubbleBar] = useState<number | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [customLoopSections, setCustomLoopSections] = useState<CustomPracticeSection[]>([]);
  const [loopCounts, setLoopCounts] = useState<Record<string, number>>({});
  const [wholeCount, setWholeCount] = useState(1);
  const [wholeSelected, setWholeSelected] = useState(true);
  const [showUnavailableTools, setShowUnavailableTools] = useState(() => {
    try { return localStorage.getItem('little-jazz-room:show-unavailable-tools:v1:' + userScope) === 'true'; }
    catch { return false; }
  });
  const toggleUnavailableTools = () => setShowUnavailableTools(previous => {
    const next = !previous;
    try { localStorage.setItem('little-jazz-room:show-unavailable-tools:v1:' + userScope, String(next)); }
    catch { /* Optional browser preference */ }
    return next;
  });
  const [showMeasureNumbers, setShowMeasureNumbers] = useState(() => {
    try { return localStorage.getItem('little-jazz-room:number-measures:v1:' + userScope) !== 'false'; }
    catch { return true; }
  });
  const metronome = usePracticeMetronome();
  useEffect(() => { setChartNotes(readLocalList<ChartNote>(notesKey(userScope, chartId))); }, [userScope, chartId]);
  useEffect(() => { setJournalEntries(readLocalList<PracticeJournalEntry>(journalKey(userScope))); }, [userScope]);

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
  // A routine step without a chart must not display an unrelated fallback chart.
  const stepChart = playableStep?.chart_id ? getChartById(playableStep.chart_id, charts) : null;
  const hasMusicContent = !routine || Boolean(stepChart);
  const stepDefaults = useMemo(
    () => defaultPlayerSettings(stepChart?.concert_key ?? chart.concert_key,
      chosenExercise?.suggested_bpm, playableStep?.player_settings),
    [stepChart?.concert_key, chart.concert_key, chosenExercise?.suggested_bpm, playableStep?.player_settings],
  );
  const currentSettings = {
    reference_bpm: tempo, chart_key: chartKey, written_pitch: writtenPitch,
    loop_enabled: loopEnabled, loop_sections: loopSections, repeat: repeatWholePlan,
  };
  const editedStepSettings = Boolean(routine && settingsChanged(currentSettings, stepDefaults));
  const completeCount = Object.values(stepOutcomes).filter(outcome => outcome === 'complete').length;
  const partialCount = Object.values(stepOutcomes).filter(outcome => outcome === 'partial').length;
  const instructionsVisible = Boolean(routine && (panel === 'instructions' || !hasMusicContent));
  const showPlayerControls = !instructionsVisible;
  const chartStepSections = routine && hasMusicContent && lesson && stepChart?.id === chart.id
    ? routineStepChartSections(lesson, chart) : [];

  const isRunning = startedAtMs !== null;
  const elapsedSeconds = freeSession?.seconds ??
    Math.floor((sessionAccumulatedMs + elapsedMilliseconds(0, sessionStartedAtMs, nowMs)) / 1000);

  useEffect(() => {
    setStepIndex(0);
    setStepOutcomes({});
    setStepsOpen(false);
    setPendingStep(null);
    setPanel(routine ? 'instructions' : 'chart');
    setStartedAtMs(null);
    setSessionAccumulatedMs(0);
    const sessionStart = performance.now();
    setSessionStartedAtMs(freeSession ? null : sessionStart);
    setNowMs(sessionStart);
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
    setTempo(stepDefaults.reference_bpm);
    setTempoInput(String(stepDefaults.reference_bpm));
    setChartKey(stepDefaults.chart_key);
    setWrittenPitch(stepDefaults.written_pitch);
    setLoopEnabled(stepDefaults.loop_enabled);
    setLoopSections(stepDefaults.loop_sections.length ? stepDefaults.loop_sections.map(section => ({ ...section }))
      : [{ startBar: 1, endBar: Math.min(stepChart?.bars.length ?? chart.bars.length, 4), plays: 2 }]);
    setRepeatWholePlan(stepDefaults.repeat);
    setPanel('instructions');
  }, [routine?.id, stepIndex, stepDefaults, hasMusicContent]);

  useEffect(() => {
    if (freeSession || ((!isRunning && sessionStartedAtMs === null) || completion)) return;
    const timerId = window.setInterval(() => setNowMs(performance.now()), 100);
    return () => window.clearInterval(timerId);
  }, [isRunning, sessionStartedAtMs, completion]);

  useEffect(() => {
    metronome.changeBpm(activeRecording?.recordedBpm ?? tempo);
    if (hasMusicContent) metronome.setPieceMeter([chart.time_signature[0], chart.time_signature[1]]);
  }, [chart.id, chart.time_signature[0], chart.time_signature[1], activeRecording?.recordedBpm,
    activeRecording ? null : tempo, hasMusicContent, metronome.changeBpm, metronome.setPieceMeter]);

  // Changes made in the reusable metronome sheet become an editable routine tempo.
  // The existing tempo-to-metronome effect above keeps both controls in sync.
  useEffect(() => {
    if (!routine || activeTool !== 'metronome' || metronome.synced || metronome.bpm === tempo) return;
    changeTempo(metronome.bpm);
  }, [routine?.id, activeTool, metronome.synced, metronome.bpm, tempo]);

  useEffect(() => {
    // The metronome polls the actual transport position. The recording's chart
    // starts after its intro; never equate audio 0:00 with bar one's downbeat.
    metronome.connectPlayback(() => {
      if (activeRecording) {
        const audio = audioRef.current;
        return { playing: Boolean(audio && !audio.paused && !audio.ended && audio.readyState >= 2),
          positionSeconds: (audio?.currentTime ?? 0) - activeRecording.chartStartSeconds,
          tempoBpm: activeRecording.recordedBpm * (audio?.playbackRate ?? 1) };
      }
      return { playing: isRunning,
        positionSeconds: rawChartBeat(musicalClock, performance.now(), tempo, chart) *
          60 * 4 / (tempo * chart.time_signature[1]),
        tempoBpm: tempo };
    });
  }, [metronome.connectPlayback, activeRecording?.id, activeRecording?.chartStartSeconds,
    isRunning, musicalClock, tempo, chart.id, chart.time_signature[1]]);

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
  const demoOptions = getPlayerLoopOptions(chart, customLoopSections);
  const userNoteMap: Record<number, string> = Object.fromEntries(chartNotes.map(item => [item.bar, item.text]));
  useEffect(() => {
    const heading = titleRef.current;
    if (!heading) return;
    const overflow = heading.scrollWidth - heading.clientWidth;
    if (overflow < 3 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heading.scrollLeft = 0;
      return;
    }
    // Only titles too long to fit glide gently; normal titles do not move.
    const start = window.setTimeout(() => heading.scrollTo({ left: overflow, behavior: 'smooth' }), 1400);
    const cycle = window.setInterval(() =>
      heading.scrollTo({ left: heading.scrollLeft > overflow / 2 ? 0 : overflow, behavior: 'smooth' }), 4800);
    return () => { window.clearTimeout(start); window.clearInterval(cycle); };
  }, [chart.title, routine?.title]);

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
    setBubbleBar(null);
    setLoopEnabled(false);
    setLoopSections([{ startBar: 1, endBar: Math.min(next.bars.length, 4), plays: 2 }]);
    setRepeatWholePlan(false);
    setMusicalClock({ chartBeat: 0, startedAtMs: isRunning ? now : null });
    setNowMs(now);
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


  function saveChartAnnotation(bar: number, text: string) {
    const date = new Date().toISOString();
    const updated = [...chartNotes.filter(item => item.bar !== bar), { bar, text, updatedAt: date }]
      .sort((a, b) => a.bar - b.bar);
    setChartNotes(updated);
    if (!persistLocalList(notesKey(userScope, chart.id), updated)) showToast('Could not save chart annotation on this device.');
    else showToast('Chart annotation saved.');
  }
  function deleteChartAnnotation(bar: number) {
    const updated = chartNotes.filter(item => item.bar !== bar);
    setChartNotes(updated);
    if (!persistLocalList(notesKey(userScope, chart.id), updated)) showToast('Could not update chart annotations on this device.');
  }
  function saveJournalEntry(text: string) {
    const now = new Date().toISOString();
    const existing = journalEntries.find(entry => entry.sessionId === sessionDraftId.current);
    const entry: PracticeJournalEntry = {
      id: existing?.id ?? crypto.randomUUID(), sessionId: sessionDraftId.current,
      chartId: hasMusicContent ? chart.id : '', chartTitle: hasMusicContent ? chart.title : routine?.title ?? 'Free Practice', text,
      createdAt: existing?.createdAt ?? now, updatedAt: now, durationSeconds: elapsedSeconds,
    };
    const updated = [...journalEntries.filter(item => item.sessionId !== sessionDraftId.current), entry];
    if (!persistLocalList(journalKey(userScope), updated)) { showToast('Could not save journal entry on this device.'); return; }
    setJournalEntries(updated);
    setNotes(text);
    setJournalOpen(false);
    showToast('Journal entry saved.');
  }
  function deleteJournalEntry(id: string) {
    const updated = journalEntries.filter(item => item.id !== id);
    if (!persistLocalList(journalKey(userScope), updated)) { showToast('Could not delete this entry.'); return; }
    setJournalEntries(updated);
  }
  function updateInlineLoop(nextCounts: Record<string, number>, nextWhole: number, useWhole: boolean,
    custom: CustomPracticeSection[] = customLoopSections) {
    const whole = useWhole && nextWhole !== 0;
    setLoopCounts(nextCounts);
    setWholeCount(nextWhole);
    setWholeSelected(whole);
    if (whole) {
      if (nextWhole === 1) applyLoop(false, [], false);
      else applyLoop(true, [{ startBar: 1, endBar: chart.bars.length, plays: programPlays(nextWhole) }], false);
      return;
    }
    const sections = sectionRepeatProgram(getPlayerLoopOptions(chart, custom), nextCounts);
    if (!sections.length) {
      audioRef.current?.pause();
      applyLoop(false, [], false);
      showToast('All sections are set to 0×. Increase a repeat count to play a section.');
      return;
    }
    applyLoop(true, sections, false);
  }
  function addInlineSection(name: string, startBar: number, endBar: number) {
    const item: CustomPracticeSection = { id: crypto.randomUUID(), label: name, startBar, endBar };
    const updated = [...customLoopSections, item];
    setCustomLoopSections(updated);
    updateInlineLoop({ ...loopCounts, [item.id]: 1 }, wholeCount, false, updated);
    showToast('Section added to your loop.');
  }
  function toggleMeasureNumbers() {
    const next = !showMeasureNumbers;
    setShowMeasureNumbers(next);
    try { localStorage.setItem('little-jazz-room:number-measures:v1:' + userScope, String(next)); }
    catch { /* display preference still works this session */ }
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

  function toggleSessionTime() {
    const now = performance.now();
    if (sessionStartedAtMs === null) setSessionStartedAtMs(now);
    else {
      setSessionAccumulatedMs(previous => previous + elapsedMilliseconds(0, sessionStartedAtMs, now));
      setSessionStartedAtMs(null);
    }
    setNowMs(now);
  }

  function seekChartSeconds(deltaSeconds: number) {
    if (activeRecording) return;
    const now = performance.now();
    const beatOffset = deltaSeconds * tempo * chart.time_signature[1] / 240;
    const max = Math.max(0, sequenceDuration(chart, activeSections) - 0.0001);
    const next = Math.max(0, Math.min(max, rawChartBeat(musicalClock, now, tempo, chart) + beatOffset));
    setMusicalClock({ chartBeat: next, startedAtMs: isRunning ? now : null });
    setNowMs(now);
  }

  function toggleFullChartRepeat() {
    const next = !repeatWholePlan;
    setRepeatWholePlan(next);
    setLoopEnabled(next);
    setLoopSections([{ startBar: 1, endBar: chart.bars.length, plays: 1 }]);
    const now = performance.now();
    setMusicalClock({ chartBeat: rawChartBeat(musicalClock, now, tempo, chart),
      startedAtMs: isRunning ? now : null });
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
    else setStartedAtMs(null);
    setNowMs(now);
  }

  function goStep(next: number | 'finish') {
    if (!routine) return;
    setStepsOpen(false);
    setPendingStep(null);
    if (next === 'finish') {
      if (freeSession) freeSession.onNext();
      else finishSession();
      return;
    }
    if (next === stepIndex || next < 0 || next >= routine.steps.length) return;
    suppressAudioPauseRef.current = true;
    audioRef.current?.pause();
    metronome.stop();
    const now = performance.now();
    setStartedAtMs(null);
    setNowMs(now);
    setStepIndex(next);
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
    suppressAudioPauseRef.current = false;
  }

  function requestStep(next: number | 'finish') {
    if (!routine || next === stepIndex) return;
    if (editedStepSettings) {
      setCustomExerciseTitle((playableStep?.title ?? 'Exercise') + ' (custom)');
      setPendingStep(next);
      setStepsOpen(false);
      return;
    }
    goStep(next);
  }

  function saveEditedExerciseAndContinue() {
    if (pendingStep === null || !customExerciseTitle.trim()) return;
    try {
      const exercise = makeSavedExercise(chosenExercise, customExerciseTitle,
        playableStep?.instructions ?? '', playableStep?.chart_id ?? null,
        currentStep?.duration_minutes ?? playableStep?.duration_minutes ?? 5, currentSettings);
      repo.saveLocalExercise(exercise);
      refreshLocal();
      showToast('Saved as a new exercise in My Exercises on this device.');
      goStep(pendingStep);
    } catch {
      showToast('Could not save your exercise. Your changes are still available.');
    }
  }

  function changeStepCheck(check: 'started' | 'complete', checked: boolean) {
    setStepOutcomes(previous => {
      const next = { ...previous };
      const status = toggleRoutineCheck(previous[stepIndex], check, checked);
      if (status) next[stepIndex] = status;
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
    const durationSeconds = Math.floor((sessionAccumulatedMs + elapsedMilliseconds(0, sessionStartedAtMs, now)) / 1000);
    setSessionAccumulatedMs(previous => previous + elapsedMilliseconds(0, sessionStartedAtMs, now));
    setSessionStartedAtMs(null);
    setStartedAtMs(null);
    setMusicalClock(current => ({ chartBeat: rawChartBeat(current, now, tempo, chart), startedAtMs: null }));
    setNowMs(now);
    setCompletion({
      // One stable UUID per finished session, reused across failed save retries.
      id: sessionDraftId.current,
      finishedAt: new Date(finishedStamp).toISOString(),
      durationSeconds,
      routineId: routine?.id,
      exerciseId: playableStep?.exercise_id,
      title: routine?.title ?? chart.title,
      chartTitle: routine ? undefined : chart.title,
      recordingTitle: activeRecording?.title,
      routineOutcomes: routine ? { completed: completeCount, partial: partialCount,
        unmarked: Math.max(0, routine.steps.length - completeCount - partialCount),
        total: routine.steps.length } : undefined,
    });
    setSaveState('idle');
    savePromiseRef.current = null;
    metronome.stop();
    if (journalEntries.some(entry => entry.sessionId === sessionDraftId.current)) {
      const updated = journalEntries.map(entry => entry.sessionId === sessionDraftId.current
        ? { ...entry, durationSeconds } : entry);
      setJournalEntries(updated);
      persistLocalList(journalKey(userScope), updated);
    }
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
            JSON.stringify({ notes: savedNotes, rating: savedRating,
              routineStepOutcomes: routine ? stepOutcomes : undefined }),
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
    setStepsOpen(false);
    setPendingStep(null);
    setStartedAtMs(null);
    setSessionAccumulatedMs(0);
    const restartTime = performance.now();
    setSessionStartedAtMs(restartTime);
    setNowMs(restartTime);
    setMusicalClock({ chartBeat: 0, startedAtMs: null });
    setCompletion(null);
    setNotes('');
    sessionDraftId.current = crypto.randomUUID();
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
            {completion.routineOutcomes
              ? <small>{completion.routineOutcomes.completed} of {completion.routineOutcomes.total} exercises completed
                  {completion.routineOutcomes.partial ? ` · ${completion.routineOutcomes.partial} partially completed` : ''}
                  {completion.routineOutcomes.unmarked ? ` · ${completion.routineOutcomes.unmarked} not marked` : ''}</small>
              : <small>{completion.chartTitle} · {completion.recordingTitle ? 'Recorded backing track' : 'Chart only'}</small>}
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
    <section className={`practice-player ${routine ? 'practice-guided' : 'practice-free'} ${activeRecording ? 'practice-has-recording' : ''} ${routine && (panel === 'instructions' || !hasMusicContent) ? 'practice-instructions' : ''} ${!hasMusicContent ? 'practice-no-chart' : ''} ${freeSession ? 'practice-free-session' : ''} practice-unified practice-demo-refresh`} aria-label="Shared practice player">
      <header className="practice-player-head">
        <button className="practice-back" type="button" onClick={freeSession ? freeSession.onBack : () => navigate('/practice')} aria-label="Back to Practice">‹</button>
        <div className="practice-title-group">
          <h1 ref={titleRef} title={routine?.title ?? chart.title}>{routine?.title ?? chart.title}</h1>
          {!routine && <p>{formatChartMeta(chart) + ' · Key ' + chart.concert_key.replace('b', '♭')}</p>}
          {showPlayerControls && chart.style_instruction && <p className="practice-chart-style">{chart.style_instruction}</p>}
        </div>
        {freeSession && <button type="button" className="fp-header-add" onClick={freeSession.onAdd}>+ Add...</button>}
      </header>

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
      {showPlayerControls && <div className="practice-demo-status-row">
        <p className="practice-audio-state" data-testid="chart-playhead" title={planStatus}>
          <strong>{activeRecording ? 'Recorded Track' : 'Chart Only'}</strong> · Bar {playhead.barIndex + 1} · Beat {Math.floor(playhead.beatInBar) + 1} · {activeRecording ? activeRecording.recordedBpm + ' BPM audio' : 'No recording'}
        </p>
        {(!routine || panel === 'chart') && <div className="practice-demo-header-actions">
          <button type="button" className="practice-demo-measure-toggle" onClick={toggleMeasureNumbers}
            aria-pressed={showMeasureNumbers} aria-label="Number measures">
            <span>Number measures</span><span className="practice-demo-measure-switch" aria-hidden="true" />
          </button>
          <button type="button" className="practice-demo-chart-pencil"
            aria-label="Add or edit chart annotations" title="Chart annotations"
            onClick={() => setAnnotationOpen(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 16 11-11 4 4-11 11-5 1 1-5Z"/><path d="m13.5 6.5 4 4"/>
            </svg>
          </button>
        </div>}
      </div>}
      {activeRecording && recordingError && <p role="alert" className="practice-recording-error">{recordingError}</p>}

      {routine && <div className="routine-step-progress">
        <button type="button" className="routine-step-progress-trigger"
          onClick={() => setStepsOpen(true)} aria-haspopup="dialog" aria-label="View all routine exercises"
          title="View and select routine exercises">
          <span className="routine-step-segments" role="progressbar" aria-label="Completed routine exercises"
            aria-valuemin={0} aria-valuemax={routine.steps.length} aria-valuenow={completeCount}>
            {routine.steps.map((_, index) => <span key={index}
              className={['routine-step-segment',
                stepOutcomes[index] === 'complete' ? 'is-complete' :
                stepOutcomes[index] === 'partial' ? 'is-partial' : 'is-incomplete',
                index === stepIndex ? 'is-current' : ''].join(' ')}
              aria-hidden="true" />)}
          </span>
          <svg className="routine-step-progress-chevron" width="18" height="18" viewBox="0 0 20 20"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 7 5 5 5-5"/>
          </svg>
        </button>
        <div className="routine-step-progress-label" aria-live="polite">
          {stepIndex + 1}. {playableStep?.title ?? 'Exercise'}
        </div>
      </div>}

      {routine && lesson && instructionsVisible ? (
        <div id="practice-instructions-panel" className="routine-instruction-area" aria-label="Exercise instructions">
          <div className="practice-lesson-panel">
            <GuidedLesson key={stepIndex} lesson={lesson} stepIndex={stepIndex}
              totalSteps={routine.steps.length} hideTitle
              stepChart={stepChart ?? undefined} chartKey={chartKey} writtenPitch={writtenPitch}
              onSelectBar={moveToBar}
              onSeeChart={hasMusicContent ? () => setPanel('chart') : undefined} />
          </div>
        </div>
      ) : (
        <div className="practice-notation-panel" role="tabpanel" aria-label="Jazz chord chart">
          <div className="practice-chart-toolbar">
            {routine ? <strong className="routine-chart-fixed-title">{chart.title}</strong> : <>
              <label htmlFor="player-chart">Study chart</label>
              <select id="player-chart" value={chartId} disabled={Boolean(activeRecording || freeSession)}
                onChange={event => chooseChart(event.target.value)} aria-label="Choose practice chart">
                {charts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </>}
            {routine && <button type="button" className="routine-context-link" onClick={() => setPanel('instructions')}
              aria-label="Back to instructions">← Instructions</button>}
          </div>
          <div className={`practice-chart-scroll practice-chart-all ${chart.bars.length > 16 ? 'chart-dense' : 'chart-standard'} ${showMeasureNumbers ? 'practice-show-measure-numbers' : ''}`}
            aria-label={`Complete chord chart, all ${chart.bars.length} measures visible`}>
            {chartStepSections.length ? <div className="routine-step-sheet">
              {chartStepSections.map(section => <div className="routine-step-sheet-row" key={section.stepNumber}
                aria-label={`Instruction ${section.stepNumber}: bars ${section.startBar} through ${section.endBar}`}>
                <span className="routine-step-sheet-number">{section.stepNumber}</span>
                <ChordGrid chart={chart} chartKey={chartKey} writtenPitch={writtenPitch}
                  selectedBar={playhead.barIndex} activeBar={playhead.barIndex}
                  activeEventIndex={playhead.eventIndex} loopRange={loopRange}
                  displayRange={[section.startBar - 1, section.endBar]}
                  onSelectBar={index => { moveToBar(index); setBubbleBar(index + 1); }}
                  showSectionLabels={false} practiceSheet showMeasureNumbers={showMeasureNumbers}
                  userAnnotations={userNoteMap} />
              </div>)}
            </div> : <ChordGrid chart={chart} chartKey={chartKey} writtenPitch={writtenPitch}
              selectedBar={playhead.barIndex} activeBar={playhead.barIndex}
              activeEventIndex={playhead.eventIndex} loopRange={loopRange}
              onSelectBar={index => { moveToBar(index); setBubbleBar(index + 1); }} showSectionLabels practiceSheet
              showMeasureNumbers={showMeasureNumbers} userAnnotations={userNoteMap} />}
          </div>
          {bubbleBar !== null &&
            chartNotes.some(note => note.bar === bubbleBar && chartAnnotationDisplay(note.text) === 'bubble') &&
            <div className="practice-demo-chart-bubble-detail" role="status">
              <strong>Bar {bubbleBar} note</strong>
              <span>{chartNotes.find(note => note.bar === bubbleBar)?.text}</span>
              <button type="button" onClick={() => setAnnotationOpen(true)}>Edit</button>
              <button type="button" aria-label="Dismiss chart note" onClick={() => setBubbleBar(null)}>×</button>
            </div>}

        </div>
      )}

      {routine && hasMusicContent && panel === 'chart' && (
        <aside className="practice-guided-head" aria-label="Exercise goal">
          <p>{lesson?.goal ?? 'Follow the exercise and practice at your own pace.'}</p>
        </aside>
      )}

      {showPlayerControls && <div className="practice-transport">
        <div className="practice-recording-seek">
          {activeRecording ? <>
            <input id="recording-scrubber" type="range" min={0} max={recordingDuration || 1}
              step={0.05} value={Math.min(recordingPosition, recordingDuration || 1)} disabled={!recordingDuration}
              aria-label="Seek recording" onChange={event => seekRecording(Number(event.target.value))} />
            <div className="practice-recording-times">{formatPracticeTime(Math.floor(recordingPosition))} / {formatPracticeTime(Math.floor(recordingDuration))}</div>
          </> : <>
            <input id="recording-scrubber" type="range" min={1} max={chart.bars.length} step={1}
              value={playhead.barIndex + 1} aria-label="Seek chart measure"
              onChange={event => moveToBar(Number(event.target.value) - 1)} />
            <div className="practice-recording-times">Bar {playhead.barIndex + 1} / {chart.bars.length}</div>
          </>}
        </div>
        <div className="practice-control-row">
          <button className="practice-measure-btn" type="button"
            aria-label="Back 10 seconds"
            onClick={() => activeRecording ? seekRecording((audioRef.current?.currentTime ?? 0) - 10) : seekChartSeconds(-10)}>
            <SkipTenIcon />
          </button>
          <button className="practice-timer-button" type="button" onClick={toggleTimer}
            aria-label={activeRecording ? (recordingPlaying ? 'Pause recording' : 'Play recording') : (isRunning ? 'Pause chart follow-along' : 'Play chart follow-along')}>
            {(activeRecording ? recordingPlaying : isRunning) ? <PauseIcon size={22} /> : '▶'}
          </button>
          <button className="practice-measure-btn" type="button"
            aria-label="Forward 10 seconds"
            onClick={() => activeRecording ? seekRecording((audioRef.current?.currentTime ?? 0) + 10) : seekChartSeconds(10)}>
            <SkipTenIcon forward />
          </button>
          <button className="practice-secondary-transport" type="button"
            aria-label={activeRecording ? 'Repeat recording' : 'Repeat chart follow-along'}
            aria-pressed={activeRecording ? repeatRecording : repeatWholePlan}
            onClick={() => activeRecording ? setRepeatRecording(value => !value) : toggleFullChartRepeat()}>
            <RepeatIcon />
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
                    <button type="button" aria-label="Increase reference BPM" onClick={() => changeTempo(tempo + 1)}><ControlChevron up /></button>
                    <button type="button" aria-label="Decrease reference BPM" onClick={() => changeTempo(tempo - 1)}><ControlChevron up={false} /></button>
                  </div>
                </div>
              </div>
              <div className="practice-demo-setting practice-demo-key">
                <label htmlFor="practice-demo-key">Key</label>
                <div className="practice-demo-input-stepper">
                  <select id="practice-demo-key" value={CHROMA[pitchClass(chartKey) ?? 0]} onChange={event => setChartKey(event.target.value)}
                    aria-label="Transpose concert chart key">{CHROMA.map(key => <option key={key} value={key}>{key.replace('b', '♭')}</option>)}</select>
                  <div className="practice-demo-updown">
                    <button type="button" aria-label="Increase chart key by semitone" onClick={() => setChartKey(CHROMA[((pitchClass(chartKey) ?? 0) + 1) % 12])}><ControlChevron up /></button>
                    <button type="button" aria-label="Decrease chart key by semitone" onClick={() => setChartKey(CHROMA[((pitchClass(chartKey) ?? 0) + 11) % 12])}><ControlChevron up={false} /></button>
                  </div>
                </div>
              </div>
              <label className="practice-demo-setting practice-demo-instrument" htmlFor="practice-demo-instrument">
                <span>Instrument</span>
                <select id="practice-demo-instrument" value={writtenPitch} onChange={event => setWrittenPitch(event.target.value as WrittenPitch)}
                  aria-label="Transposing instrument"><option value="C">Concert</option><option value="Bb">B♭</option><option value="Eb">E♭</option></select>
              </label>
              <button type="button" className="practice-demo-original"
                aria-label={routine ? 'Reset to routine preset' : activeRecording ? 'Reset BPM to recorded tempo' : 'Reset BPM to original chart tempo'}
                onClick={() => {
                  if (routine) {
                    changeTempo(stepDefaults.reference_bpm);
                    setChartKey(stepDefaults.chart_key);
                    setWrittenPitch(stepDefaults.written_pitch);
                    setLoopEnabled(stepDefaults.loop_enabled);
                    setLoopSections(stepDefaults.loop_sections.length ? stepDefaults.loop_sections.map(section => ({ ...section }))
                      : [{ startBar: 1, endBar: Math.min(chart.bars.length, 4), plays: 2 }]);
                    setRepeatWholePlan(stepDefaults.repeat);
                  } else changeTempo(activeRecording?.recordedBpm ?? chosenExercise?.suggested_bpm ?? 100);
                }}>{routine ? 'Preset' : 'Original'}</button>
            </div>
            <p className="practice-reference-note practice-demo-audio-note">{activeRecording
              ? 'Reference BPM and chart key only; audio stays at its original speed and pitch.'
              : 'Playback follows the chart visually at this BPM; no recorded audio is available.'}</p>
            {(activeRecording || showUnavailableTools) && <PracticeInlineLoop options={demoOptions} counts={loopCounts} wholeCount={wholeCount}
              wholeSelected={wholeSelected} onCount={(id, count) =>
                updateInlineLoop({ ...loopCounts, [id]: count }, wholeCount, false)}
              onWhole={count => updateInlineLoop(loopCounts, count, true)}
              onAdd={() => setAddSectionOpen(true)} onAdvanced={openLoop}
              disabled={!activeRecording} />}
      </div>}
            <div className={`practice-utility-row practice-demo-tools ${showPlayerControls && showUnavailableTools ? 'has-unavailable-tools' : 'hide-unavailable-tools'}`} aria-label="Practice tools">
              <div className="practice-demo-metronome-wrap">
                <button className="practice-demo-tool-main" type="button" onClick={event => openTool('metronome', event.currentTarget)}>
                  <PracticeToolGlyph name="metronome" /><span>Metronome</span>
                </button>
                <button className={'practice-demo-metronome-switch' + (metronome.playing ? ' is-on' : '')} type="button"
                  aria-label={metronome.playing ? 'Turn metronome off' : 'Turn metronome on'}
                  aria-pressed={metronome.playing} onClick={metronome.toggle}>
                  {metronome.playing ? 'On' : 'Off'} <span aria-hidden="true" className="practice-demo-switch-knob" />
                </button>
              </div>
              <button type="button" onClick={event => openTool('tuner', event.currentTarget)}>
                <PracticeToolGlyph name="tuner" /><span>Tuner</span>
              </button>
              {showPlayerControls && showUnavailableTools && <button type="button" disabled title="Mixer is Preview only">
                <PracticeToolGlyph name="mixer" /><span>Mixer</span><small>Preview</small>
              </button>}
            </div>
            {showPlayerControls && <button type="button" className="practice-unavailable-tools-toggle"
              aria-pressed={showUnavailableTools} onClick={toggleUnavailableTools}>
              {showUnavailableTools ? 'Hide unavailable tools' : 'Show unavailable tools'}
            </button>}
      {routine && !freeSession ? (
        <div className="routine-session-dock" aria-label="Routine session controls">
          <div className="routine-dock-top">
            <div className="routine-compact-status" role="group" aria-label="Exercise status">
              <div className="routine-compact-checks">
                <label>
                  <input type="checkbox" checked={Boolean(stepOutcomes[stepIndex])}
                    onChange={event => changeStepCheck('started', event.target.checked)} />
                  <span>Started</span>
                </label>
                <label>
                  <input type="checkbox" checked={stepOutcomes[stepIndex] === 'complete'}
                    onChange={event => changeStepCheck('complete', event.target.checked)} />
                  <span>Complete</span>
                </label>
              </div>
              <span className="routine-compact-state" aria-live="polite">
                {stepOutcomes[stepIndex] === 'complete' ? 'Complete' : stepOutcomes[stepIndex] === 'partial' ? 'Partial' : 'Incomplete'}
              </span>
            </div>
            <div className="routine-session-navigation" aria-label="Routine step navigation">
              <button type="button" aria-label="Previous routine step" title="Previous step"
                disabled={stepIndex === 0} onClick={() => requestStep(stepIndex - 1)}>‹</button>
              <button type="button" aria-label="Next routine step" title="Next step"
                disabled={stepIndex === routine.steps.length - 1}
                onClick={() => requestStep(stepIndex + 1)}>›</button>
            </div>
          </div>
          <div className="practice-session-row practice-demo-session-row routine-dock-bottom">
            <PracticeTimeBadge seconds={elapsedSeconds} running={sessionStartedAtMs !== null}
              onTogglePause={toggleSessionTime} />
            <div className="practice-demo-session-actions">
              <button className="practice-finish-action" type="button" onClick={finishSession}>
                <span aria-hidden="true">✓</span> Finish Session
              </button>
              <button className="practice-demo-journal" type="button" aria-label="Open session journal" title="Session journal"
                onClick={() => setJournalOpen(true)}>
                <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18M10.5 8h6M10.5 12h6M10.5 16h4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : freeSession
        ? <FreePracticeSessionBar seconds={elapsedSeconds} running={freeSession.clockRunning}
            onToggleTimer={freeSession.onPause} canPrevious={freeSession.canPrevious}
            canNext={freeSession.canNext} onPrevious={freeSession.onPrevious}
            onNext={freeSession.onNext} onFinish={freeSession.onFinish}
            onJournal={() => setJournalOpen(true)} />
        : <div className="practice-session-row practice-demo-session-row">
            <PracticeTimeBadge seconds={elapsedSeconds} running={sessionStartedAtMs !== null}
              onTogglePause={toggleSessionTime} />
            <div className="practice-demo-session-actions">
              <button className="practice-finish-action" type="button" onClick={finishSession}>
                <span aria-hidden="true">✓</span> Finish Session
              </button>
              <button className="practice-demo-journal" type="button" aria-label="Open session journal" title="Session journal"
                onClick={() => setJournalOpen(true)}>
                <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18M10.5 8h6M10.5 12h6M10.5 16h4"/>
                </svg>
              </button>
            </div>
          </div>}

    </section>
    {stepsOpen && routine && createPortal(
      <div className="routine-class-dialog-backdrop" onClick={() => setStepsOpen(false)}>
        <section className="routine-class-dialog" role="dialog" aria-modal="true" aria-label="Routine exercise overview"
          onClick={event => event.stopPropagation()}
          onKeyDown={event => { if (event.key === 'Escape') setStepsOpen(false); }}>
          <header><h2>{routine.title}</h2><button type="button" aria-label="Close routine overview"
            onClick={() => setStepsOpen(false)} autoFocus>×</button></header>
          <p>Choose an exercise to jump to it.</p>
          <div className="routine-class-list">
            {routine.steps.map((step, index) => {
              const target = resolvePlayableStep(step, exercises, exercisesById);
              const status = stepOutcomes[index];
              return <button type="button" key={index}
                className={index === stepIndex ? 'is-current' : undefined}
                aria-current={index === stepIndex ? 'step' : undefined}
                onClick={() => { setStepsOpen(false); requestStep(index); }}>
                <span className="routine-class-step-number">{index + 1}</span>
                <span className="routine-class-step-name"><strong>{target.title}</strong>
                  <small>{step.duration_minutes} min · {target.chart_id ? 'Chart' : 'Instructions'}</small></span>
                <span className="routine-class-step-status">{status === 'complete' ? '✓ Complete' :
                  status === 'partial' ? 'Partial' : index === stepIndex ? 'Current' : 'Incomplete'}</span>
              </button>;
            })}
          </div>
        </section>
      </div>, document.body
    )}
    {pendingStep !== null && createPortal(
      <div className="routine-class-dialog-backdrop">
        <section className="routine-class-dialog" role="dialog" aria-modal="true" aria-label="Save modified exercise settings"
          onKeyDown={event => { if (event.key === 'Escape') setPendingStep(null); }}>
          <header><h2>Save your exercise changes?</h2>
            <button type="button" aria-label="Keep practicing" onClick={() => setPendingStep(null)}>×</button></header>
          <p>You changed this step's settings. Save a new exercise without changing the original routine?</p>
          <div className="routine-class-change-summary">
            <span>Tempo: {stepDefaults.reference_bpm} → {tempo} BPM</span>
            <span>Key: {stepDefaults.chart_key.replace('b', '♭')} → {chartKey.replace('b', '♭')}</span>
            <span>Instrument, loop and repeat changes will also be included.</span>
          </div>
          <label className="routine-class-label">New exercise name
            <input autoFocus type="text" maxLength={100}
              value={customExerciseTitle} onChange={event => setCustomExerciseTitle(event.target.value)} />
          </label>
          <button type="button" className="routine-class-primary" disabled={!customExerciseTitle.trim()}
            onClick={saveEditedExerciseAndContinue}>Save as New Exercise</button>
          <button type="button" className="routine-class-secondary"
            onClick={() => { const next = pendingStep; setPendingStep(null); if (next !== null) goStep(next); }}>Continue Without Saving</button>
          <button type="button" className="routine-class-link" onClick={() => setPendingStep(null)}>Keep practicing</button>
        </section>
      </div>, document.body
    )}
    {annotationOpen && createPortal(
      <ChartAnnotationSheet chartTitle={chart.title} totalBars={chart.bars.length} initialBar={bubbleBar ?? playhead.barIndex + 1}
        notes={chartNotes} onSave={saveChartAnnotation} onDelete={deleteChartAnnotation}
        onClose={() => setAnnotationOpen(false)} />, document.body)}
    {journalOpen && createPortal(
      <SessionJournalSheet chartTitle={hasMusicContent ? chart.title : routine?.title ?? 'Free Practice'} sessionId={sessionDraftId.current}
        seconds={elapsedSeconds} entries={journalEntries} onSave={saveJournalEntry}
        onDelete={deleteJournalEntry} onClose={() => setJournalOpen(false)} />, document.body)}
    {addSectionOpen && createPortal(
      <AddPracticeSectionSheet maxBar={chart.bars.length} onAdd={addInlineSection}
        onClose={() => setAddSectionOpen(false)} />, document.body)}
    {loopOpen && createPortal(
      <LoopPlanSettings totalBars={chart.bars.length} enabled={loopEnabled} sections={loopSections}
        repeatPlan={repeatWholePlan} onApply={applyLoop} onClose={closeLoop} />,
      document.querySelector('.app-shell') ?? document.body
    )}
    {activeTool && (activeTool === 'metronome'
      ? createPortal(<PracticeMetronomeSheet controller={metronome} onClose={closeTool} chartAvailable={hasMusicContent} />, document.body)
      : createPortal(
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
        <TunerPage onClose={closeTool} />
      </div>,
      document.querySelector('.app-shell') ?? document.body
    ))}
    </>
  );
}
