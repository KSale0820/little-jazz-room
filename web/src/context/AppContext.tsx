import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedCharts, seedExercises, seedPaths, seedRoutines } from '../data/seed';
import {
  createLocalRepository,
  mergeExercises,
  mergeRoutines,
  type LocalRepository,
} from '../repository/localRepository';
import type { Exercise, PracticeSessionRecord, Routine } from '../types/content';
import { useCatSelection } from '../features/cats/CatCompanion';

interface AppContextValue {
  repo: LocalRepository;
  sessions: PracticeSessionRecord[];
  addSession: (session: PracticeSessionRecord) => void;
  exercises: Exercise[];
  routines: Routine[];
  paths: typeof seedPaths;
  charts: typeof seedCharts;
  refreshLocal: () => void;
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
  const repo = useMemo(() => createLocalRepository(), []);
  const { catId, chooseCat, saveError: catSaveError } = useCatSelection();
  const [tick, setTick] = useState(0);
  const [sessionTick, setSessionTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [focusMode, setFocusModeState] = useState(() => readBool(FOCUS_KEY, false));
  const [catMotion, setCatMotionState] = useState(() => readBool(MOTION_KEY, true));
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>('daily-warm-up');

  const refreshLocal = () => setTick(t => t + 1);

  const sessions = useMemo(() => repo.listSessions(), [repo, sessionTick]);

  const addSession = (session: PracticeSessionRecord) => {
    repo.addSession(session);
    setSessionTick(t => t + 1);
  };

  const exercises = useMemo(
    () => mergeExercises(seedExercises, repo.listLocalExercises()),
    [repo, tick]
  );
  const routines = useMemo(
    () => mergeRoutines(seedRoutines, repo.listLocalRoutines()),
    [repo, tick]
  );

  useEffect(() => {
    if (!activeRoutineId) return;
    if (!routines.some(r => r.id === activeRoutineId)) {
      setActiveRoutineId(routines[0]?.id ?? null);
    }
  }, [routines, activeRoutineId]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
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
    sessions,
    addSession,
    exercises,
    routines,
    paths: seedPaths,
    charts: seedCharts,
    refreshLocal,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
