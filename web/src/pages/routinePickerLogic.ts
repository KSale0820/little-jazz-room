import type { Exercise, Routine, RoutineStep } from '../types/content';

export interface BuilderStep { exerciseId: string; minutes: number }

/** Compact preview only; keep the original instructions for editing and practice. */
export function exerciseSummary(exercise: Exercise): string {
  const text = (exercise.description?.trim() || exercise.lesson?.goal?.trim() || exercise.instructions.trim())
    .replace(/^(?:Goal:\s*|\d+[.)]\s*)/i, '').replace(/\s+/g, ' ');
  return text.match(/^.*?[.!?](?=\s|$)/)?.[0] || text || `Practice ${exercise.title}.`;
}

export interface RoutineImportEntry {
  exerciseId: string;
  minutes: number;
  source: RoutineStep;
}

export interface RoutineImportPreview {
  additions: RoutineImportEntry[];
  duplicates: number;
  unavailable: number;
}

const goalKeywords: Record<string, string> = {
  'Ear Training': 'listen hear sing recognize pitch',
  Harmony: 'chord chords notes guide tones arpeggio',
  Improvisation: 'improvise solo blues phrases',
  Rhythm: 'beat count tempo swing timing groove',
  Technique: 'warm up technique scales notes',
  Repertoire: 'song standard blues form chart'
};

const normalize = (text: string): string => text.normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase();

function matchesSearch(text: string, search: string): boolean {
  return normalize(search).trim().split(/\s+/).every(part => normalize(text).includes(part));
}

export function searchCatalogExercises(exercises: Exercise[], search = '', level = '', goal = ''): Exercise[] {
  return exercises.filter(exercise => {
    if (level && exercise.level !== level) return false;
    if (goal && exercise.category !== goal) return false;
    return matchesSearch([
      exercise.title, exercise.instructions, exercise.category,
      exercise.suggested_material, goalKeywords[exercise.category] ?? ''
    ].join(' '), search);
  });
}

export function searchCatalogRoutines(
  routines: Routine[], exercises: Exercise[], search = '', level = '', goal = ''
): Routine[] {
  const byId = new Map(exercises.map(exercise => [exercise.id, exercise]));
  return routines.filter(routine => {
    if (level && routine.level !== level) return false;
    const linked = routine.steps.map(step => byId.get(step.exercise_id));
    const categories = linked.map(exercise => exercise?.category ?? '');
    const practiceGoal = (routine as Routine & { goal?: string }).goal ?? '';
    if (goal && practiceGoal !== goal && !categories.includes(goal) &&
      !(goal === 'Repertoire' && practiceGoal === 'Jazz standards')) return false;
    return matchesSearch([
      routine.title, routine.description ?? '', practiceGoal, goalKeywords[practiceGoal] ?? '',
      ...linked.flatMap(exercise => exercise ?
        [exercise.title, exercise.category, exercise.instructions, goalKeywords[exercise.category] ?? ''] : []),
      ...routine.steps.map(step => step.snapshot?.title ?? ''),
      ...routine.steps.map(step => step.snapshot?.instructions ?? '')
    ].join(' '), search);
  });
}

/** Deterministic scoped local copy of a publicly shared step with no accessible source exercise. */
export function snapshotExerciseId(routineId: string, index: number): string {
  return 'local-ex-import:' + encodeURIComponent(routineId) + ':' + index;
}

/** Does not mutate the source routine or existing builder steps. */
export function previewRoutineImport(
  routine: Routine,
  existing: BuilderStep[],
  exercises: Exercise[]
): RoutineImportPreview {
  const available = new Set(exercises.map(exercise => exercise.id));
  // Preserve intentionally repeated practice exercises and per-occurrence durations.
  // Each unavailable snapshot receives a stable identity keyed by source step index.
  void existing;
  const preview: RoutineImportPreview = { additions: [], duplicates: 0, unavailable: 0 };
  routine.steps.forEach((step, index) => {
    const exerciseId = available.has(step.exercise_id) ? step.exercise_id
      : step.snapshot ? snapshotExerciseId(routine.id, index) : '';
    if (!exerciseId) { preview.unavailable++; return; }
    preview.additions.push({ exerciseId, minutes: step.duration_minutes, source: step });
  });
  return preview;
}

export function appendBuilderExercise(steps: BuilderStep[], exercise: Exercise): BuilderStep[] {
  return [...steps, { exerciseId: exercise.id, minutes: exercise.duration_minutes }];
}
