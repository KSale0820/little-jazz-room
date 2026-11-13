import type { PracticeJournalEntry, ChartNote } from '../lib/practicePlayerNotes';
import type { PracticeSessionRecord, Routine, Exercise, Chart } from '../types/content';
import { colorForTag, type JournalTagDefinition } from '../lib/journalTagPalette';
import { JournalSectionIcon } from '../components/JournalSectionIcon';
import { TunerPitchGraph } from '../components/TunerPitchGraph';
import { readPitchSnapshots, type TunerPitchSnapshot } from '../lib/tunerPitchHistory';

type Annotation = ChartNote & { chartId: string; chartTitle: string };
interface Props {
  day: string;
  userScope: string;
  sessions: PracticeSessionRecord[];
  entries: PracticeJournalEntry[];
  annotations: Annotation[];
  routines: Routine[];
  exercises: Exercise[];
  charts: Chart[];
  palette: JournalTagDefinition[];
  onBack: () => void;
  onEdit: () => void;
  onEditEntry: (entry: PracticeJournalEntry) => void;
  onOpenChart: (id: string) => void;
  onOpenRoutine: (id: string) => void;
}
const dateOf = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
const mins = (seconds: number) => Math.round(Math.max(0, seconds || 0) / 60);
function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n+/).map((line, i) => line.trim() ? <p key={i}>{line}</p> : null)}</>;
}
export function DailyJournalSheet({ day, userScope, sessions, entries, annotations, routines, exercises, charts, palette, onBack, onEdit, onEditEntry, onOpenChart, onOpenRoutine }: Props) {
  const datedSessions = sessions.filter(s => dateOf(s.finishedAt) === day).sort((a,b) => a.finishedAt.localeCompare(b.finishedAt));
  const datedEntries = entries.filter(e => dateOf(e.createdAt) === day);
  const datedNotes = annotations.filter(n => dateOf(n.updatedAt) === day).sort((a,b) => a.bar - b.bar);
  const primary = datedEntries.find(e => e.id.startsWith('daily:')) ?? datedEntries.find(e => e.kind !== 'note') ?? datedEntries[0];
  const totalSeconds = datedSessions.reduce((n,s) => n + Math.max(0,s.durationSeconds),0);
  const loggedMinutes = totalSeconds ? mins(totalSeconds) : Math.max(0, ...datedEntries.map(e => mins(e.durationSeconds)));
  const title = primary?.title?.trim() || (datedSessions.length === 1
    ? (routines.find(r => r.id === datedSessions[0].routineId)?.title ?? datedSessions[0].routineTitle ??
       exercises.find(e => e.id === datedSessions[0].exerciseId)?.title ?? primary?.chartTitle)
    : '') || (datedSessions.length ? 'Today’s practice' : primary?.chartTitle || 'Practice notes');
  const tags = unique(datedEntries.flatMap(e => e.tags ?? []).concat(datedNotes.flatMap(n => n.tags ?? [])));
  const moment = datedSessions.at(-1)?.finishedAt || primary?.createdAt || day + 'T12:00:00';
  const dateText = new Date(day + 'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const timeText = datedSessions.length ? new Date(moment).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}) + ' last session' : '';
  const chartIds = unique([...datedEntries.map(e => e.chartId), ...datedNotes.map(n => n.chartId)]).filter(id => charts.some(c => c.id === id));
  const routineIds = unique(datedSessions.map(s=>s.routineId??'')).filter(id => routines.some(r=>r.id===id));
  const notesText = datedEntries.filter(e => e.text?.trim() && !datedSessions.some(s => s.id === e.sessionId));
  const practicedText = datedEntries.filter(e => e.whatPracticed?.trim());
  const takeaways = datedEntries.filter(e => e.takeaways?.trim());
  const nextTimes = datedEntries.filter(e => e.nextTime?.trim());
  const pitchSnapshots = readPitchSnapshots(userScope);
  const linkedPitchIds = unique(datedEntries.flatMap(e => e.pitchCaptureIds ?? []));
  const linkedPitchGraphs = linkedPitchIds.map(id => pitchSnapshots.find(s => s.id === id))
    .filter((snapshot): snapshot is TunerPitchSnapshot => Boolean(snapshot));
  const fmtSession = (s: PracticeSessionRecord) => routines.find(r=>r.id===s.routineId)?.title ?? s.routineTitle ??
    exercises.find(e=>e.id===s.exerciseId)?.title ?? 'Free practice';

  return <section className="pj-page pj-detail" aria-label={'Practice journal for '+day}>
    <header className="pj-top pj-detail-nav">
      <button type="button" className="pj-back" aria-label="Back to Practice Journal" onClick={onBack}>‹</button>
      <strong>Practice Journal</strong>
      <button type="button" className="pj-pencil" aria-label="Edit journal entry" onClick={onEdit}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 5l6 6M4 20l4.5-1L20 7.5 16.5 4 5 15.5z"/></svg>
      </button>
    </header>
    <div className="pj-detail-meta"><JournalSectionIcon name="calendar" /><time dateTime={day}>{dateText}</time>
      {timeText && <span>· {timeText}</span>}<span>· {loggedMinutes} min practiced</span></div>
    <h1 className="pj-detail-title">{title}</h1>
    {tags.length > 0 && <div className="pj-chips pj-detail-chips">{tags.map(tag =>
      <span key={tag} className={'pj-chip pj-' + colorForTag(palette,tag)}>{tag}</span>)}</div>}

    <section className="pj-detail-section pj-tint-sage" aria-label="What I practiced">
      <h2><JournalSectionIcon name="list" />What I practiced</h2>
      {datedSessions.length === 0 && practicedText.length === 0 && datedNotes.length === 0 && <p className="pj-muted">No activities recorded for this date.</p>}
      {datedSessions.map(s => <div key={s.id} className="pj-detail-practiced">
        <span className="pj-completed" aria-label="Saved session">✓</span>
        <div><strong>{fmtSession(s)}</strong><small>{mins(s.durationSeconds)} min · {s.routineId ? 'Routine' : s.exerciseId ? 'Exercise' : 'Free practice'}</small>
          {datedEntries.filter(e => e.sessionId && e.sessionId === s.id && e.text?.trim()).map(e =>
            <div className="pj-session-reflection" key={e.id}>{e.title?.trim() && <strong>{e.title}</strong>}
              <Paragraphs text={e.text} />
              <button type="button" className="pj-inline-edit" onClick={() => onEditEntry(e)}>Edit reflection</button>
            </div>)}
        </div>
      </div>)}
      {practicedText.map(e => <div key={e.id} className="pj-detail-note"><Paragraphs text={e.whatPracticed ?? ''} /></div>)}
      {datedEntries.filter(e => e.sessionId && !datedSessions.some(s => s.id === e.sessionId) && e.text?.trim()).map(e =>
        <div key={e.id} className="pj-detail-note"><strong>{e.title || e.chartTitle || 'Practice reflection'}</strong>
          <Paragraphs text={e.text} /><button type="button" className="pj-inline-edit" onClick={() => onEditEntry(e)}>Edit reflection</button></div>)}
      {datedNotes.length > 0 && <div className="pj-measure-notes"><strong>Chart annotations</strong>
        {datedNotes.map(n => <button type="button" key={n.chartId + ':' + n.bar} className="pj-measure-link" onClick={() => onOpenChart(n.chartId)}>
          <span>{n.chartTitle} · bar {n.bar}</span><small>{n.text}</small>
        </button>)}</div>}
    </section>

    <section className="pj-detail-section pj-tint-lilac" aria-label="Notes and observations">
      <h2><JournalSectionIcon name="pencil" />Notes & observations</h2>
      {notesText.length > 0 ? notesText.map(e => <div key={e.id} className="pj-observation">
        <Paragraphs text={e.text} /></div>) :
        <p className="pj-muted">Practice reflections from saved sessions appear above with the activities they describe.</p>}
    </section>
    {linkedPitchGraphs.length > 0 && <section className="practice-pitch-preview pj-detail-section pj-tint-lilac" aria-label="Tuner pitch history">
      <h2>Tuner pitch history</h2>
      {linkedPitchGraphs.map(snapshot => <div key={snapshot.id} className="pj-detail-note">
        <strong>{new Date(snapshot.savedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · recorded pitch</strong>
        <TunerPitchGraph samples={snapshot.samples} savedAt={snapshot.savedAt} compact />
      </div>)}
    </section>}
    <section className="pj-detail-section pj-tint-gold" aria-label="Takeaways">
      <h2><JournalSectionIcon name="lightbulb" />Takeaways</h2>
      {takeaways.length ? takeaways.map(e => <Paragraphs key={e.id} text={e.takeaways ?? ''} />) :
        <p className="pj-muted">What felt better or clicked today?</p>}
    </section>
    <section className="pj-detail-section pj-tint-blue" aria-label="Next time">
      <h2><JournalSectionIcon name="target" />Next time</h2>
      {nextTimes.length ? nextTimes.map(e => <Paragraphs key={e.id} text={e.nextTime ?? ''} />) :
        <p className="pj-muted">Add a focus for your next practice.</p>}
    </section>
    {(chartIds.length > 0 || routineIds.length > 0) && <div className="pj-detail-links">
      {chartIds.map(id => <button type="button" key={id} onClick={() => onOpenChart(id)}>♫ {charts.find(c=>c.id===id)?.title} ↗</button>)}
      {routineIds.map(id => <button type="button" key={id} onClick={() => onOpenRoutine(id)}>▤ {routines.find(r=>r.id===id)?.title} ↗</button>)}
    </div>}
  </section>;
}
