import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { journalKey, notesKey, persistLocalList, readLocalList, type ChartNote, type PracticeJournalEntry } from '../lib/practicePlayerNotes';
import type { PracticeSessionRecord } from '../types/content';
import { DailyJournalSheet } from './DailyJournalSheet';
import { JournalTagPicker } from '../components/JournalTagPicker';
import { JournalRoutineIcon, journalIconKey, journalIconLabel } from '../components/JournalRoutineIcon';
import { ROUTINE_ICON_KEYS } from '../lib/routinePixelIcons';
import { colorForTag, readJournalTags, saveJournalTag, uniqueJournalTags, type JournalTagColor, type JournalTagDefinition } from '../lib/journalTagPalette';
import './PracticeJournalPage.css';

type Focus = 'calendar' | 'journal' | 'notes';
type SavedAnnotation = ChartNote & { chartId: string; chartTitle: string };
const FOCUS: Focus[] = ['calendar', 'journal', 'notes'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const localDay = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const dateOf = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : localDay(d);
};
const readDate = (value: string) => new Date(value + 'T12:00:00');
const validDate = (value: string | null) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(readDate(value).getTime()) ? value : null;
const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const formatMinutes = (seconds: number) => Math.round(Math.max(0, seconds || 0) / 60);
const uniqueTags = uniqueJournalTags;
const noteLabel = (entry: PracticeJournalEntry) => entry.title?.trim() || entry.chartTitle?.trim() || (entry.kind === 'note' ? 'Practice note' : 'Practice reflection');

function TagChips({ tags, palette }: { tags: string[]; palette: JournalTagDefinition[] }) {
  return <div className="pj-chips">{tags.map(t => <span key={t} className={'pj-chip pj-' + colorForTag(palette, t)}>{t}</span>)}</div>;
}

export function PracticeJournalPage() {
  const { repo, sessions, routines, exercises, charts, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const legacyFocus = location.pathname.split('/').at(-1);
  const requested = FOCUS.find(f => f === legacyFocus) ?? FOCUS.find(f => f === params.get('tab'));
  const focus: Focus = requested ?? 'calendar';
  const today = localDay(new Date());
  const selectedDay = validDate(params.get('selected'));
  const firstDay = selectedDay ?? validDate(params.get('date')) ?? today;
  const detailDay = validDate(params.get('day'));
  const [selectedDate, setSelectedDate] = useState(firstDay);
  const [monthDate, setMonthDate] = useState(() => new Date(readDate(firstDay).getFullYear(), readDate(firstDay).getMonth(), 1));
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [tuneFilter, setTuneFilter] = useState('');
  const [revision, setRevision] = useState(0);
  const [entries, setEntries] = useState<PracticeJournalEntry[]>(() => readLocalList<PracticeJournalEntry>(journalKey(repo.scope)));
  const [draft, setDraft] = useState<PracticeJournalEntry | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<SavedAnnotation | null>(null);
  const [tagDefinitions, setTagDefinitions] = useState<JournalTagDefinition[]>(() => readJournalTags(repo.scope));

  useEffect(() => {
    const reload = () => { setEntries(readLocalList<PracticeJournalEntry>(journalKey(repo.scope))); setTagDefinitions(readJournalTags(repo.scope)); setRevision(n => n + 1); };
    reload();
    window.addEventListener('focus', reload);
    window.addEventListener('storage', reload);
    return () => { window.removeEventListener('focus', reload); window.removeEventListener('storage', reload); };
  }, [repo.scope]);

  const annotations = useMemo<SavedAnnotation[]>(() => charts.flatMap(chart =>
    readLocalList<ChartNote>(notesKey(repo.scope, chart.id))
      .filter(item => item && typeof item.text === 'string' && item.text.trim())
      .map(item => ({ ...item, chartId: chart.id, chartTitle: chart.title }))
  ), [repo.scope, charts, revision]);

  const allTags = useMemo(() => uniqueTags([...tagDefinitions.map(t => t.name), ...entries.flatMap(e => e.tags ?? []), ...annotations.flatMap(n => n.tags ?? [])]), [tagDefinitions, entries, annotations]);
  const allTunes = useMemo(() => [...new Set([...entries.map(e => e.chartTitle), ...annotations.map(n => n.chartTitle)]
    .filter(title => title && title !== 'Free Practice'))].sort(), [entries, annotations]);

  const sessionTitle = (s: PracticeSessionRecord) =>
    routines.find(r => r.id === s.routineId)?.title ?? s.routineTitle ??
    exercises.find(e => e.id === s.exerciseId)?.title ?? 'Free Practice';
  const activeDate = selectedDay ?? validDate(params.get('date')) ?? selectedDate;
  const sessionsForDate = sessions.filter(s => dateOf(s.finishedAt) === activeDate)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  const secondsForDate = sessionsForDate.reduce((sum, s) => sum + Math.max(0, s.durationSeconds), 0);
  const entriesForDate = entries.filter(e => dateOf(e.createdAt) === activeDate).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const annotationsForDate = annotations.filter(n => dateOf(n.updatedAt) === activeDate);

  const searchable = (title: string, body: string, tags: string[], tune: string, date: string) => {
    const haystack = [title, body, tags.join(' '), tune, date].join(' ').toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) &&
      (!tagFilter || tags.includes(tagFilter)) && (!tuneFilter || tune === tuneFilter);
  };
  const journalRows = entries.filter(e => e.kind !== 'note' &&
    searchable(noteLabel(e), [e.text, e.whatPracticed, e.takeaways, e.nextTime].join(' '), e.tags ?? [], e.chartTitle, e.createdAt))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const noteRows = [
    ...entries.filter(e => e.kind === 'note').map(entry => ({ type: 'entry' as const, date: entry.createdAt, entry })),
    ...annotations.map(note => ({ type: 'annotation' as const, date: note.updatedAt, note })),
  ].filter(item => item.type === 'entry'
    ? searchable(noteLabel(item.entry), item.entry.text, item.entry.tags ?? [], item.entry.chartTitle, item.date)
    : searchable(item.note.chartTitle + ' bar ' + item.note.bar, item.note.text, item.note.tags ?? [], item.note.chartTitle, item.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthYear = monthDate.getFullYear(), monthIndex = monthDate.getMonth();
  const monthStart = new Date(monthYear, monthIndex, 1);
  const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();
  const dayDots = (date: string) => {
    const tags = entries.filter(e => dateOf(e.createdAt) === date).flatMap(e => e.tags ?? []);
    const noteTags = annotations.filter(n => dateOf(n.updatedAt) === date).flatMap(n => n.tags ?? []);
    const practiced = sessions.some(s => dateOf(s.finishedAt) === date);
    const colors = [...new Set([...tags, ...noteTags].map(t => colorForTag(tagDefinitions, t)))].slice(0, 3);
    return colors.length ? colors : practiced || entries.some(e => dateOf(e.createdAt) === date) || annotations.some(n => dateOf(n.updatedAt) === date) ? ['sage'] : [];
  };

  const goFocus = (next: Focus) => {
    setQuery(''); setTagFilter(''); setTuneFilter('');
    navigate('/progress/practice-journal?tab=' + next);
  };
  const selectedQuery = focus === 'calendar' ? '&date=' + activeDate : '';
  const openDay = (day: string, entryId?: string) => navigate(
    '/progress/practice-journal?tab=' + focus + selectedQuery + '&day=' + day +
    (entryId ? '&entry=' + encodeURIComponent(entryId) : '')
  );
  const backToJournal = () => navigate('/progress/practice-journal?tab=' + focus + selectedQuery);
  const chooseDate = (day: string) => {
    setSelectedDate(day);
    const date = readDate(day);
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
    // Selecting a date highlights it and updates the summary below; it never opens the journal sheet.
    navigate('/progress/practice-journal?tab=calendar&date=' + day, { replace: true });
  };
  const shiftMonth = (delta: number) => {
    const next = new Date(monthYear, monthIndex + delta, 1);
    setMonthDate(next);
    setSelectedDate(localDay(next));
    navigate('/progress/practice-journal?tab=calendar&date=' + localDay(next), { replace: true });
  };
  const journalEntryForDate = (day: string) => {
    const dated = entries.filter(e => dateOf(e.createdAt) === day && e.kind !== 'note');
    return dated.find(e => e.id.startsWith('daily:')) ??
      dated.find(e => !e.sessionId) ?? dated[0];
  };
  const editSourceEntry = (entry: PracticeJournalEntry) => {
    setEditingAnnotation(null);
    setDraft({ ...entry, tags: [...(entry.tags ?? [])] });
  };
  const makeEntry = (kind: 'journal' | 'note' = 'journal') => {
    const targetDay = focus === 'calendar' ? activeDate : today;
    // A day has one editable journal record; never create a competing journal entry through Add.
    if (kind === 'journal') {
      const existing = journalEntryForDate(targetDay);
      if (existing) { editSourceEntry(existing); return; }
    }
    const when = readDate(targetDay).toISOString();
    setEditingAnnotation(null);
    setDraft({ id: crypto.randomUUID(), sessionId: '', chartId: '', chartTitle: '', title: '',
      kind, text: '', tags: [], createdAt: when, updatedAt: when, durationSeconds: 0 });
  };
  const openEntry = (entry: PracticeJournalEntry) => openDay(dateOf(entry.createdAt), entry.id);
  const openAnnotation = (note: SavedAnnotation) => openDay(dateOf(note.updatedAt));
  const editDay = () => {
    if (!detailDay) return;
    const current = entries.filter(e => dateOf(e.createdAt) === detailDay);
    const requestedEntryId = params.get('entry');
    const primary = current.find(e => e.id === requestedEntryId) ??
      journalEntryForDate(detailDay) ?? current[0];
    const existing = primary ?? {
      id: 'daily:' + detailDay, sessionId: '', chartId: '', chartTitle: '', kind: 'journal' as const,
      title: '', text: '', createdAt: readDate(detailDay).toISOString(),
      updatedAt: new Date().toISOString(), durationSeconds: 0, tags: [],
    };
    setEditingAnnotation(null);
    setDraft({ ...existing, tags: [...(existing.tags ?? [])] });
  };
  const saveEntry = () => {
    if (!draft) return;
    if (!draft.title?.trim() && !draft.text.trim() && !draft.whatPracticed?.trim() &&
        !draft.takeaways?.trim() && !draft.nextTime?.trim() && !(draft.tags?.length)) {
      showToast('Add a title or a note before saving.'); return;
    }
    const current = readLocalList<PracticeJournalEntry>(journalKey(repo.scope));
    const existing = current.find(e => e.id === draft.id);
    const entry: PracticeJournalEntry = { ...existing, ...draft, tags: uniqueTags(draft.tags ?? []),
      title: draft.title?.trim(), updatedAt: new Date().toISOString() };
    const next = [entry, ...current.filter(e => e.id !== entry.id)];
    if (!persistLocalList(journalKey(repo.scope), next)) { showToast('Could not save journal changes on this device.'); return; }
    setEntries(next);
    setDraft(null);
    setRevision(n => n + 1);
    openDay(dateOf(entry.createdAt), entry.id);
    showToast('Saved to your journal.');
  };
  const saveAnnotation = () => {
    if (!editingAnnotation) return;
    const { chartId, bar, text, tags } = editingAnnotation;
    const current = readLocalList<ChartNote>(notesKey(repo.scope, chartId));
    const next = [...current.filter(n => n.bar !== bar), { bar, text, tags: uniqueTags(tags ?? []), updatedAt: new Date().toISOString() }].sort((a, b) => a.bar - b.bar);
    if (!persistLocalList(notesKey(repo.scope, chartId), next)) { showToast('Could not save chart note.'); return; }
    setEditingAnnotation(null); setRevision(n => n + 1); showToast('Chart note saved.');
  };
  const linkSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    setDraft(previous => previous ? { ...previous, sessionId: id, durationSeconds: session?.durationSeconds ?? previous.durationSeconds,
      chartTitle: session ? sessionTitle(session) : previous.chartTitle } : previous);
  };
  const activeTags = draft?.tags ?? editingAnnotation?.tags ?? [];
  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    if (draft) setDraft(d => d ? { ...d, tags: uniqueTags([...(d.tags ?? []), tag]) } : d);
    if (editingAnnotation) setEditingAnnotation(d => d ? { ...d, tags: uniqueTags([...(d.tags ?? []), tag]) } : d);
  };
  const removeTag = (tag: string) => {
    if (draft) setDraft(d => d ? { ...d, tags: (d.tags ?? []).filter(t => t !== tag) } : d);
    if (editingAnnotation) setEditingAnnotation(d => d ? { ...d, tags: (d.tags ?? []).filter(t => t !== tag) } : d);
  };
  const setTagColor = (name: string, color: JournalTagColor): boolean => {
    const next = saveJournalTag(repo.scope, name, color);
    if (!next) { showToast('Could not save tag color on this device.'); return false; }
    setTagDefinitions(next);
    return true;
  };

  if (draft || editingAnnotation) return <section className="pj-page pj-editor" aria-label="Edit practice journal">
    <header className="pj-top"><button type="button" className="pj-back" aria-label="Back to journal entry" onClick={() => { setDraft(null); setEditingAnnotation(null); }}>‹</button>
      <strong>{editingAnnotation ? 'Edit chart note' : draft?.kind === 'note' ? 'Edit practice note' : 'Edit practice entry'}</strong>
      <button type="button" className="pj-save" onClick={editingAnnotation ? saveAnnotation : saveEntry}>Save</button></header>
    {draft && <>
      <div className="pj-editor-date-line">{formatDate(draft.createdAt)} · {formatMinutes(draft.durationSeconds)} min practiced</div>
      <label className="pj-field">Title<input value={draft.title ?? ''} placeholder="What did you work on?"
        onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)} /></label>
      <div className="pj-field-row"><label className="pj-field">Date<input type="date" value={dateOf(draft.createdAt)}
        onChange={e => setDraft(d => d ? { ...d, createdAt: readDate(e.target.value || today).toISOString() } : d)} /></label>
        <label className="pj-field">Session<select value={draft.sessionId} onChange={e => linkSession(e.target.value)}>
          <option value="">No linked session</option>
          {sessions.filter(s => dateOf(s.finishedAt) === dateOf(draft.createdAt)).map(s =>
            <option key={s.id} value={s.id}>{sessionTitle(s)} · {formatMinutes(s.durationSeconds)}m</option>)}
        </select></label></div>
      <label className="pj-field">Tune or exercise<input value={draft.chartTitle ?? ''} placeholder="Optional"
        onChange={e => setDraft(d => d ? { ...d, chartTitle: e.target.value } : d)} /></label>
      <details className="pj-icon-picker">
        <summary>Entry icon
          <JournalRoutineIcon iconKey={draft.iconKey}
            title={[draft.title, draft.chartTitle].join(' ')} tags={draft.tags} />
          <span>Choose a pixel icon</span>
        </summary>
        <div className="pj-icon-picker-grid" role="group" aria-label="Choose journal icon">
          {ROUTINE_ICON_KEYS.map(key => <button type="button" key={key}
            className={journalIconKey(draft.iconKey, [draft.title, draft.chartTitle].join(' '), draft.tags) === key ? 'selected' : ''}
            aria-pressed={journalIconKey(draft.iconKey, [draft.title, draft.chartTitle].join(' '), draft.tags) === key}
            aria-label={'Select ' + journalIconLabel(key) + ' icon'}
            onClick={() => setDraft(d => d ? { ...d, iconKey: key } : d)}>
            <JournalRoutineIcon iconKey={key} title="" /><span>{journalIconLabel(key)}</span>
          </button>)}
        </div>
      </details>
    </>}
    {editingAnnotation && <div className="pj-related">Linked to <strong>{editingAnnotation.chartTitle}</strong> · Bar {editingAnnotation.bar}
      <button type="button" onClick={() => navigate('/player?chart=' + encodeURIComponent(editingAnnotation.chartId))}>Open chart ›</button></div>}
    <JournalTagPicker selected={activeTags} definitions={tagDefinitions} onAdd={addTag} onRemove={removeTag}
      onSetColor={setTagColor} />
    {draft?.kind !== 'note' && draft && <label className="pj-field pj-tint-sage">What I practiced<textarea rows={3} value={draft.whatPracticed ?? ''}
      placeholder="Exercises, tempos, keys, sections…" onChange={e => setDraft(d => d ? { ...d, whatPracticed: e.target.value } : d)} /></label>}
    <label className="pj-field pj-tint-lilac">Notes & observations<textarea rows={5} value={draft?.text ?? editingAnnotation?.text ?? ''}
      placeholder="What did you notice? What needs work?"
      onChange={e => { if (draft) setDraft(d => d ? { ...d, text: e.target.value } : d);
        else setEditingAnnotation(d => d ? { ...d, text: e.target.value } : d); }} /></label>
    {draft?.kind !== 'note' && draft && <>
      <label className="pj-field pj-tint-gold">Takeaways<textarea rows={3} value={draft.takeaways ?? ''}
        placeholder="What clicked today?" onChange={e => setDraft(d => d ? { ...d, takeaways: e.target.value } : d)} /></label>
      <label className="pj-field pj-tint-blue">Next time<textarea rows={3} value={draft.nextTime ?? ''}
        placeholder="One specific thing to revisit…" onChange={e => setDraft(d => d ? { ...d, nextTime: e.target.value } : d)} /></label>
    </>}
    <button type="button" className="pj-primary" onClick={editingAnnotation ? saveAnnotation : saveEntry}>Save changes</button>
  </section>;

  if (detailDay) return <DailyJournalSheet day={detailDay} userScope={repo.scope} sessions={sessions} entries={entries} annotations={annotations}
    routines={routines} exercises={exercises} charts={charts} palette={tagDefinitions}
    onBack={backToJournal} onEdit={editDay} onEditEntry={editSourceEntry}
    onOpenChart={id => navigate('/player?chart=' + encodeURIComponent(id))}
    onOpenRoutine={id => navigate('/player?routine=' + encodeURIComponent(id))} />;

  const activeJournalEntry = journalEntryForDate(activeDate);
  return <section className="pj-page" aria-label="Practice Journal">
    <header className="pj-heading"><button type="button" className="pj-back" onClick={() => navigate('/progress')} aria-label="Back to Progress">‹</button>
      <div><small>Little Jazz Room</small><h1>Practice Journal</h1></div>
      <button type="button" className="pj-plus" aria-label={focus === 'notes' ? 'New note' :
        journalEntryForDate(focus === 'calendar' ? activeDate : today) ? 'Edit journal entry' : 'New journal entry'}
        onClick={() => makeEntry(focus === 'notes' ? 'note' : 'journal')}>
        {focus !== 'notes' && journalEntryForDate(focus === 'calendar' ? activeDate : today)
          ? <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
          </svg>
          : <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}
      </button></header>
    <nav className="pj-tabs" aria-label="Journal focus">
      {FOCUS.map(f => <button type="button" key={f} className={focus === f ? 'active' : ''} aria-current={focus === f ? 'page' : undefined}
        onClick={() => goFocus(f)}>{f === 'calendar' ? 'Calendar' : f === 'journal' ? 'Journal' : 'Notes'}</button>)}
    </nav>

    {focus !== 'calendar' && <div className="pj-filters">
      <label className="pj-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><input value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search notes, tags, tunes, or topics…" aria-label="Search practice journal" /></label>
      <div className="pj-filter-row">
        <button type="button" className={!tagFilter && !tuneFilter ? 'active' : ''} onClick={() => { setTagFilter(''); setTuneFilter(''); }}>All</button>
        <select aria-label="Filter by tag" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
          <option value="">All tags</option>{allTags.map(t => <option key={t} value={t}>{t}</option>)}</select>
        <select aria-label="Filter by tune" value={tuneFilter} onChange={e => setTuneFilter(e.target.value)}>
          <option value="">All tunes</option>{allTunes.map(t => <option key={t} value={t}>{t}</option>)}</select>
      </div></div>}

    {focus === 'calendar' && <>
      <section className="pj-calendar-panel">
        <div className="pj-month"><button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <strong>{monthStart.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</strong>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">›</button></div>
        <div className="pj-grid" role="group" aria-label="Practice calendar">
          {WEEKDAYS.map(day => <span key={day} className="pj-weekday">{day}</span>)}
          {Array.from({ length: monthStart.getDay() }, (_, i) => <span aria-hidden="true" key={'gap' + i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = localDay(new Date(monthYear, monthIndex, i + 1));
            const dots = dayDots(date);
            return <button type="button" key={date} onClick={() => chooseDate(date)}
              className={'pj-day ' + (activeDate === date ? 'selected' : '')}
              aria-pressed={activeDate === date} aria-label={date + (dots.length ? ', practice recorded' : ', no records')}>
              <span>{i + 1}</span><span className="pj-dots" aria-hidden="true">{dots.map((tone, n) => <i key={n} className={'pj-dot pj-' + tone} />)}</span>
            </button>;
          })}
        </div>
      </section>
      <div className="pj-day-heading"><h2>{readDate(activeDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h2>
        <span>{formatMinutes(secondsForDate)} min practiced</span></div>
      {(sessionsForDate.length > 0 || entriesForDate.length > 0 || annotationsForDate.length > 0)
        ? <button type="button" className="pj-card pj-day-summary" onClick={() => openDay(activeDate)}>
          <JournalRoutineIcon
            iconKey={journalEntryForDate(activeDate)?.iconKey}
            title={journalEntryForDate(activeDate)?.title || journalEntryForDate(activeDate)?.chartTitle ||
              (sessionsForDate[0] ? sessionTitle(sessionsForDate[0]) : 'Practice')}
            tags={entriesForDate.flatMap(e => e.tags ?? [])} />
          <span className="pj-summary-content">
            <small className="pj-summary-kicker">DAILY PRACTICE</small>
            <strong>{activeJournalEntry ? noteLabel(activeJournalEntry) : 'Practice activity'}</strong>
            <small>{sessionsForDate.length} {sessionsForDate.length === 1 ? 'session' : 'sessions'} · {entriesForDate.length} {entriesForDate.length === 1 ? 'reflection' : 'reflections'} · {annotationsForDate.length} chart {annotationsForDate.length === 1 ? 'note' : 'notes'}</small>
            <TagChips palette={tagDefinitions} tags={uniqueTags([...entriesForDate.flatMap(e => e.tags ?? []), ...annotationsForDate.flatMap(n => n.tags ?? [])])} />
          </span>
          <b aria-hidden="true">›</b>
        </button>
        : <p className="pj-empty">Nothing saved for this day. Add a note to remember what you practiced.</p>}
      {journalEntryForDate(activeDate)
        ? <button type="button" className="pj-primary pj-edit-day" onClick={() => makeEntry('journal')}>
          <span aria-hidden="true">✎</span> Edit journal entry
        </button>
        : <button type="button" className="pj-primary" onClick={() => makeEntry('journal')}>+ Add journal entry</button>}
    </>}

    {focus === 'journal' && <>
      <div className="pj-list-heading"><h2>Journal entries</h2><span>{new Set(journalRows.map(e => dateOf(e.createdAt))).size} days</span></div>
      {journalRows.filter((entry, i) => journalRows.findIndex(e => dateOf(e.createdAt) === dateOf(entry.createdAt)) === i)
        .map(entry => <button type="button" className="pj-card pj-row" key={dateOf(entry.createdAt)} onClick={() => openEntry(entry)}>
        <span className="pj-date-badge">{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short' })}<b>{new Date(entry.createdAt).getDate()}</b></span>
        <JournalRoutineIcon iconKey={entry.iconKey} title={entry.title || entry.chartTitle} tags={entry.tags} />
        <div><small>{formatDate(entry.createdAt)} · {formatMinutes(entry.durationSeconds)} min</small>
          <strong>{noteLabel(entry)}</strong><TagChips palette={tagDefinitions} tags={entry.tags ?? []} />
          <p>{entry.text || entry.whatPracticed || entry.nextTime || 'Open entry'}</p></div><b>›</b>
      </button>)}
      {!journalRows.length && <p className="pj-empty">{entries.length ? 'No entries match those filters.' : 'Your reflections will appear here after practice. You can also add a journal entry manually.'}</p>}
      <button type="button" className="pj-primary pj-bottom-add" onClick={() => makeEntry('journal')}>
        {journalEntryForDate(today) ? '✎ Edit today’s journal entry' : '+ New journal entry'}
      </button>
    </>}

    {focus === 'notes' && <>
      <div className="pj-list-heading"><h2>Saved notes</h2><span>{noteRows.length} notes</span></div>
      {noteRows.map(row => <button type="button" className="pj-card pj-row" key={row.type === 'entry' ? row.entry.id : row.note.chartId + ':' + row.note.bar}
        onClick={() => row.type === 'entry' ? openEntry(row.entry) : openAnnotation(row.note)}>
        <img src="/journal/practice-notes.png" alt="" />
        <div><small>{formatDate(row.date)}</small><strong>{row.type === 'entry' ? noteLabel(row.entry) : row.note.chartTitle + ' · Bar ' + row.note.bar}</strong>
          <TagChips palette={tagDefinitions} tags={row.type === 'entry' ? row.entry.tags ?? [] : row.note.tags ?? []} />
          <p>{row.type === 'entry' ? row.entry.text : row.note.text}</p></div><b>›</b>
      </button>)}
      {!noteRows.length && <p className="pj-empty">No notes found. Save a chart annotation during practice or add a note here.</p>}
      <button type="button" className="pj-primary pj-bottom-add" onClick={() => makeEntry('note')}>+ New note</button>
    </>}
  </section>;
}
