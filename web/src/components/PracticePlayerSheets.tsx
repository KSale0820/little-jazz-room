import { useEffect, useRef, useState } from 'react';
import type { ChartNote, PracticeJournalEntry } from '../lib/practicePlayerNotes';
import { readPitchSnapshots, sameLocalDay, type TunerPitchSnapshot } from '../lib/tunerPitchHistory';
import { pitchTrailGeometry } from '../pages/toolsAudio';
import { INLINE_ANNOTATION_LIMIT, chartAnnotationDisplay } from '../lib/practicePlayerNotes';
import './PracticePlayerSheets.css';

function Sheet({ title, children, onClose, tone = 'green' }: {
  title: string; children: React.ReactNode; onClose: () => void; tone?: 'green' | 'red';
}) {
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheet.current?.querySelector<HTMLElement>('input,textarea,button')?.focus();
    return () => previous?.focus?.();
  }, []);
  const keyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = [...(sheet.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)') ?? [])];
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <div className="practice-sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={sheet} className={'practice-feature-sheet practice-feature-sheet-' + tone}
      role="dialog" aria-modal="true" aria-label={title} onKeyDown={keyDown}>
      <header><h2>{title}</h2><button type="button" className="practice-feature-close" aria-label={'Close ' + title} onClick={onClose}>×</button></header>
      {children}
    </div>
  </div>;
}

export function ChartAnnotationSheet({ chartTitle, totalBars, initialBar, notes, onSave, onDelete, onClose }: {
  chartTitle: string; totalBars: number; initialBar: number; notes: ChartNote[];
  onSave: (bar: number, text: string) => void; onDelete: (bar: number) => void; onClose: () => void;
}) {
  const initial = Math.min(totalBars, Math.max(1, initialBar));
  const [bar, setBar] = useState(initial);
  // Keep the number being typed separate from the committed measure. Clamping on
  // each keystroke makes entering 13, 25, etc. impossible on mobile keyboards.
  const [barInput, setBarInput] = useState(String(initial));
  const [text, setText] = useState(() => notes.find(n => n.bar === initial)?.text ?? '');
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  function selectBar(value: number) {
    const next = Math.min(totalBars, Math.max(1, Math.trunc(value)));
    if (!Number.isFinite(next)) return;
    setBarInput(String(next));
    if (next === bar) return;
    const original = notes.find(n => n.bar === bar)?.text ?? '';
    const nextSaved = notes.find(n => n.bar === next)?.text;
    // Typing before changing the bar must not erase the note. The user may be
    // correcting which measure it belongs to; carry it to an empty destination
    // while also preserving the original draft if they navigate back.
    const nextText = drafts[next] ?? nextSaved ?? (text !== original ? text : '');
    setDrafts(previous => ({ ...previous, [bar]: text }));
    setText(nextText);
    setBar(next);
  }
  function commitTypedBar() {
    const parsed = Number(barInput);
    if (!/^\d+$/.test(barInput) || !Number.isInteger(parsed) || parsed < 1 || parsed > totalBars) {
      setBarInput(String(bar));
      return;
    }
    selectBar(parsed);
  }
  function updateDraft(value: string) {
    setText(value);
    setDrafts(previous => ({ ...previous, [bar]: value }));
  }
  const cleaned = text.trim();
  const long = chartAnnotationDisplay(cleaned) === 'bubble';
  return <Sheet title="Chart Annotations" tone="red" onClose={onClose}>
    <p className="practice-feature-subtitle">Add tiny red instructions directly to the chart for {chartTitle}.</p>
    <div className="practice-feature-fieldline">
      <label htmlFor="chart-note-bar">Measure</label>
      <div className="practice-feature-bar-controls">
        <button type="button" aria-label="Previous measure" disabled={bar <= 1}
          onClick={() => selectBar(bar - 1)}>−</button>
        <input id="chart-note-bar" type="text" inputMode="numeric" pattern="[0-9]*"
          aria-label={`Measure number, 1 through ${totalBars}`} autoComplete="off"
          value={barInput} onFocus={event => event.currentTarget.select()}
          onChange={event => setBarInput(event.target.value.replace(/\D/g, '').slice(0, 3))}
          onBlur={commitTypedBar}
          onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
        <button type="button" aria-label="Next measure" disabled={bar >= totalBars}
          onClick={() => selectBar(bar + 1)}>+</button>
      </div>
    </div>
    <label className="practice-feature-label" htmlFor="chart-note-text">Annotation</label>
    <textarea id="chart-note-text" rows={3} maxLength={240} value={text} onChange={e => updateDraft(e.target.value)}
      placeholder="e.g. Tag, End, 5×, rubato" />
    <div className="practice-feature-help" aria-live="polite">
      <span>{cleaned.length} / {INLINE_ANNOTATION_LIMIT} inline characters</span>
      <strong className={long ? 'note-long' : ''}>{long
        ? 'This note is too long for a measure and will appear as a chart bubble.'
        : 'Short annotations appear directly in the measure.'}</strong>
    </div>
    <div className="practice-feature-actions">
      {notes.some(n => n.bar === bar) && <button type="button" className="practice-feature-danger" onClick={() => { onDelete(bar); updateDraft(''); }}>Remove</button>}
      <button type="button" onClick={onClose}>Cancel</button>
      <button type="button" className="practice-feature-primary" disabled={!cleaned} onClick={() => { onSave(bar, cleaned); onClose(); }}>Save Annotation</button>
    </div>
    {notes.length > 0 && <div className="practice-feature-history">
      <h3>My chart annotations</h3>
      {notes.slice().sort((a,b) => a.bar - b.bar).map(n => <button type="button" key={n.bar} onClick={() => selectBar(n.bar)}>
        <strong>Bar {n.bar}</strong><span>{n.text}</span>
      </button>)}
    </div>}
  </Sheet>;
}

function PitchJournalPreview({ snapshot }: { snapshot: TunerPitchSnapshot }) {
  const geometry = pitchTrailGeometry(snapshot.samples, snapshot.durationMs, Math.max(8000, snapshot.durationMs));
  return <div className="practice-pitch-preview">
    <strong>Pitch check · {new Date(snapshot.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
    <svg viewBox="0 0 320 102" preserveAspectRatio="none" role="img" aria-label="Saved frequency measurements with silent gaps">
      {geometry.segments.map((segment, i) => <polyline key={i} fill="none"
        stroke="#397456" strokeWidth="2.5" strokeLinejoin="round"
        points={segment.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')} />)}
    </svg>
    <small>{geometry.lowNote} – {geometry.highNote} · {Math.round(snapshot.durationMs / 1000)} seconds</small>
  </div>;
}

export function SessionJournalSheet({ chartTitle, sessionId, seconds, entries, userScope, onSave, onDelete, onClose }: {
  chartTitle: string; sessionId: string; seconds: number; entries: PracticeJournalEntry[];
  userScope: string;
  onSave: (text: string, pitchCaptureIds: string[]) => void;
  onDelete: (id: string) => void; onClose: () => void;
}) {
  const existing = entries.find(e => e.sessionId === sessionId);
  const [text, setText] = useState(existing?.text ?? '');
  const [linkedPitchIds, setLinkedPitchIds] = useState<string[]>(existing?.pitchCaptureIds ?? []);
  const [savedPitch] = useState(() => readPitchSnapshots(userScope));
  const todayPitch = savedPitch.filter(snapshot =>
    sameLocalDay(snapshot.savedAt, existing?.createdAt ?? new Date().toISOString()));
  const [all, setAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const ordered = entries.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  const recent = all ? ordered : ordered.slice(0, 4);
  return <Sheet title="Session Journal" onClose={onClose}>
    <div className="practice-feature-session-summary">
      <strong>{chartTitle}</strong><span>This session · {Math.floor(seconds / 60)}m {seconds % 60}s practiced</span>
    </div>
    <label className="practice-feature-label" htmlFor="journal-entry">What did you practice today?</label>
    <textarea id="journal-entry" rows={5} maxLength={4000} value={text} onChange={e => setText(e.target.value)}
      placeholder="What went well? What would you like to work on next?" />
    {todayPitch.length ? <fieldset className="practice-pitch-attach">
      <legend>Attach today's tuner pitch checks</legend>
      {todayPitch.map(snapshot => <label key={snapshot.id}>
        <input type="checkbox" checked={linkedPitchIds.includes(snapshot.id)}
          onChange={event => setLinkedPitchIds(previous => event.target.checked
            ? [...previous, snapshot.id] : previous.filter(id => id !== snapshot.id))} />
        <span>{new Date(snapshot.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {snapshot.mode} · {Math.round(snapshot.durationMs / 1000)}s</span>
      </label>)}
    </fieldset> : <p className="practice-feature-local-note">Save a pitch check in the Tuner to attach its chart to today's journal.</p>}
    <div className="practice-feature-actions">
      <button type="button" onClick={onClose}>Cancel</button>
      <button type="button" className="practice-feature-primary" disabled={!text.trim() && !linkedPitchIds.length}
        onClick={() => onSave(text.trim(), linkedPitchIds)}>Save Entry</button>
    </div>
    <div className="practice-feature-history">
      <div className="practice-feature-history-heading"><h3>Past Journals</h3>
        {ordered.length > 4 && <button type="button" onClick={() => setAll(v => !v)}>{all ? 'Show fewer' : 'View all'}</button>}</div>
      {!ordered.length && <p className="practice-feature-empty">Your saved practice reflections will appear here.</p>}
      {recent.map(entry => <div className="practice-feature-journal-card" key={entry.id}>
        <button type="button" onClick={() => setExpanded(v => v === entry.id ? null : entry.id)} aria-expanded={expanded === entry.id}>
          <strong>{entry.chartTitle}</strong><small>{new Date(entry.updatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</small>
          <span>{expanded === entry.id ? entry.text : entry.text.slice(0, 100) + (entry.text.length > 100 ? '…' : '')}</span>
          {entry.pitchCaptureIds?.length ? <small>{entry.pitchCaptureIds.length} pitch chart{entry.pitchCaptureIds.length === 1 ? '' : 's'} attached</small> : null}
        </button>
        {expanded === entry.id && entry.pitchCaptureIds?.map(id => {
          const snapshot = savedPitch.find(item => item.id === id);
          return snapshot ? <PitchJournalPreview key={id} snapshot={snapshot} /> : null;
        })}
        {expanded === entry.id && <button className="practice-feature-delete" type="button" onClick={() => onDelete(entry.id)}>Delete entry</button>}
      </div>)}
    </div>
    <p className="practice-feature-local-note">Journals are saved on this device for your current account.</p>
  </Sheet>;
}

export function AddPracticeSectionSheet({ maxBar, onAdd, onClose }: {
  maxBar: number; onAdd: (name: string, start: number, end: number) => void; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(Math.min(maxBar, 8));
  const valid = name.trim().length > 0 && start >= 1 && end <= maxBar && end >= start;
  return <Sheet title="+ Add Section" onClose={onClose}>
    <p className="practice-feature-subtitle">Create a loop over a custom bar range. It will appear in the Loop row.</p>
    <label className="practice-feature-label" htmlFor="new-section-label">Section name</label>
    <input id="new-section-label" maxLength={18} value={name} placeholder="e.g. Bridge, Solo, D" onChange={e => setName(e.target.value)} />
    <div className="practice-feature-split">
      <label>Start bar<input type="number" min={1} max={maxBar} value={start} onChange={e => setStart(Number(e.target.value))} /></label>
      <label>End bar<input type="number" min={1} max={maxBar} value={end} onChange={e => setEnd(Number(e.target.value))} /></label>
    </div>
    <div className="practice-feature-preview"><strong>Range preview</strong><span>{valid ? 'Bars ' + start + '–' + end + ' (' + (end - start + 1) + ' bars)' : 'Choose a valid range and name'}</span></div>
    <div className="practice-feature-actions"><button type="button" onClick={onClose}>Cancel</button>
      <button type="button" className="practice-feature-primary" disabled={!valid} onClick={() => { onAdd(name.trim(),start,end); onClose(); }}>Add Section</button>
    </div>
  </Sheet>;
}
