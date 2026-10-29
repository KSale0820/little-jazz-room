import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedCharts, seedExercises, seedPaths, seedRoutines } from '../data/seed';
import { useAuth } from './AuthContext';
import {
  createLocalRepository,
  mergeExercises,
  mergeRoutines,
  type LocalRepository,
} from '../repository/localRepository';
import { SupabasePracticeRepository } from '../repository/supabasePracticeRepository';
import { createSupabaseCatRepository, ensureProfileRow } from '../repository/supabaseCatRepository';
import { getSupabaseClient } from '../lib/supabase/client';
import type { Exercise, PracticeSessionRecord, Routine } from '../types/content';
import { useCatSelection } from '../features/cats/CatCompanion';
import { exercisesById } from '../data/seed';

interface AppContextValue {
  repo: LocalRepository;
  cloudRepo: SupabasePracticeRepository | null;
  sessions: PracticeSessionRecord[];
  addSession: (session: PracticeSessionRecord) => void;
  exercises: Exercise[];
  routines: Routine[];
  publicRoutines: Routine[];
  paths: typeof seedPaths;
  charts: typeof seedCharts;
  refreshLocal: () => void;
  refreshCloud: () => Promise<void>;
  saveRoutineToCloud: (routine: Routine, stepExerciseIds: string[]) => Promise<void>;
  saveExerciseToCloud: (exercise: Exercise) => Promise<void>;
  toast: string | null;
  showToast: (message: string) => void;
  focusMode: boolean;
  setFocusMode: (on: boolean) => void;
  catMotion: boolean;
  setCatMotion: (on: boolean) => void;
  catId: ReturnType<typeof useCatSelection>['catId'];
  chooseCat: ReturnType<typeof useCatSelection>['chooseCat'];
  catSaveError: string | null;
  activeRoutineId: string | null;
  setActiveRoutineId: (id: string | null) => void;
  teamSignedIn: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const FOCUS_KEY = 'little-jazz-room:focus-mode:v1';
const MOTION_KEY = 'little-jazz-room:cat-motion:v1';

function readBool(key: string, defaultValue: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch {
    /* optional */
  }
  return defaultValue;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const repo = useMemo(() => createLocalRepository(), []);
  const client = getSupabaseClient();
  const cloudRepo = useMemo(() => {
    if (!client || !user) return null;
    return new SupabasePracticeRepository(client, user.id);
  }, [client, user?.id]);

  const catRepo = useMemo(() => {
    if (!client || !user) return undefined;
    return createSupabaseCatRepository(client, user.id);
  }, [client, user?.id]);

  const accountKey = user?.id ?? 'local';
  const { catId, chooseCat, saveError: catSaveError } = useCatSelection(catRepo, accountKey);

  const [tick, setTick] = useState(0);
  const [sessionTick, setSessionTick] = useState(0);
  const [cloudTick, setCloudTick] = useState(0);
  const [cloudExercises, setCloudExercises] = useState<Exercise[]>([]);
  const [cloudRoutines, setCloudRoutines] = useState<Routine[]>([]);
  const [publicRoutines, setPublicRoutines] = useState<Routine[]>([]);
  const [cloudSessions, setCloudSessions] = useState<PracticeSessionRecord[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [focusMode, setFocusModeState] = useState(() => readBool(FOCUS_KEY, false));
  const [catMotion, setCatMotionState] = useState(() => readBool(MOTION_KEY, true));
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>('daily-warm-up');

  const refreshLocal = () => setTick(t => t + 1);
  const refreshCloud = async () => setCloudTick(t => t + 1);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!cloudRepo || !client || !user) {
      setCloudExercises([]);
      setCloudRoutines([]);
      setPublicRoutines([]);
      setCloudSessions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await ensureProfileRow(client, user.id);
        const [ex, rt, pub, sess] = await Promise.all([
          cloudRepo.listMyExercises(),
          cloudRepo.listMyRoutines(),
          cloudRepo.listPublicRoutines(),
          cloudRepo.listMySessions(),
        ]);
        if (!cancelled) {
          setCloudExercises(ex);
          setCloudRoutines(rt);
          setPublicRoutines(pub.filter(r => r.visibility === 'public'));
          setCloudSessions(sess);
        }
      } catch {
        if (!cancelled) showToast('Could not sync cloud data. Check connection and RLS.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloudRepo, client, user?.id, cloudTick]);

  const localSessions = useMemo(() => repo.listSessions(), [repo, sessionTick]);
  const sessions = user ? cloudSessions : localSessions;

  const addSession = (session: PracticeSessionRecord) => {
    if (cloudRepo) {
      void cloudRepo.addSession(session).then(() => setCloudTick(t => t + 1));
    } else {
      repo.addSession(session);
      setSessionTick(t => t + 1);
    }
  };

  const exercises = useMemo(() => {
    const local = repo.listLocalExercises();
    const mergedLocal = mergeExercises(seedExercises, local);
    if (!user) return mergedLocal;
    const map = new Map<string, Exercise>();
    for (const e of mergedLocal) map.set(e.id, e);
    for (const e of cloudExercises) map.set(e.id, e);
    return [...map.values()];
  }, [repo, tick, cloudExercises, user]);

  const routines = useMemo(() => {
    const local = repo.listLocalRoutines();
    const mergedLocal = mergeRoutines(seedRoutines, local);
    if (!user) return mergedLocal;
    const map = new Map<string, Routine>();
    for (const r of mergedLocal) map.set(r.id, r);
    for (const r of cloudRoutines) map.set(r.id, r);
    for (const r of publicRoutines) {
      if (!map.has(r.id)) map.set(r.id, r);
    }
    return [...map.values()];
  }, [repo, tick, cloudRoutines, publicRoutines, user]);

  useEffect(() => {
    if (!activeRoutineId) return;
    if (!routines.some(r => r.id === activeRoutineId)) {
      setActiveRoutineId(routines[0]?.id ?? null);
    }
  }, [routines, activeRoutineId]);

  const saveExerciseToCloud = async (exercise: Exercise) => {
    if (!cloudRepo) {
      showToast('Sign in to save exercises to the team cloud.');
      return;
    }
    await cloudRepo.saveExercise(exercise);
    await refreshCloud();
    showToast('Exercise saved to your team account.');
  };

  const saveRoutineToCloud = async (routine: Routine, stepExerciseIds: string[]) => {
    if (!cloudRepo) {
      showToast('Sign in to save routines to the team cloud.');
      return;
    }
    const snapshots = stepExerciseIds.map((id, sort_order) => {
      const ex = exercises.find(e => e.id === id) ?? exercisesById[id];
      return {
        sort_order,
        snapshot_title: ex?.title ?? 'Exercise',
        snapshot_instructions: ex?.instructions ?? '',
        snapshot_duration_minutes: ex?.duration_minutes ?? 5,
        snapshot_chart_id: ex?.chart_id ?? null,
        seed_exercise_id: exercisesById[id] ? id : null,
        source_exercise_id: ex && !exercisesById[id] && ex.is_seed === false ? id : null,
      };
    });
    await cloudRepo.saveRoutine(routine, snapshots);
    await refreshCloud();
    showToast('Routine saved to your team account.');
  };

  const setFocusMode = (on: boolean) => {
    setFocusModeState(on);
    try {
      localStorage.setItem(FOCUS_KEY, String(on));
    } catch {
      /* optional */
    }
  };

  const setCatMotion = (on: boolean) => {
    setCatMotionState(on);
    try {
      localStorage.setItem(MOTION_KEY, String(on));
    } catch {
      /* optional */
    }
  };

  useEffect(() => {
    document.body.classList.toggle('no-cat-motion', !catMotion);
  }, [catMotion]);

  const value: AppContextValue = {
    repo,
    cloudRepo,
    sessions,
    addSession,
    exercises,
    routines,
    publicRoutines,
    paths: seedPaths,
    charts: seedCharts,
    refreshLocal,
    refreshCloud,
    saveRoutineToCloud,
    saveExerciseToCloud,
    toast,
    showToast,
    focusMode,
    setFocusMode,
    catMotion,
    setCatMotion,
    catId,
    chooseCat,
    catSaveError,
    activeRoutineId,
    setActiveRoutineId,
    teamSignedIn: Boolean(user),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
