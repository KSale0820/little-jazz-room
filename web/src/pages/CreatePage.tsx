import { useEffect, useMemo, useState } from 'react';
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
import './CreatePage.css';

interface BuilderStep { exerciseId: string; minutes: number; }
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
  const { repo, exercises, charts, refreshLocal, showToast, teamSignedIn, saveRoutineToCloud, saveExerciseToCloud } = useApp();
  const editId = (location.state as { editExerciseId?: string } | null)?.editExerciseId;

  const originalDraft = useMemo(() => repo.readCreateDraft(), [repo]);
  const [title, setTitle] = useState(originalDraft?.title ?? 'My Morning Standards');
  const [description, setDescription] = useState(originalDraft?.description ?? 'A focused practice routine for building confidence on a standard.');
  const [visibility, setVisibility] = useState<Visibility>(originalDraft?.visibility ?? 'Private');
  const [instrument, setInstrument] = useState('Piano');
  const [goal, setGoal] = useState('Jazz standards');
  const [steps, setSteps] = useState<BuilderStep[]>(() => loadBuilderSteps(repo, exercises));
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerExerciseId, setPickerExerciseId] = useState('blues-form');
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exTitle, setExTitle] = useState('');
  const [exCategory, setExCategory] = useState('Technique');
  const [exLevel, setExLevel] = useState('Beginner');
  const [exMinutes, setExMinutes] = useState(5);
  const [exInstructions, setExInstructions] = useState('');
  const [exChartId, setExChartId] = useState('');

  useEffect(() => {
    const draft = repo.readCreateDraft();
    setTitle(draft?.title ?? 'My Morning Standards');
    setDescription(draft?.description ?? 'A focused practice routine for building confidence on a standard.');
    setVisibility(draft?.visibility ?? 'Private');
    setSteps(loadBuilderSteps(repo, exercises));
  }, [repo.scope]);

  useEffect(() => {
    if (editId && exercisesById[editId]) {
      const exercise = exercises.find(ex => ex.id === editId) ?? exercisesById[editId];
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

  const addExistingExercise = () => {
    const exercise = exerciseFor(pickerExerciseId);
    if (!exercise) return;
    setSteps(previous => [...previous, { exerciseId: exercise.id, minutes: exercise.duration_minutes }]);
    setShowPicker(false);
  };

  const saveExercise = async () => {
    if (!exTitle.trim() || !exInstructions.trim() || !Number.isInteger(exMinutes) || exMinutes < 1) {
      showToast('Enter an exercise title, instructions, and a positive duration.');
      return;
    }
    const existing = editId ? exercises.find(ex => ex.id === editId) : undefined;
    const id = existing && existing.is_seed === false ? editId! :
      teamSignedIn ? crypto.randomUUID() : newLocalExerciseId();
    const exercise: LocalExercise = {
      id, title: exTitle.trim(), category: exCategory, level: exLevel,
      duration_minutes: exMinutes, instructions: exInstructions.trim(),
      suggested_material: 'Custom exercise', suggested_bpm: null, audio_asset_id: null,
      visibility: 'private', is_seed: false, chart_id: exChartId || null,
      applicable_instruments: ['All'],
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
          const cloud = await saveRoutineToCloud(routine, steps.map(step => step.exerciseId));
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
        <label htmlFor="desc">Description</label>
        <textarea id="desc" className="builder-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        <div className="builder-two-fields">
          <div><label htmlFor="builderInstrument">Instrument</label>
            <select id="builderInstrument" className="builder-field" value={instrument} onChange={e => setInstrument(e.target.value)}>
              {['Piano', 'Guitar', 'Alto Saxophone', 'Tenor Saxophone', 'Trumpet', 'Bass', 'Drums', 'All'].map(value =>
                <option key={value}>{value}</option>)}
            </select>
          </div>
          <div><label htmlFor="builderGoal">Goal</label>
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
                <span>{exercise?.category ?? 'Exercise'}{chart ? ' · ' + chart.title : ''}</span>
                <label className="builder-step-time">Minutes
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
        <button type="button" onClick={() => setShowPicker(value => !value)}>+ Existing exercise</button>
        <button type="button" onClick={() => setShowExerciseForm(value => !value)}>+ New exercise</button>
      </div>

      {showPicker && <div className="builder-panel">
        <label htmlFor="existingExercise">Add a warm-up, skill, or song/chart exercise</label>
        <select className="builder-field" id="existingExercise" value={pickerExerciseId}
          onChange={e => setPickerExerciseId(e.target.value)}>
          {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.category} · {ex.title}{ex.chart_id ? ' (chart)' : ''}</option>)}
        </select>
        <button className="builder-panel-primary" type="button" onClick={addExistingExercise}>Add step</button>
      </div>}

      {showExerciseForm && <div className="builder-panel builder-custom-form">
        <h3>{editId ? 'Edit exercise' : 'New exercise'}</h3>
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
        <label htmlFor="exMin">Duration (minutes)</label>
        <input id="exMin" type="number" min="1" className="builder-field" value={exMinutes} onChange={e => setExMinutes(Number(e.target.value))} />
        <label htmlFor="exInst">Instructions</label>
        <textarea id="exInst" className="builder-field" value={exInstructions} onChange={e => setExInstructions(e.target.value)} />
        <label htmlFor="exChart">Linked chart (optional)</label>
        <select id="exChart" className="builder-field" value={exChartId} onChange={e => setExChartId(e.target.value)}>
          <option value="">None</option>{charts.map(chart => <option key={chart.id} value={chart.id}>{chart.title}</option>)}
        </select>
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
