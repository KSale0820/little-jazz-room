import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableChartGrid } from '../features/charts/EditableChartGrid';
import {
  CHART_KEYS, blankDraftBar, buildChartFromDraft, chartDraftId, draftFromChart,
  freshChartDraft, mergeDraftChord, normalizeChartKey, pitchClass, renumberDraftBars,
  resizeDraftSplit, retimeDraftBars, splitDraftChord, stepChartKey, transposeDraftChords,
  type ChartDraft, type ChartMeter, type DraftBar,
} from '../features/charts/chartModel';
import { createChartRepository, newLocalChartId } from '../features/charts/chartRepository';
import './ChartBuilderPage.css';

const FEELS = ['Swing', 'Blues', 'Bossa Nova', 'Ballad', 'Straight', 'Other'];

function copyBar(bar: DraftBar): DraftBar {
  return { ...bar, id: chartDraftId(), annotation: bar.annotation,
    events: bar.events.map(event => ({ ...event, id: chartDraftId() })) };
}

export function ChartBuilderPage() {
  const { chartId } = useParams<{ chartId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { repo, charts, refreshLocal } = useApp();
  const chartRepo = useMemo(() => createChartRepository(repo.scope), [repo.scope]);
  const existing = chartId ? charts.find(chart => chart.id === chartId) : undefined;
  const readOnly = Boolean(existing && !existing.is_custom);
  const missing = Boolean(chartId && !existing);
  const storageKey = 'little-jazz-room:chart-edit-draft:v1:' + repo.scope + ':' + (chartId ?? 'new');

  const initialDraft = (): ChartDraft => {
    try {
      const cached: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
      if (cached && typeof cached === 'object' && Array.isArray((cached as ChartDraft).bars)
          && (cached as ChartDraft).bars.length > 0) return cached as ChartDraft;
    } catch { /* session storage may be blocked */ }
    return existing ? draftFromChart(existing) : freshChartDraft();
  };
  const [draft, setDraft] = useState<ChartDraft>(initialDraft);
  const [dirty, setDirty] = useState(false);
  const [keyInput, setKeyInput] = useState(draft.concert_key);
  const [selectedBarId, setSelectedBarId] = useState(draft.bars[0]?.id ?? '');
  const [selectedChordId, setSelectedChordId] = useState(draft.bars[0]?.events[0]?.id ?? '');
  const [annotationEditing, setAnnotationEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initial = initialDraft();
    setDraft(initial);
    setDirty(false);
    setKeyInput(initial.concert_key);
    setSelectedBarId(initial.bars[0]?.id ?? '');
    setSelectedChordId(initial.bars[0]?.events[0]?.id ?? '');
    setAnnotationEditing(false);
    setError('');
    // Reset when route or local account changes; do not reset on ordinary edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!dirty || readOnly || missing) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* browser may block drafts */ }
  }, [draft, dirty, storageKey, readOnly, missing]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const edit = (update: (before: ChartDraft) => ChartDraft) => {
    if (readOnly || missing) return;
    setDraft(before => update(before));
    setDirty(true);
    setError('');
  };

  const select = (barId: string, chordId: string) => {
    setSelectedBarId(barId);
    setSelectedChordId(chordId);
    setAnnotationEditing(false);
  };

  const selectedBar = draft.bars.find(bar => bar.id === selectedBarId) ?? draft.bars[0];
  const selectedEvent = selectedBar?.events.find(event => event.id === selectedChordId) ?? selectedBar?.events[0];
  const selectedIndex = draft.bars.findIndex(bar => bar.id === selectedBar?.id);
  const eventIndex = selectedBar?.events.findIndex(event => event.id === selectedEvent?.id) ?? -1;
  const leftSegment = selectedBar && selectedBar.events.length > 1
    ? selectedBar.events[Math.max(0, Math.min(eventIndex, selectedBar.events.length - 2))] : null;
  const rightSegment = leftSegment && selectedBar
    ? selectedBar.events[selectedBar.events.findIndex(event => event.id === leftSegment.id) + 1] : null;

  const updateBar = (id: string, update: (bar: DraftBar) => DraftBar) => edit(before => ({
    ...before, bars: before.bars.map(bar => bar.id === id ? update(bar) : bar),
  }));

  const selectKey = (raw: string) => {
    const normalized = normalizeChartKey(raw);
    if (!normalized) {
      setError('Choose a key such as C, F♯ or B♭.');
      return;
    }
    setKeyInput(normalized);
    const oldPitch = pitchClass(draft.concert_key) ?? 0;
    const newPitch = pitchClass(normalized) ?? 0;
    edit(before => ({ ...before, concert_key: normalized,
      bars: transposeDraftChords(before.bars, newPitch - oldPitch, normalized) }));
  };

  const changeMeter = (beats: ChartMeter) => {
    try {
      const bars = retimeDraftBars(draft.bars, beats);
      edit(before => ({ ...before, beats, bars }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Cannot change the time signature.');
    }
  };

  const split = () => {
    if (!selectedBar || !selectedEvent || selectedEvent.duration_beats < 2) return;
    updateBar(selectedBar.id, bar => splitDraftChord(bar, selectedEvent.id));
  };
  const merge = () => {
    if (!selectedBar || !selectedEvent) return;
    updateBar(selectedBar.id, bar => mergeDraftChord(bar, selectedEvent.id));
  };
  const addBars = (count: number) => {
    edit(before => ({ ...before, bars: renumberDraftBars([...before.bars,
      ...Array.from({ length: count }, (_, index) => blankDraftBar(before.bars.length + index + 1, before.beats))]) }));
  };
  const duplicate = () => {
    if (!selectedBar) return;
    const copied = copyBar(selectedBar);
    edit(before => {
      const next = [...before.bars];
      next.splice(selectedIndex + 1, 0, copied);
      return { ...before, bars: renumberDraftBars(next) };
    });
    select(copied.id, copied.events[0]?.id ?? '');
  };
  const remove = () => {
    if (!selectedBar || draft.bars.length === 1) return;
    const remainder = draft.bars.filter(bar => bar.id !== selectedBar.id);
    edit(before => ({ ...before, bars: renumberDraftBars(before.bars.filter(bar => bar.id !== selectedBar.id)) }));
    const next = remainder[Math.min(selectedIndex, remainder.length - 1)]!;
    select(next.id, next.events[0]?.id ?? '');
  };
  const move = (direction: number) => {
    if (!selectedBar) return;
    const target = selectedIndex + direction;
    if (target < 0 || target >= draft.bars.length) return;
    edit(before => {
      const bars = [...before.bars];
      [bars[selectedIndex], bars[target]] = [bars[target]!, bars[selectedIndex]!];
      return { ...before, bars: renumberDraftBars(bars) };
    });
  };
  const clearStoredDraft = () => {
    try { sessionStorage.removeItem(storageKey); } catch { /* optional */ }
  };
  const cancel = () => {
    if (dirty && !window.confirm('Discard changes to this chart?')) return;
    clearStoredDraft();
    navigate('/my-charts');
  };

  const save = () => {
    if (readOnly || missing) return;
    try {
      const chart = buildChartFromDraft(draft, existing?.id ?? newLocalChartId(), existing);
      chartRepo.saveChart(chart);
      clearStoredDraft();
      setDirty(false);
      refreshLocal();
      const returnTo = searchParams.get('returnTo');
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        const destination = new URL(returnTo, window.location.origin);
        destination.searchParams.set('createdChartId', chart.id);
        navigate(destination.pathname + destination.search + destination.hash);
      } else {
        navigate('/my-charts');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the chart.');
    }
  };

  if (missing) {
    return <section className="chart-builder-page"><h1>Chart not found</h1>
      <p>This chart may have been deleted or belongs to another account.</p>
      <button className="chart-builder-primary" type="button" onClick={() => navigate('/my-charts')}>Back to My Charts</button>
    </section>;
  }

  return (
    <section className="chart-builder-page" aria-label="Create Chart">
      <header className="chart-builder-header">
        <div><p className="chart-builder-eyebrow">WRITE YOUR MUSIC</p><h1>{chartId ? 'Edit Chart' : 'Create Chart'}</h1></div>
        <div className="chart-builder-header-actions">
          <button type="button" className="chart-builder-secondary" onClick={cancel}>Cancel</button>
          <button type="button" className="chart-builder-primary" disabled={readOnly} onClick={save}>Save</button>
        </div>
      </header>
      {readOnly && <p className="chart-builder-notice">This is a built-in chart. Open My Charts and choose Edit a copy to make changes.</p>}
      {error && <p role="alert" className="chart-builder-error">{error}</p>}

      <label className="chart-builder-field">
        <span>Chart name</span>
        <input type="text" disabled={readOnly} value={draft.title} maxLength={100}
          placeholder="e.g. My First ii–V–I" onChange={event => edit(before => ({ ...before, title: event.target.value }))} />
      </label>

      <div className="chart-builder-key-head">
        <div><span className="chart-builder-field-label">Key</span>
          <strong className="chart-builder-current-key" aria-live="polite">{draft.concert_key}</strong>
        </div>
        <div className="chart-builder-key-arrows">
          <button type="button" aria-label="Lower key one semitone" disabled={readOnly}
            onClick={() => selectKey(stepChartKey(draft.concert_key, -1))}>−</button>
          <button type="button" aria-label="Raise key one semitone" disabled={readOnly}
            onClick={() => selectKey(stepChartKey(draft.concert_key, 1))}>+</button>
        </div>
      </div>
      <div className="chart-builder-key-scroll" role="group" aria-label="Choose musical key">
        {CHART_KEYS.map(key => <button key={key} type="button" disabled={readOnly} aria-pressed={draft.concert_key === key}
          onClick={() => selectKey(key)}>{key}</button>)}
      </div>
      <div className="chart-builder-key-type">
        <input type="text" aria-label="Type a musical key" list="chart-key-options"
          value={keyInput} disabled={readOnly} placeholder="Type C, Bb, F#…" onChange={event => setKeyInput(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); selectKey(keyInput); } }} />
        <datalist id="chart-key-options">{CHART_KEYS.map(key => <option key={key} value={key} />)}</datalist>
        <button type="button" disabled={readOnly} onClick={() => selectKey(keyInput)}>Set key</button>
      </div>

      <div className="chart-builder-meta-row">
        <fieldset className="chart-builder-meter">
          <legend>Beats per measure</legend>
          <div>{([2, 3, 4] as const).map(beats => <button key={beats} type="button"
            disabled={readOnly} aria-pressed={draft.beats === beats} onClick={() => changeMeter(beats)}>{beats}/4</button>)}</div>
        </fieldset>
        <label className="chart-builder-field">
          <span>Feel (optional)</span>
          <select value={draft.feel} disabled={readOnly}
            onChange={event => edit(before => ({ ...before, feel: event.target.value }))}>
            {FEELS.map(feel => <option key={feel} value={feel}>{feel}</option>)}
          </select>
        </label>
      </div>
      <label className="chart-builder-field">
        <span>Style instruction for the whole chart (optional)</span>
        <input type="text" disabled={readOnly} value={draft.style_instruction} maxLength={120}
          placeholder="e.g. Medium swing throughout" onChange={event => edit(before => ({ ...before, style_instruction: event.target.value }))} />
      </label>

      <div className="chart-builder-chart-heading">
        <div><h2>Your chord chart</h2><p>Tap a measure and type its chord. Use familiar symbols like Dm7 or G7.</p></div>
        <span>{draft.bars.length} measures</span>
      </div>
      <EditableChartGrid bars={draft.bars} selectedBarId={selectedBarId} selectedChordId={selectedChordId}
        onSelect={select}
        onChordChange={(barId, chordId, symbol) => updateBar(barId, bar => ({
          ...bar, events: bar.events.map(event => event.id === chordId ? { ...event, symbol } : event),
        }))} />

      {selectedBar && <section className="chart-builder-selection" aria-label={'Edit measure ' + selectedBar.number}>
        <h3>Measure {selectedBar.number} <span>{selectedBar.events.length} {selectedBar.events.length === 1 ? 'chord' : 'chords'}</span></h3>
        <div className="chart-builder-tools">
          <button type="button" disabled={readOnly || !selectedEvent || selectedEvent.duration_beats < 2}
            onClick={split}>Split Measure</button>
          <button type="button" disabled={readOnly || selectedBar.events.length < 2}
            onClick={merge}>Merge chords</button>
          <button type="button" disabled={readOnly} onClick={() => setAnnotationEditing(open => !open)}>
            {selectedBar.annotation ? 'Edit Annotation' : 'Add Annotation'}
          </button>
        </div>
        {leftSegment && rightSegment && leftSegment.duration_beats + rightSegment.duration_beats > 2 && (
          <label className="chart-builder-split-adjust">Change split: first chord has {leftSegment.duration_beats} beats
            <input type="range" disabled={readOnly} min={1}
              max={leftSegment.duration_beats + rightSegment.duration_beats - 1}
              value={leftSegment.duration_beats}
              onChange={event => updateBar(selectedBar.id, bar => resizeDraftSplit(bar, leftSegment.id, Number(event.target.value)))} />
          </label>
        )}
        {(annotationEditing || Boolean(selectedBar.annotation)) && <div className="chart-builder-annotation-edit">
          <label>Red style note for this measure
            <input type="text" value={selectedBar.annotation} maxLength={80} disabled={readOnly}
              placeholder="e.g. Swing feel" onChange={event => updateBar(selectedBar.id, bar => ({ ...bar, annotation: event.target.value }))} />
          </label>
          {selectedBar.annotation && <button type="button" disabled={readOnly}
            onClick={() => updateBar(selectedBar.id, bar => ({ ...bar, annotation: '' }))}>Remove note</button>}
        </div>}
        <div className="chart-builder-measure-actions">
          <button type="button" disabled={readOnly || selectedIndex === 0} onClick={() => move(-1)}>↑ Move</button>
          <button type="button" disabled={readOnly || selectedIndex === draft.bars.length - 1} onClick={() => move(1)}>↓ Move</button>
          <button type="button" disabled={readOnly} onClick={duplicate}>Duplicate</button>
          <button type="button" disabled={readOnly || draft.bars.length <= 1} onClick={remove}>Delete</button>
        </div>
      </section>}
      <div className="chart-builder-add-row">
        <button type="button" disabled={readOnly} onClick={() => addBars(1)}>+ Add measure</button>
        <button type="button" disabled={readOnly} onClick={() => addBars(4)}>+ Add 4 measures</button>
        <button type="button" disabled={readOnly} onClick={() => addBars(8)}>+ Add 8 measures</button>
      </div>
      <p className="chart-builder-caption">Splitting keeps the same measure number and saves the exact beat length of each chord. Style notes do not affect timing.</p>
      <div className="chart-builder-footer">
        <button type="button" className="chart-builder-secondary" onClick={cancel}>Cancel</button>
        <button type="button" className="chart-builder-primary" disabled={readOnly} onClick={save}>Save Chart</button>
      </div>
    </section>
  );
}
