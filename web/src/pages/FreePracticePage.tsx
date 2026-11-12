import { GreatPracticeCompletion, type RecapActivity } from '../components/GreatPracticeCompletion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PracticePage, PracticeToolGlyph, type FreePracticePlayerSession } from './PracticePage';
import { FreePracticeSessionBar } from '../components/FreePracticeSessionBar';
import { SessionJournalSheet } from '../components/PracticePlayerSheets';
import { PracticeMetronomeSheet } from '../components/PracticeMetronomeSheet';
import { usePracticeMetronome } from '../lib/usePracticeMetronome';
import { readLocalList, persistLocalList, journalKey } from '../lib/practicePlayerNotes';
import type { PracticeJournalEntry } from '../lib/practicePlayerNotes';
import { TunerPage } from './TunerPage';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RECORDED_BACKING_TRACKS, hasChartSync, isUsableRecordedTrack } from '../features/recordings/recordingCatalog';
import { readRoutineBookmarks, saveRoutineBookmarks } from '../lib/routineBookmarks';
import type { PracticeSessionRecord } from '../types/content';
import './FreePracticePage.css';

type PracticeKind = 'chart' | 'track' | 'routine';
type SessionItem = { id: string; kind: PracticeKind; sourceId: string; title: string };
type FreeSessionState = {
  items: SessionItem[];
  activeIndex: number;
  id: string;
  elapsedMs: number;
  runningSince: number | null;
};
type PickerTab = 'music' | 'routine';

const recordings = RECORDED_BACKING_TRACKS.filter(recording =>
  isUsableRecordedTrack(recording) && hasChartSync(recording));
const catalogChartIds: Record<string, string> = {
  'blues-f-12': 'after-hours',
  'rhythm-bb-32': 'moonlit',
  'ballad-eb-16': 'staircase',
  'minor-bossa-cm-16': 'sunday',
};
const newSession = (): FreeSessionState => ({
  items: [], activeIndex: 0, id: crypto.randomUUID(), elapsedMs: 0, runningSince: null,
});

function readSession(key: string): FreeSessionState {
  try {
    const saved = sessionStorage.getItem(key);
    // Carry forward an old queue without inheriting the earlier auto-started clock.
    const parsed: unknown = JSON.parse(saved ?? sessionStorage.getItem(key.replace(':v3:', ':v2:')) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return newSession();
    const record = parsed as Partial<FreeSessionState>;
    if (!Array.isArray(record.items) || typeof record.id !== 'string' ||
      typeof record.elapsedMs !== 'number' || !Number.isFinite(record.elapsedMs)) return newSession();
    const items = record.items.filter((entry): entry is SessionItem =>
      Boolean(entry) && typeof entry.id === 'string' && typeof entry.title === 'string' &&
      typeof entry.sourceId === 'string' && ['chart', 'track', 'routine'].includes(entry.kind));
    return {
      id: record.id,
      items,
      activeIndex: Math.max(0, Math.min(items.length - 1, Number(record.activeIndex) || 0)),
      elapsedMs: Math.max(0, record.elapsedMs),
      runningSince: saved !== null && typeof record.runningSince === 'number' ? record.runningSince : null,
    };
  } catch { return newSession(); }
}

function elapsed(state: FreeSessionState, now: number): number {
  return state.elapsedMs + (state.runningSince === null ? 0 : Math.max(0, now - state.runningSince));
}

/**
 * This is a session/queue shell, NOT a second music player. Chart and routine
 * content is rendered by PracticePage, so its real playback and guided lesson
 * code stays authoritative for all three entry points.
 */
export function FreePracticePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { repo, charts, routines, addSession, showToast } = useApp();
  const storageKey = 'little-jazz-room:free-session:v3:' + repo.scope;
  const [session, setSession] = useState<FreeSessionState>(() => readSession(storageKey));
  const [now, setNow] = useState(() => Date.now());
  const [picker, setPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('music');
  const [search, setSearch] = useState('');
  const [activeTool, setActiveTool] = useState<'tuner' | 'metronome' | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalEntries, setJournalEntries] = useState<PracticeJournalEntry[]>(() =>
    readLocalList<PracticeJournalEntry>(journalKey(repo.scope)));
  const [finished, setFinished] = useState<PracticeSessionRecord | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const saveInFlight = useRef(false);
  const returnedCreation = useRef('');
  const metronome = usePracticeMetronome();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (finished) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(session)); } catch { /* Optional browser storage. */ }
  }, [session, storageKey, finished]);

  const seconds = Math.floor(elapsed(session, now) / 1000);
  const active = session.items[session.activeIndex] ?? null;
  const goTo = (index: number) => {
    if (index < 0 || index >= session.items.length) return;
    setSession(previous => ({ ...previous, activeIndex: index }));
  };
  const pauseClock = () => {
    const instant = Date.now();
    setSession(previous => previous.runningSince === null
      ? { ...previous, runningSince: instant }
      : { ...previous, elapsedMs: elapsed(previous, instant), runningSince: null });
    setNow(instant);
  };

  // Leaving practice is different from temporarily visiting a creator:
  // freeze the elapsed clock and store it before the route unmounts.
  const leave = () => {
    const paused = { ...session, elapsedMs: elapsed(session, Date.now()), runningSince: null };
    try { sessionStorage.setItem(storageKey, JSON.stringify(paused)); } catch { /* Optional. */ }
    setSession(paused);
    navigate('/practice');
  };

  function bookmark(kind: PracticeKind, id: string) {
    if (kind === 'routine') {
      const bookmarks = readRoutineBookmarks(repo.scope);
      if (!bookmarks.includes(id)) saveRoutineBookmarks(repo.scope, [...bookmarks, id]);
      return;
    }
    const recording = recordings.find(row => row.id === id || row.chartId === id);
    const catalogId = kind === 'track' ? id : recording?.id ?? catalogChartIds[id] ?? 'chart:' + id;
    // Use the exact saved-items key used by the class-demo Tracks & Charts library.
    const key = 'little-jazz-room:track-favorites:v1:' + (user?.id ?? 'local');
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) ?? '["after-hours"]');
      const current = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
      if (!current.includes(catalogId)) localStorage.setItem(key, JSON.stringify([...current, catalogId]));
    } catch { showToast('Could not save this item to your library on this device.'); }
  }

  function addItem(kind: PracticeKind, id: string, title: string) {
    metronome.stop();
    bookmark(kind, id);
    setSession(previous => ({
      ...previous,
      items: [...previous.items, { id: crypto.randomUUID(), kind, sourceId: id, title }],
      activeIndex: previous.items.length,
    }));
    setPicker(false);
    setSearch('');
  }

  // Builders can return to the same session without resetting the running
  // clock. Their existing save paths append the newly created item here.
  const createdChart = params.get('createdChartId');
  const createdRoutine = params.get('createdRoutineId');
  useEffect(() => {
    const kind: PracticeKind | null = createdChart ? 'chart' : createdRoutine ? 'routine' : null;
    const id = createdChart ?? createdRoutine;
    if (!kind || !id || returnedCreation.current === kind + id) return;
    const item = kind === 'chart'
      ? charts.find(chart => chart.id === id)
      : routines.find(routine => routine.id === id);
    if (!item) return;
    returnedCreation.current = kind + id;
    addItem(kind, id, item.title);
    navigate('/free-practice', { replace: true });
  }, [createdChart, createdRoutine, charts, routines, navigate]);

  const openBuilder = (kind: 'chart' | 'routine') => {
    // Persist synchronously before unmounting the queue for a builder.
    try { sessionStorage.setItem(storageKey, JSON.stringify(session)); }
    catch { showToast('This browser could not preserve your session.'); return; }
    setPicker(false);
    navigate(kind === 'chart'
      ? '/charts/new?returnTo=' + encodeURIComponent('/free-practice')
      : '/create?returnTo=' + encodeURIComponent('/free-practice'));
  };

  const options = pickerTab === 'routine'
    ? routines.map(routine => ({ id: routine.id, title: routine.title,
        detail: routine.steps.length + ' steps · ' + routine.duration_minutes + ' min',
        kind: 'routine' as const }))
    : [
        ...recordings.map(recording => ({ id: recording.id, title: recording.title,
          detail: 'Recording · ' + recording.recordedBpm + ' BPM', kind: 'track' as const })),
        ...charts.map(chart => ({ id: chart.id, title: chart.title,
          detail: 'Chart · ' + chart.bars.length + ' measures', kind: 'chart' as const })),
      ];
  const filtered = options.filter(item =>
    (item.title + ' ' + item.detail).toLowerCase().includes(search.trim().toLowerCase()));

  async function saveSession(record: PracticeSessionRecord) {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSaveStatus('saving');
    try {
      await addSession(record);
      try {
        const key = 'little-jazz-room:practice-feedback:v1:' + record.id;
        const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
        const current = saved && typeof saved === 'object' && !Array.isArray(saved)
          ? saved as Record<string, unknown> : {};
        localStorage.setItem(key, JSON.stringify({
          ...current, items: session.items.map(item =>
            ({ kind: item.kind, title: item.title, sourceId: item.sourceId })),
        }));
      } catch { /* Session record is still saved. */ }
      try { sessionStorage.removeItem(storageKey); } catch { /* Optional. */ }
      // The completion recap is the save confirmation; keep its primary action visible.
      setSaveStatus('saved');
    } catch {
      saveInFlight.current = false;
      setSaveStatus('error');
      showToast('Could not save your practice session. Please retry.');
    }
  }

  const finish = () => {
    if (finished) return;
    const duration = Math.floor(elapsed(session, Date.now()) / 1000);
    if (duration < 1) { showToast('Practice for at least one second before finishing.'); return; }
    const routine = session.items.length === 1 && session.items[0]?.kind === 'routine'
      ? session.items[0] : null;
    const record: PracticeSessionRecord = {
      id: session.id,
      finishedAt: new Date().toISOString(),
      durationSeconds: duration,
      routineId: routine?.sourceId,
      routineTitle: routine?.title,
    };
    setSession(previous => ({ ...previous, elapsedMs: elapsed(previous, Date.now()), runningSince: null }));
    metronome.stop();
    setFinished(record);
    void saveSession(record);
  };

  const restart = () => {
    const fresh = newSession();
    setSession(fresh);
    setFinished(null);
    setSaveStatus('saving');
    saveInFlight.current = false;
    setNow(Date.now());
  };

  const saveJournal = (value: string) => {
    const stamp = new Date().toISOString();
    const existing = journalEntries.find(entry => entry.sessionId === session.id);
    const entry: PracticeJournalEntry = {
      ...existing, id: existing?.id ?? crypto.randomUUID(), sessionId: session.id,
      chartId: '', chartTitle: active?.title ?? 'Free Practice',
      text: value, createdAt: existing?.createdAt ?? stamp, updatedAt: stamp,
      durationSeconds: seconds,
    };
    const next = [...journalEntries.filter(row => row.sessionId !== session.id), entry];
    if (!persistLocalList(journalKey(repo.scope), next)) {
      showToast('Could not save the journal entry.'); return;
    }
    setJournalEntries(next);
    setJournalOpen(false);
    showToast('Journal entry saved.');
  };

  const recapActivities: RecapActivity[] = session.items.map(item => ({
    id: item.id, title: item.title,
    detail: item.kind === 'routine' ? 'Routine' : item.kind === 'chart' ? 'Chord chart' : 'Recorded track',
    status: 'practiced',
  }));
  if (finished) return <GreatPracticeCompletion key={finished.id}
    record={finished}
    title={session.items.length === 1 ? session.items[0].title : 'Free Practice'}
    subtitle={session.items.length ? 'Free Practice · ' + (session.items.length === 1 ? '1 item' : session.items.length + ' items') : 'Open practice · no materials added'}
    activities={recapActivities}
    status={saveStatus}
    onRetry={() => void saveSession(finished)}
    onDone={() => navigate('/practice')}
    onPracticeAgain={restart} />;

  const freePlayer: FreePracticePlayerSession | null = active ? {
    kind: active.kind, sourceId: active.sourceId, sessionId: session.id,
    seconds, clockRunning: session.runningSince !== null,
    onPause: pauseClock, onFinish: finish, onAdd: () => setPicker(true),
    canPrevious: session.activeIndex > 0,
    canNext: session.activeIndex < session.items.length - 1,
    onBack: leave, onPrevious: () => goTo(session.activeIndex - 1),
    onNext: () => goTo(session.activeIndex + 1),
  } : null;

  return <>
    {freePlayer ? <PracticePage key={active!.id} freeSession={freePlayer} /> :
      <section className="practice-player practice-demo-refresh fp-redesign" aria-label="Free Practice">
        <header className="practice-player-head">
          <button className="practice-back" type="button" onClick={leave} aria-label="Back to Practice">‹</button>
          <div className="practice-title-group"><h1>Free Practice</h1></div>
          <button className="fp-header-add" type="button" onClick={() => setPicker(true)}>+ Add...</button>
        </header>
        <section className="fp-blank-content" aria-label="Choose something to practice">
          <h2>Choose something to practice</h2>
          <p>Add a chart, recorded track, or guided routine. Start your practice timer when you're ready.</p>
          <button type="button" className="fp-add-primary" onClick={() => { setPickerTab('music'); setPicker(true); }}>+ Chart / Track</button>
          <button type="button" className="fp-add-secondary" onClick={() => { setPickerTab('routine'); setPicker(true); }}>+ Routine</button>
        </section>
        {session.runningSince === null && <button className="fp-start-timer" type="button" onClick={pauseClock}>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7.5 4.5 19 12 7.5 19.5z" /></svg>
          {seconds > 0 ? 'Resume practice timer' : 'Start practice timer'}
        </button>}
        <div className="practice-utility-row practice-demo-tools fp-simple-tools" aria-label="Practice tools">
          <div className="practice-demo-metronome-wrap">
            <button className="practice-demo-tool-main" type="button" onClick={() => setActiveTool('metronome')}>
              <PracticeToolGlyph name="metronome" /><span>Metronome</span>
            </button>
            <button className={'practice-demo-metronome-switch' + (metronome.playing ? ' is-on' : '')}
              type="button" onClick={metronome.toggle} aria-pressed={metronome.playing}>
              {metronome.playing ? 'On' : 'Off'} <span className="practice-demo-switch-knob" />
            </button>
          </div>
          <button type="button" onClick={() => setActiveTool('tuner')}>
            <PracticeToolGlyph name="tuner" /><span>Tuner</span>
          </button>
        </div>
        <FreePracticeSessionBar seconds={seconds} running={session.runningSince !== null}
          onToggleTimer={pauseClock} canPrevious={false} canNext={false}
          onPrevious={() => {}} onNext={() => {}}
          onFinish={finish} onJournal={() => setJournalOpen(true)} />
      </section>}

    {picker && createPortal(<div className="fp-picker-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) setPicker(false);
    }}>
      <section className="fp-picker-modal" role="dialog" aria-modal="true" aria-labelledby="fp-picker-title"
        onKeyDown={event => { if (event.key === 'Escape') setPicker(false); }}>
        <div className="fp-picker-heading"><h2 id="fp-picker-title">Add to Session</h2>
          <button type="button" aria-label="Close Add to Session" onClick={() => setPicker(false)}>×</button>
        </div>
        <div className="fp-picker-tabs" role="tablist" aria-label="Material type">
          <button type="button" role="tab" aria-selected={pickerTab === 'music'} className={pickerTab === 'music' ? 'selected' : ''}
            onClick={() => { setPickerTab('music'); setSearch(''); }}>Chart / Track</button>
          <button type="button" role="tab" aria-selected={pickerTab === 'routine'} className={pickerTab === 'routine' ? 'selected' : ''}
            onClick={() => { setPickerTab('routine'); setSearch(''); }}>Routine</button>
        </div>
        <input type="search" autoFocus aria-label="Search practice materials" value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={pickerTab === 'routine' ? 'Search routines' : 'Search charts and tracks'} />
        <div className="fp-picker-list" aria-label="Search results">
          {filtered.map(item => <button type="button" key={item.kind + item.id} onClick={() => addItem(item.kind, item.id, item.title)}>
            <span><strong>{item.title}</strong><small>{item.detail}</small></span><span aria-hidden="true">+</span>
          </button>)}
          {!filtered.length && <p>No matching {pickerTab === 'routine' ? 'routines' : 'charts or recordings'}.</p>}
        </div>
        <button type="button" className="fp-create-choice" onClick={() => openBuilder(pickerTab === 'routine' ? 'routine' : 'chart')}>
          + Create my own {pickerTab === 'routine' ? 'routine' : 'chart'}
        </button>
        {pickerTab === 'music' && <p className="fp-picker-help">Recordings are from the library. You can create your own chord charts, but not new audio tracks.</p>}
      </section>
    </div>, document.body)}

    {!active && activeTool && (activeTool === 'metronome'
      ? createPortal(<PracticeMetronomeSheet controller={metronome} chartAvailable={false} onClose={() => setActiveTool(null)} />, document.body)
      : createPortal(<div className="practice-tool-overlay" role="dialog" aria-modal="true" aria-label="Tuner within practice">
          <TunerPage onClose={() => setActiveTool(null)} />
        </div>, document.querySelector('.app-shell') ?? document.body))}
    {!active && journalOpen && createPortal(
      <SessionJournalSheet chartTitle="Free Practice" sessionId={session.id} seconds={seconds}
        entries={journalEntries} onSave={saveJournal}
        onDelete={id => {
          const next = journalEntries.filter(entry => entry.id !== id);
          if (persistLocalList(journalKey(repo.scope), next)) setJournalEntries(next);
        }}
        onClose={() => setJournalOpen(false)} />, document.body)}
  </>;
}
