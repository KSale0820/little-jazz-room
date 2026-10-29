import type {
  Exercise,
  LocalExercise,
  LocalRoutine,
  PracticeSessionRecord,
  Routine,
  Visibility,
} from '../types/content';

const EX_KEY = 'little-jazz-room:local-exercises:v1';
const RT_KEY = 'little-jazz-room:local-routines:v1';
const SESS_KEY = 'little-jazz-room:practice-sessions:v1';
const DRAFT_KEY = 'little-jazz-room:create-draft:v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export interface CreateDraft {
  title: string;
  description: string;
  visibility: Visibility;
  stepExerciseIds: string[];
}

export interface LocalRepository {
  listLocalExercises(): LocalExercise[];
  saveLocalExercise(exercise: LocalExercise): void;
  deleteLocalExercise(id: string): void;
  listLocalRoutines(): LocalRoutine[];
  saveLocalRoutine(routine: LocalRoutine): void;
  deleteLocalRoutine(id: string): void;
  listSessions(): PracticeSessionRecord[];
  addSession(session: PracticeSessionRecord): void;
  readCreateDraft(): CreateDraft | null;
  writeCreateDraft(draft: CreateDraft): void;
}

export function createLocalRepository(): LocalRepository {
  return {
    listLocalExercises() {
      return readJson<LocalExercise[]>(EX_KEY, []);
    },
    saveLocalExercise(exercise) {
      const list = readJson<LocalExercise[]>(EX_KEY, []);
      const idx = list.findIndex(e => e.id === exercise.id);
      if (idx >= 0) list[idx] = exercise;
      else list.push(exercise);
      writeJson(EX_KEY, list);
    },
    deleteLocalExercise(id) {
      writeJson(
        EX_KEY,
        readJson<LocalExercise[]>(EX_KEY, []).filter(e => e.id !== id)
      );
    },
    listLocalRoutines() {
      return readJson<LocalRoutine[]>(RT_KEY, []);
    },
    saveLocalRoutine(routine) {
      const list = readJson<LocalRoutine[]>(RT_KEY, []);
      const idx = list.findIndex(r => r.id === routine.id);
      if (idx >= 0) list[idx] = routine;
      else list.push(routine);
      writeJson(RT_KEY, list);
    },
    deleteLocalRoutine(id) {
      writeJson(
        RT_KEY,
        readJson<LocalRoutine[]>(RT_KEY, []).filter(r => r.id !== id)
      );
    },
    listSessions() {
      return readJson<PracticeSessionRecord[]>(SESS_KEY, []);
    },
    addSession(session) {
      const list = readJson<PracticeSessionRecord[]>(SESS_KEY, []);
      list.unshift(session);
      writeJson(SESS_KEY, list.slice(0, 200));
    },
    readCreateDraft() {
      return readJson<CreateDraft | null>(DRAFT_KEY, null);
    },
    writeCreateDraft(draft) {
      writeJson(DRAFT_KEY, draft);
    },
  };
}

export function mergeExercises(seed: Exercise[], local: LocalExercise[]): Exercise[] {
  const map = new Map<string, Exercise>();
  for (const e of seed) map.set(e.id, e);
  for (const e of local) {
    map.set(e.id, {
      ...e,
      applicable_instruments: e.applicable_instruments?.length ? e.applicable_instruments : ['All'],
    });
  }
  return [...map.values()];
}

export function mergeRoutines(seed: Routine[], local: LocalRoutine[]): Routine[] {
  const map = new Map<string, Routine>();
  for (const r of seed) map.set(r.id, r);
  for (const r of local) {
    map.set(r.id, {
      ...r,
      applicable_instruments: r.applicable_instruments?.length ? r.applicable_instruments : ['All'],
    });
  }
  return [...map.values()];
}

export function newLocalExerciseId(): string {
  return `local-ex-${Date.now().toString(36)}`;
}

export function newLocalRoutineId(): string {
  return `local-rt-${Date.now().toString(36)}`;
}

export function routineDurationFromSteps(
  steps: { exercise_id: string; duration_minutes: number }[]
): number {
  return steps.reduce((n, s) => n + s.duration_minutes, 0);
}
