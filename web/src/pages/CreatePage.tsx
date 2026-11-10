import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { exercisesById } from '../data/seed';
import { useApp } from '../context/AppContext';
import {
  newLocalExerciseId,
  newLocalRoutineId,
  routineDurationFromSteps,
  type CreateDraft,
  type LocalRepository,
} from '../repository/localRepository';
import type { Exercise, LocalExercise, LocalRoutine, Visibility } from '../types/content';
import {
  appendBuilderExercise, exerciseSummary, previewRoutineImport, searchCatalogExercises, searchCatalogRoutines
} from './routinePickerLogic';
import './CreatePage.css';

interface BuilderStep { exerciseId: string; minutes: number; }
interface ChartReturnDraft {
  title: string;
  description: string;
  visibility: Visibility;
  instrument: string;
  goal: string;
  steps: BuilderStep[];
  exTitle: string;
  exCategory: string;
  exLevel: string;
  exMinutes: number;
  exInstructions: string;
  exChartId: string;
  editExerciseId: string | null;
}
const CHART_RETURN_KEY = 'little-jazz-room:create-chart-return:v1:';
const DEMO_STEPS = ['swing-2-4', 'thirds-sevenths', 'blues-form'];
const STEP_DURATION_KEY = 'little-jazz-room:create-step-durations:v1:';

function loadBuilderSteps(repo: LocalRepository, exercises: Exercise[]): BuilderStep[] {
  const draft = repo.readCreateDraft();
  const ids = draft?.stepExerciseIds?.length ? draft.stepExerciseIds : DEMO_STEPS;
  let durations: number[] = [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STEP_DURATION_KEY + repo.scope) ?? '[]');
    if (Array.isArray(parsed)) durations = parsed.filter((n): n is number => typeof n === 'number');
  } catch { /* optional browser storage */ }
  return ids.map((exerciseId, index) => {
    const exercise = exercises.find(ex => ex.id === exerciseId) ?? exercisesById[exerciseId];
    return {
      exerciseId,
      minutes: durations[index] && Number.isFinite(durations[index]) ? durations[index]! : (exercise?.duration_minutes ?? 5),
    };
  });
}

export function CreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { repo, exercises, charts, routines, publicRoutines, refreshLocal, showToast, teamSignedIn, saveRoutineToCloud, saveExerciseToCloud } = useApp();
  const locationEditId = (location.state as { editExerciseId?: string } | null)?.editExerciseId;
  const createdChartId = new URLSearchParams(location.search).get('createdChartId');
  const chartReturnKey = CHART_RETURN_KEY + repo.scope;
  const [chartReturnDraft, setChartReturnDraft] = useState<ChartReturnDraft | null>(() => {
    if (!createdChartId) return null;
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(chartReturnKey) ?? 'null');
      if (saved && typeof saved === 'object' && Array.isArray((saved as ChartReturnDraft).steps))
        return saved as ChartReturnDraft;
    } catch { /* draft persistence may be unavailable */ }
    return null;
  });

  const editId = locationEditId ?? chartReturnDraft?.editExerciseId ?? undefined;
  const originalDraft = useMemo(() => repo.readCreateDraft(), [repo]);
  const [title, setTitle] = useState(chartReturnDraft?.title ?? originalDraft?.title ?? 'My Morning Standards');
  const [description, setDescription] = useState(chartReturnDraft?.description ?? originalDraft?.description ?? 'A few simple steps to feel more confident playing jazz.');
  const [visibility, setVisibility] = useState<Visibility>(chartReturnDraft?.visibility ?? originalDraft?.visibility ?? 'Private');
  const [instrument, setInstrument] = useState(chartReturnDraft?.instrument ?? 'Piano');
  const [goal, setGoal] = useState(chartReturnDraft?.goal ?? 'Jazz standards');
  const [steps, setSteps] = useState<BuilderStep[]>(() => chartReturnDraft?.steps ?? loadBuilderSteps(repo, exercises));
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerTriggerRef = useRef<HTMLButtonElement>(null);
  const [pickerTab, setPickerTab] = useState<'Exercises' | 'Routines'>('Exercises');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLevel, setPickerLevel] = useState('');
  const [pickerGoal, setPickerGoal] = useState('');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [showExerciseForm, setShowExerciseForm] = useState(Boolean(chartReturnDraft));
  const [exTitle, setExTitle] = useState(chartReturnDraft?.exTitle ?? '');
  const [exCategory, setExCategory] = useState(chartReturnDraft?.exCategory ?? 'Technique');
  const [exLevel, setExLevel] = useState(chartReturnDraft?.exLevel ?? 'Beginner');
  const [exMinutes, setExMinutes] = useState(chartReturnDraft?.exMinutes ?? 5);
  const [exInstructions, setExInstructions] = useState(chartReturnDraft?.exInstructions ?? '');
  const [exChartId, setExChartId] = useState(chartReturnDraft?.exChartId ?? '');
  const [chartSearch, setChartSearch] = useState('');

  useEffect(() => {
    if (chartReturnDraft) return; // initial state already restored from unfinished form
    const draft = repo.readCreateDraft();
    setTitle(draft?.title ?? 'My Morning Standards');
    setDescription(draft?.description ?? 'A focused practice routine for building confidence on a standard.');
    setVisibility(draft?.visibility ?? 'Private');
    setSteps(loadBuilderSteps(repo, exercises));
  }, [repo.scope]);

  useEffect(() => {
    if (!createdChartId) return;
    if (!charts.some(chart => chart.id === createdChartId)) return;
    setExChartId(createdChartId);
    setShowExerciseForm(true);
    // Keep the return draft until the exercise is saved, including across reloads.
  }, [createdChartId, charts]);

  const loadedEditId = useRef<string | null>(null);
  useEffect(() => {
    if (!editId) { loadedEditId.current = null; return; }
    if (chartReturnDraft) { loadedEditId.current = editId; return; }
    const exercise = exercises.find(ex => ex.id === editId) ?? exercisesById[editId];
    if (exercise && loadedEditId.current !== editId) {
      loadedEditId.current = editId;
      setShowExerciseForm(true);
      setExTitle(exercise.title);
      setExCategory(exercise.category);
      setExLevel(exercise.level);
      setExMinutes(exercise.duration_minutes);
      setExInstructions(exercise.instructions);
      setExChartId(exercise.chart_id ?? '');
    }
  }, [editId, exercises]);

  const persistDraft = () => {
    const draft: CreateDraft = {
      title, description, visibility, stepExerciseIds: steps.map(step => step.exerciseId),
    };
    repo.writeCreateDraft(draft);
    try {
      localStorage.setItem(STEP_DURATION_KEY + repo.scope, JSON.stringify(steps.map(step => step.minutes)));
    } catch { /* optional browser storage */ }
  };

  useEffect(() => {
    persistDraft();
  }, [repo, title, description, visibility, steps]);

  const exerciseFor = (id: string) => exercises.find(ex => ex.id === id) ?? exercisesById[id];

  // Context includes this user's scoped local/cloud routines and public routines only.
  const catalogRoutines = useMemo(() => Array.from(new Map(
    [...routines, ...publicRoutines.filter(routine => routine.visibility === 'public')]
      .map(routine => [routine.id, routine] as const)
  ).values()), [routines, publicRoutines]);
  const foundExercises = useMemo(() =>
    searchCatalogExercises(exercises, pickerSearch, pickerLevel, pickerGoal),
    [exercises, pickerSearch, pickerLevel, pickerGoal]);
  const foundRoutines = useMemo(() =>
    searchCatalogRoutines(catalogRoutines, exercises, pickerSearch, pickerLevel, pickerGoal),
    [catalogRoutines, exercises, pickerSearch, pickerLevel, pickerGoal]);
  const selectedRoutine = catalogRoutines.find(routine => routine.id === selectedRoutineId);
  const importPreview = selectedRoutine ? previewRoutineImport(selectedRoutine, steps, exercises) : null;

  const closePicker = () => {
    setShowPicker(false);
    setSelectedRoutineId(null);
    pickerTriggerRef.current?.focus();
  };
  useEffect(() => {
    if (!showPicker) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPicker(false);
        setSelectedRoutineId(null);
        pickerTriggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPicker]);

  const moveStep = (index: number, delta: number) => {
    setSteps(previous => {
      const target = index + delta;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const setStepMinutes = (index: number, minutes: number) =>
    setSteps(previous => previous.map((step, i) => i === index ? { ...step, minutes } : step));

  const openChartBuilder = (existingId?: string) => {
    persistDraft();
    const formDraft: ChartReturnDraft = {
      title, description, visibility, instrument, goal, steps,
      exTitle, exCategory, exLevel, exMinutes, exInstructions, exChartId,
      editExerciseId: editId ?? null,
    };
    try { sessionStorage.setItem(chartReturnKey, JSON.stringify(formDraft)); }
    catch { showToast('Could not preserve your unfinished exercise. Check browser storage.'); return; }
    navigate(existingId
      ? '/charts/' + encodeURIComponent(existingId) + '/edit?returnTo=%2Fcreate'
      : '/charts/new?returnTo=%2Fcreate');
  };

  const addExistingExercise = (exercise: Exercise) => {
    setSteps(previous => appendBuilderExercise(previous, exercise));
    showToast(exercise.title + ' added.');
  };

  const addExistingRoutine = () => {
    if (!selectedRoutine || !importPreview?.additions.length) return;
    for (const entry of importPreview.additions) {
      if (exerciseFor(entry.source.exercise_id)) continue;
      const snapshot = entry.source.snapshot;
      if (!snapshot) continue;
      // Snapshot copies are private to this device/account; shared source routines are untouched.
      const localCopy: LocalExercise = {
        id: entry.exerciseId, title: snapshot.title, instructions: snapshot.instructions,
        chart_id: snapshot.chart_id, category: 'Technique',
        level: selectedRoutine.level, duration_minutes: entry.minutes,
        suggested_material: 'Imported from ' + selectedRoutine.title,
        suggested_bpm: null, audio_asset_id: null, visibility: 'private',
        is_seed: false, applicable_instruments: ['All'],
      };
      repo.saveLocalExercise(localCopy);
    }
    setSteps(previous => [...previous, ...importPreview.additions.map(entry => ({
      exerciseId: entry.exerciseId, minutes: entry.minutes
    }))]);
    refreshLocal();
    showToast(importPreview.additions.length + ' steps added from ' + selectedRoutine.title + '.');
    closePicker();
  };

  const saveExercise = async () => {
    if (saving) return;
    if (!exTitle.trim() || !exInstructions.trim() || !Number.isInteger(exMinutes) || exMinutes < 1) {
      showToast('Enter an exercise title, instructions, and a positive duration.');
      return;
    }
    if (exChartId && !charts.some(chart => chart.id === exChartId)) {
      showToast('The selected chart is unavailable. Select an existing chart before saving.');
      return;
    }
    const existing = editId ? exercises.find(ex => ex.id === editId) : undefined;
    const id = existing && existing.is_seed === false ? editId! :
      teamSignedIn ? crypto.randomUUID() : newLocalExerciseId();
    const exercise: LocalExercise = {
      id, title: exTitle.trim(), category: exCategory, level: exLevel,
      duration_minutes: exMinutes, instructions: exInstructions.trim(),
      suggested_material: existing?.suggested_material ?? 'Custom exercise',
      suggested_bpm: existing?.suggested_bpm ?? null,
      audio_asset_id: existing?.audio_asset_id ?? null,
      visibility: existing?.is_seed === false ? existing.visibility : 'private',
      is_seed: false, chart_id: exChartId || null,
      applicable_instruments: existing?.applicable_instruments ?? ['All'],
    };
    setSaving(true);
    try {
      let saved = exercise;
      if (teamSignedIn) {
        try {
          const cloud = await saveExerciseToCloud(exercise);
          saved = { ...exercise, id: cloud.id };
        } catch {
          showToast('Cloud unavailable. Exercise saved on this device.');
        }
      }
      repo.saveLocalExercise(saved);
      refreshLocal();
      setSteps(previous => previous.some(step => step.exerciseId === saved.id) ? previous :
        [...previous, { exerciseId: saved.id, minutes: saved.duration_minutes }]);
      setShowExerciseForm(false);
      setExTitle(''); setExInstructions(''); setExChartId('');
      try { sessionStorage.removeItem(chartReturnKey); } catch { /* optional */ }
      setChartReturnDraft(null);
      if (createdChartId) navigate('/create', { replace: true });
      showToast('Exercise added to this routine.');
    } finally {
      setSaving(false);
    }
  };

  const saveRoutine = async () => {
    if (!title.trim()) { showToast('Give your routine a title.'); return; }
    if (!steps.length) { showToast('Add at least one exercise.'); return; }
    if (steps.some(step => !Number.isInteger(step.minutes) || step.minutes < 1 || !exerciseFor(step.exerciseId))) {
      showToast('Every step needs an existing exercise and a positive duration.');
      return;
    }
    const routineSteps = steps.map(step => ({ exercise_id: step.exerciseId, duration_minutes: step.minutes }));
    const routine: LocalRoutine & { goal: string } = {
      id: newLocalRoutineId(), title: title.trim(), description: description.trim(),
      goal,
      level: 'Beginner', duration_minutes: routineDurationFromSteps(routineSteps),
      visibility: teamSignedIn && visibility === 'Public' ? 'public' : 'private',
      is_seed: false, steps: routineSteps, applicable_instruments: [instrument],
    };
    setSaving(true);
    try {
      let saved = routine;
      if (teamSignedIn) {
        try {
          const cloud = await saveRoutineToCloud(routine);
          saved = { ...routine, id: cloud.id, visibility: cloud.visibility };
        } catch {
          showToast('Cloud unavailable. Routine saved on this device.');
        }
      }
      // Keep the editable step durations intact in the local repository regardless of cloud snapshots.
      repo.saveLocalRoutine(saved);
      refreshLocal();
      navigate('/routines?tab=my');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save routine.');
    } finally {
      setSaving(false);
    }
  };

  const totalMinutes = steps.reduce((sum, step) => sum + (Number.isFinite(step.minutes) ? step.minutes : 0), 0);

  return (
    <section className="routine-builder" aria-label="Routine builder">
      <header className="builder-topbar">
        <button type="button" className="builder-back" onClick={() => navigate('/routines')}>‹ <span>Back</span></button>
        <span>Practice routines</span>
        <button type="button" className="builder-close" aria-label="Close builder" onClick={() => navigate('/routines')}>×</button>
      </header>

      <div className="builder-heading">
        <div><p className="builder-eyebrow">Build your practice</p><h1>Create routine</h1></div>
        <button type="button" className="builder-draft" onClick={() => { persistDraft(); showToast('Draft saved in this browser.'); }}><svg aria-hidden="true" width="15" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3.5h12v17L12 16l-6 4.5z"/></svg><span>Save draft</span></button>
      </div>

      <div className="builder-form">
        <label htmlFor="routineName">Routine title <span aria-hidden="true">*</span></label>
        <input id="routineName" className="builder-field" value={title} onChange={e => setTitle(e.target.value)} required />
        <label htmlFor="desc">What would you like to practice?</label>
        <textarea id="desc" className="builder-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        <div className="builder-two-fields">
          <div><label htmlFor="builderInstrument">Instrument</label>
            <select id="builderInstrument" className="builder-field" value={instrument} onChange={e => setInstrument(e.target.value)}>
              {['Piano', 'Guitar', 'Alto Saxophone', 'Tenor Saxophone', 'Trumpet', 'Bass', 'Drums', 'All'].map(value =>
                <option key={value}>{value}</option>)}
            </select>
          </div>
          <div><label htmlFor="builderGoal">Practice goal</label>
            <select id="builderGoal" className="builder-field" value={goal} onChange={e => setGoal(e.target.value)}>
              {['Jazz standards', 'Technique', 'Improvisation', 'Ear Training', 'Rhythm', 'Harmony'].map(value =>
                <option key={value}>{value}</option>)}
            </select>
          </div>
        </div>

        <fieldset className="builder-visibility">
          <legend>Visibility</legend>
          <div className="builder-visibility-options">
            {(['Private', 'Public'] as const).map(value =>
              <label key={value} className={visibility === value ? 'selected' : ''}>
                <input type="radio" name="routine-visibility" checked={visibility === value}
                  onChange={() => setVisibility(value)} />
                <span>{value === 'Private' ? 'Private' : 'Public (Preview)'}</span>
              </label>
            )}
          </div>
          <p>Public sharing is Preview for the local class demo. Drafts stay private.</p>
        </fieldset>
      </div>

      <div className="builder-step-header">
        <h2>Your exercises</h2>
        <span>{steps.length} {steps.length === 1 ? 'step' : 'steps'} · {totalMinutes} min</span>
      </div>

      <ol className="builder-step-list">
        {steps.map((step, index) => {
          const exercise = exerciseFor(step.exerciseId);
          const chart = charts.find(item => item.id === exercise?.chart_id);
          const label = exercise?.title ?? step.exerciseId;
          return (
            <li className="builder-step" key={index + '-' + step.exerciseId}>
              <span className="builder-step-grip" aria-hidden="true"><svg width="13" height="19" viewBox="0 0 13 19" fill="currentColor"><circle cx="3" cy="3" r="1.3"/><circle cx="10" cy="3" r="1.3"/><circle cx="3" cy="9" r="1.3"/><circle cx="10" cy="9" r="1.3"/><circle cx="3" cy="15" r="1.3"/><circle cx="10" cy="15" r="1.3"/></svg></span>
              <div className="builder-step-content">
                <strong>{index + 1}. {label}</strong>
                <span>{exercise?.level ?? 'Exercise'}{chart ? ' · ' + chart.title : ''}</span>
                {exercise && <p className="builder-step-instructions">{exerciseSummary(exercise)}</p>}
                <label className="builder-step-time">How long?
                  <input type="number" min="1" step="1" value={step.minutes}
                    aria-label={'Duration for ' + label + ' in minutes'}
                    onChange={e => setStepMinutes(index, Number(e.target.value))} />
                </label>
              </div>
              <div className="builder-step-move">
                <button type="button" aria-label={'Move ' + label + ' up'} disabled={index === 0}
                  onClick={() => moveStep(index, -1)}>▴</button>
                <button type="button" aria-label={'Move ' + label + ' down'} disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, 1)}>▾</button>
              </div>
              <button type="button" className="builder-step-delete" aria-label={'Remove ' + label}
                onClick={() => setSteps(previous => previous.filter((_, i) => i !== index))}><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 3v7m4-7v7"/></svg></button>
            </li>
          );
        })}
      </ol>

      <div className="builder-add-actions">
        <button type="button" ref={pickerTriggerRef} onClick={() => { setPickerTab('Exercises'); setShowPicker(true); }}>+ Add Existing</button>
        <button type="button" onClick={() => setShowExerciseForm(value => !value)}>+ Create your own exercise</button>
      </div>

      {showPicker && <div className="builder-picker-backdrop" onMouseDown={event => {
        if (event.target === event.currentTarget) closePicker();
      }}>
        <section className="builder-picker-dialog" role="dialog" aria-modal="true" aria-label="Add exercises to your routine">
          <div className="builder-picker-top">
            <div><p className="builder-eyebrow">Your practice library</p><h3>Add to your routine</h3></div>
            <button type="button" className="builder-picker-close" onClick={closePicker} aria-label="Close exercise library">×</button>
          </div>
          <label htmlFor="builderPickerSearch" className="builder-picker-label">Search by name or skill</label>
          <input id="builderPickerSearch" type="search" autoFocus className="builder-field"
            placeholder="Try blues, chords, rhythm..." value={pickerSearch}
            onChange={event => { setPickerSearch(event.target.value); setSelectedRoutineId(null); }} />
          <div className="builder-picker-tabs" role="tablist" aria-label="Choose exercises or routines">
            {(['Exercises', 'Routines'] as const).map(value => (
              <button type="button" role="tab" aria-selected={pickerTab === value} key={value}
                className={pickerTab === value ? 'is-selected' : ''}
                onClick={() => { setPickerTab(value); setSelectedRoutineId(null); }}>{value}</button>
            ))}
          </div>
          <div className="builder-picker-filters">
            <label>Skill level
              <select className="builder-field" value={pickerLevel}
                onChange={event => { setPickerLevel(event.target.value); setSelectedRoutineId(null); }}>
                <option value="">All levels</option>
                {['Beginner', 'Intermediate', 'Advanced'].map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>Practice goal
              <select className="builder-field" value={pickerGoal}
                onChange={event => { setPickerGoal(event.target.value); setSelectedRoutineId(null); }}>
                <option value="">All goals</option>
                {['Rhythm', 'Technique', 'Harmony', 'Improvisation', 'Ear Training', 'Repertoire'].map(value =>
                  <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className="builder-picker-results">
            {pickerTab === 'Exercises' ? <>
              <p className="builder-picker-count">{foundExercises.length} exercises</p>
              {foundExercises.map(exercise => {
                return <article className="builder-picker-result" key={exercise.id}>
                  <div>
                    <h4>{exercise.title}</h4>
                    <p>{exerciseSummary(exercise)}</p>
                    <span>{exercise.level} · {exercise.duration_minutes} min · {exercise.category}</span>
                  </div>
                  <button type="button" onClick={() => addExistingExercise(exercise)}>
                    Add
                  </button>
                </article>;
              })}
              {foundExercises.length === 0 && <p className="builder-picker-empty">
                {exercises.length ? 'No exercises match. Try another word or clear the filters.' :
                  'Your exercise library is empty. Create your own exercise to begin.'}
              </p>}
            </> : <>
              <p className="builder-picker-count">{foundRoutines.length} routines · Presets, yours and shared</p>
              {foundRoutines.map(routine => (
                <article className="builder-picker-result" key={routine.id}>
                  <div>
                    <h4>{routine.title}</h4>
                    <p>{routine.description || 'Practice these steps in order.'}</p>
                    <span>{routine.level} · {routine.duration_minutes} min · {routine.steps.length} steps</span>
                  </div>
                  <button type="button" onClick={() => setSelectedRoutineId(routine.id)}>View steps</button>
                </article>
              ))}
              {foundRoutines.length === 0 && <p className="builder-picker-empty">
                No routines match. Try another word or clear the filters.
              </p>}
            </>}
          </div>
          {selectedRoutine && importPreview && <div className="builder-picker-confirm">
            <h4>Add from {selectedRoutine.title}?</h4>
            <ol>{selectedRoutine.steps.map((step, index) => (
              <li key={index}>{exerciseFor(step.exercise_id)?.title ?? step.snapshot?.title ?? 'Unavailable exercise'}
                <span>{step.duration_minutes} min</span></li>
            ))}</ol>
            <p><strong>{importPreview.additions.length} steps will be added.</strong>
               {importPreview.unavailable > 0 ? ' ' + importPreview.unavailable + ' unavailable steps cannot be copied.' : ''}
              {' '}You can change the time or order afterward.</p>
            <div className="builder-picker-confirm-actions">
              <button type="button" onClick={() => setSelectedRoutineId(null)}>Back</button>
              <button type="button" disabled={importPreview.additions.length === 0} onClick={addExistingRoutine}>
                Add {importPreview.additions.length} {importPreview.additions.length === 1 ? 'step' : 'steps'}
              </button>
            </div>
          </div>}
        </section>
      </div>}

      {showExerciseForm && <div className="builder-panel builder-custom-form">
        <h3>{editId ? 'Edit exercise' : 'Create your own exercise'}</h3>
        <label htmlFor="exTitle">Title</label>
        <input className="builder-field" id="exTitle" value={exTitle} onChange={e => setExTitle(e.target.value)} />
        <div className="builder-two-fields">
          <div><label htmlFor="exCat">Category</label><select id="exCat" className="builder-field" value={exCategory} onChange={e => setExCategory(e.target.value)}>
            {['Technique', 'Harmony', 'Improvisation', 'Repertoire', 'Rhythm', 'Ear Training'].map(c => <option key={c}>{c}</option>)}
          </select></div>
          <div><label htmlFor="exLevel">Level</label><select id="exLevel" className="builder-field" value={exLevel} onChange={e => setExLevel(e.target.value)}>
            {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
          </select></div>
        </div>
        <label htmlFor="exMin">How long? (minutes)</label>
        <input id="exMin" type="number" min="1" className="builder-field" value={exMinutes} onChange={e => setExMinutes(Number(e.target.value))} />
        <label htmlFor="exInst">What should you do?</label>
        <textarea id="exInst" className="builder-field" value={exInstructions} onChange={e => setExInstructions(e.target.value)} />
        <label htmlFor="exChartSearch">Find a chart (optional)</label>
        <input id="exChartSearch" type="search" className="builder-field" placeholder="Search by chart name"
          value={chartSearch} onChange={event => setChartSearch(event.target.value)} />
        <label htmlFor="exChart">Linked chart</label>
        <select id="exChart" className="builder-field" value={exChartId} onChange={e => setExChartId(e.target.value)}>
          <option value="">None</option>
          {charts.filter(chart => chart.id === exChartId || chart.title.toLowerCase().includes(chartSearch.trim().toLowerCase()))
            .map(chart => <option key={chart.id} value={chart.id}>{chart.title}</option>)}
        </select>
        {exChartId && <button type="button" className="builder-unlink-chart"
          onClick={() => setExChartId('')}>Remove linked chart</button>}
        <div className="builder-panel-actions">
          <button type="button" onClick={() => openChartBuilder()}>+ Create Chart</button>
          {exChartId && charts.some(chart => chart.id === exChartId && chart.is_custom) &&
            <button type="button" onClick={() => openChartBuilder(exChartId)}>Edit Chart</button>}
        </div>
        <section className="builder-exercise-live-preview" aria-label="Live exercise preview" aria-live="polite">
          <strong>Exercise preview</strong>
          <p className="builder-exercise-live-title">{exTitle.trim() || 'Untitled exercise'}</p>
          <p>{exCategory} · {exLevel} · {Number.isInteger(exMinutes) && exMinutes > 0 ? exMinutes + ' min' : 'Set duration'}</p>
          {exChartId && <p>Chart: {charts.find(chart => chart.id === exChartId)?.title ?? 'Chart unavailable'}</p>}
          <p className="builder-exercise-live-instructions">{exInstructions.trim() || 'Add instructions to see them here.'}</p>
        </section>
        <div className="builder-panel-actions">
          <button type="button" onClick={() => void saveExercise()} disabled={saving}>Save exercise</button>
          <button type="button" onClick={() => setShowExerciseForm(false)}>Cancel</button>
        </div>
      </div>}

      <p className="builder-tip"><span aria-hidden="true">i</span> Use the move controls to reorder steps. Every step needs a positive duration.</p>
      <div className="builder-footer">
        <div className="builder-primary-actions">
          <button type="button" className="builder-preview" onClick={() => showToast('Routine preview is not yet available. Save to practice in the shared player.')}>Preview only</button>
          <button type="button" className="builder-save" disabled={saving} onClick={() => void saveRoutine()}>✓ {saving ? 'Saving...' : 'Save routine'}</button>
        </div>
        <div className="builder-secondary-actions">
          <button type="button" onClick={() => navigate('/routines')}>× Cancel</button>
          <button type="button" onClick={() => showToast('Community sharing is Preview. Your routine saves locally.')}>Share · Preview</button>
        </div>
      </div>
    </section>
  );
}
