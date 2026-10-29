import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { exercisesById } from '../data/seed';
import { useApp } from '../context/AppContext';
import {
  newLocalExerciseId,
  newLocalRoutineId,
  routineDurationFromSteps,
  type CreateDraft,
} from '../repository/localRepository';
import type { LocalExercise, LocalRoutine, Visibility } from '../types/content';

export function CreatePage() {
  const { repo, exercises, charts, refreshLocal, showToast } = useApp();
  const location = useLocation();
  const editId = (location.state as { editExerciseId?: string } | null)?.editExerciseId;

  const draft = useMemo(() => repo.readCreateDraft(), [repo]);
  const [title, setTitle] = useState(draft?.title ?? 'My First Jazz Routine');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [visibility, setVisibility] = useState<Visibility>(draft?.visibility ?? 'Private');
  const [stepIds, setStepIds] = useState<string[]>(
    draft?.stepExerciseIds?.length
      ? draft.stepExerciseIds
      : ['swing-2-4', 'thirds-sevenths', 'question-answer']
  );

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exTitle, setExTitle] = useState('');
  const [exCategory, setExCategory] = useState('Technique');
  const [exLevel, setExLevel] = useState('Beginner');
  const [exMinutes, setExMinutes] = useState(5);
  const [exInstructions, setExInstructions] = useState('');
  const [exChartId, setExChartId] = useState<string>('');

  useEffect(() => {
    if (editId && exercisesById[editId]) {
      const ex = exercises.find(e => e.id === editId) ?? exercisesById[editId];
      setShowExerciseForm(true);
      setExTitle(ex.title);
      setExCategory(ex.category);
      setExLevel(ex.level);
      setExMinutes(ex.duration_minutes);
      setExInstructions(ex.instructions);
      setExChartId(ex.chart_id ?? '');
    }
  }, [editId, exercises]);

  const persistDraft = () => {
    const d: CreateDraft = { title, description, visibility, stepExerciseIds: stepIds };
    repo.writeCreateDraft(d);
  };

  useEffect(() => {
    persistDraft();
  }, [title, description, visibility, stepIds]);

  const moveStep = (index: number, delta: number) => {
    const next = [...stepIds];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    setStepIds(next);
  };

  const saveExercise = () => {
    if (!exTitle.trim() || !exInstructions.trim()) {
      showToast('Exercise needs a title and instructions.');
      return;
    }
    const existing = editId ? exercises.find(e => e.id === editId) : undefined;
    const id =
      existing && 'is_seed' in existing && existing.is_seed === false ? editId! : newLocalExerciseId();
    const exercise: LocalExercise = {
      id,
      title: exTitle.trim(),
      category: exCategory,
      level: exLevel,
      duration_minutes: exMinutes,
      instructions: exInstructions.trim(),
      suggested_material: 'Custom exercise',
      suggested_bpm: null,
      audio_asset_id: null,
      visibility: 'private',
      is_seed: false,
      chart_id: exChartId || null,
      applicable_instruments: ['All'],
    };
    repo.saveLocalExercise(exercise);
    if (!stepIds.includes(id)) setStepIds([...stepIds, id]);
    refreshLocal();
    setShowExerciseForm(false);
    showToast('Exercise saved on this device.');
  };

  const saveRoutine = () => {
    const steps = stepIds.map(id => {
      const ex = exercises.find(e => e.id === id) ?? exercisesById[id];
      return { exercise_id: id, duration_minutes: ex?.duration_minutes ?? 5 };
    });
    const routine: LocalRoutine = {
      id: newLocalRoutineId(),
      title: title.trim() || 'Untitled routine',
      description,
      level: 'Beginner',
      duration_minutes: routineDurationFromSteps(steps),
      visibility: visibility.toLowerCase(),
      is_seed: false,
      steps,
      applicable_instruments: ['All'],
    };
    repo.saveLocalRoutine(routine);
    refreshLocal();
    showToast('Routine saved locally.');
  };

  return (
    <section className="page create-page pad tight" aria-label="Create">
      <div className="pageheading">
        <h2>Create Routine</h2>
        <button type="button" className="pill" onClick={() => showToast('Draft saved in this browser.')}>
          Save draft
        </button>
      </div>
      <label className="form-label" htmlFor="routineName">
        Title
      </label>
      <input
        className="field"
        id="routineName"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <label className="form-label" htmlFor="desc">
        Description
      </label>
      <textarea
        className="field"
        id="desc"
        placeholder="What do you want to practice?"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <div className="between" style={{ marginTop: 15 }}>
        <h3>Exercises</h3>
        <button type="button" className="pill" onClick={() => setShowExerciseForm(true)}>
          + Add Exercise
        </button>
      </div>
      <div id="exerciseRows">
        {stepIds.map((id, i) => {
          const ex = exercises.find(e => e.id === id) ?? exercisesById[id];
          const name = ex?.title ?? id;
          return (
            <div className="listrow" key={`${id}-${i}`}>
              <span className="num">{i + 1}</span>
              <span className="grow">
                <strong>{name}</strong>
                <small>
                  {ex?.duration_minutes ?? '?'} min · {ex?.category ?? 'Exercise'}
                </small>
              </span>
              <button type="button" className="btn tiny" aria-label={`Move ${name} up`} onClick={() => moveStep(i, -1)}>
                ↑
              </button>
              <button type="button" className="btn tiny" aria-label={`Move ${name} down`} onClick={() => moveStep(i, 1)}>
                ↓
              </button>
            </div>
          );
        })}
      </div>
      {showExerciseForm && (
        <div className="box exercise-form">
          <h3>{editId ? 'Edit exercise' : 'New exercise'}</h3>
          <label className="form-label" htmlFor="exTitle">
            Title
          </label>
          <input id="exTitle" className="field" value={exTitle} onChange={e => setExTitle(e.target.value)} />
          <label className="form-label" htmlFor="exCat">
            Category
          </label>
          <select id="exCat" className="field" value={exCategory} onChange={e => setExCategory(e.target.value)}>
            {['Technique', 'Harmony', 'Improvisation', 'Repertoire', 'Rhythm', 'Ear Training'].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className="form-label" htmlFor="exLevel">
            Level
          </label>
          <select id="exLevel" className="field" value={exLevel} onChange={e => setExLevel(e.target.value)}>
            {['Beginner', 'Intermediate', 'Advanced'].map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <label className="form-label" htmlFor="exMin">
            Duration (minutes)
          </label>
          <input
            id="exMin"
            type="number"
            min={1}
            className="field"
            value={exMinutes}
            onChange={e => setExMinutes(Number(e.target.value))}
          />
          <label className="form-label" htmlFor="exInst">
            Instructions
          </label>
          <textarea
            id="exInst"
            className="field"
            value={exInstructions}
            onChange={e => setExInstructions(e.target.value)}
          />
          <label className="form-label" htmlFor="exChart">
            Linked chart (optional)
          </label>
          <select id="exChart" className="field" value={exChartId} onChange={e => setExChartId(e.target.value)}>
            <option value="">None</option>
            {charts.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn primary" onClick={saveExercise}>
              Save exercise
            </button>
            <button type="button" className="btn" onClick={() => setShowExerciseForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <label className="form-label" htmlFor="visibility">
        Visibility
      </label>
      <select
        id="visibility"
        className="field"
        value={visibility}
        onChange={e => setVisibility(e.target.value as Visibility)}
      >
        <option>Private</option>
        <option>Unlisted</option>
        <option>Public</option>
      </select>
      <button type="button" className="btn primary wide" style={{ marginTop: 15 }} onClick={saveRoutine}>
        Save routine locally
      </button>
      <button
        type="button"
        className="btn wide"
        style={{ marginTop: 8 }}
        onClick={() =>
          showToast('Preview only: public sharing requires Supabase and authentication (Phase 2).')
        }
      >
        Publish Routine (Preview)
      </button>
      <p className="muted" style={{ margin: '10px 0' }}>
        Local prototype only. Cloud publish requires Phase 2 team authentication.
      </p>
    </section>
  );
}
