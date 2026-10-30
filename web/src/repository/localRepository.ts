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

/** Logged-out browser profile; each authenticated user gets their own scope id. */
export const LOCAL_SCOPE_ANONYMOUS = 'anonymous';

export function localStorageScopeForUser(userId: string | null | undefined): string {
  return userId ?? LOCAL_SCOPE_ANONYMOUS;
}

function scopedKey(base: string, scope: string): string {
  return `${base}:${scope}`;
}

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
  scope: string;
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

export function createLocalRepository(scope: string = LOCAL_SCOPE_ANONYMOUS): LocalRepository {
  const exKey = scopedKey(EX_KEY, scope);
  const rtKey = scopedKey(RT_KEY, scope);
  const sessKey = scopedKey(SESS_KEY, scope);
  const draftKey = scopedKey(DRAFT_KEY, scope);

  return {
    scope,
    listLocalExercises() {
      return readJson<LocalExercise[]>(exKey, []);
    },
    saveLocalExercise(exercise) {
      const list = readJson<LocalExercise[]>(exKey, []);
      const idx = list.findIndex(e => e.id === exercise.id);
      if (idx >= 0) list[idx] = exercise;
      else list.push(exercise);
      writeJson(exKey, list);
    },
    deleteLocalExercise(id) {
      writeJson(
        exKey,
        readJson<LocalExercise[]>(exKey, []).filter(e => e.id !== id)
      );
    },
    listLocalRoutines() {
      return readJson<LocalRoutine[]>(rtKey, []);
    },
    saveLocalRoutine(routine) {
      const list = readJson<LocalRoutine[]>(rtKey, []);
      const idx = list.findIndex(r => r.id === routine.id);
      if (idx >= 0) list[idx] = routine;
      else list.push(routine);
      writeJson(rtKey, list);
    },
    deleteLocalRoutine(id) {
      writeJson(
        rtKey,
        readJson<LocalRoutine[]>(rtKey, []).filter(r => r.id !== id)
      );
    },
    listSessions() {
      return readJson<PracticeSessionRecord[]>(sessKey, []);
    },
    addSession(session) {
      const list = readJson<PracticeSessionRecord[]>(sessKey, []);
      if (list.some(s => s.id === session.id)) return;
      list.unshift(session);
      // Completion must report quota/storage failures so the user can retry.
      localStorage.setItem(sessKey, JSON.stringify(list.slice(0, 200)));
    },
    readCreateDraft() {
      return readJson<CreateDraft | null>(draftKey, null);
    },
    writeCreateDraft(draft) {
      writeJson(draftKey, draft);
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
