export type ChordQuality =
  | 'maj7'
  | 'm7'
  | '7'
  | 'dim7'
  | 'm7b5'
  | '7alt'
  | 'sus7'
  | 'major'
  | 'minor';

export interface ChordEvent {
  beat: number;
  duration_beats: number;
  root: string;
  quality: ChordQuality;
}

export interface ChartBar {
  number: number;
  section: string | null;
  events: ChordEvent[];
}

export interface Chart {
  id: string;
  title: string;
  concert_key: string;
  time_signature: [number, number];
  feel: string;
  form: string;
  bars: ChartBar[];
  license?: string;
  difficulty?: string;
  practice_focus?: string;
  representation?: string;
  related_standards?: string[];
}

export interface Exercise {
  id: string;
  title: string;
  category: string;
  level: string;
  duration_minutes: number;
  instructions: string;
  suggested_material: string;
  suggested_bpm: number | null;
  audio_asset_id: string | null;
  visibility: string;
  is_seed?: boolean;
  chart_id: string | null;
  /** Catalog instrument ids from seed `instruments`, or `All` for any instrument. */
  applicable_instruments: string[];
}

export interface RoutineStep {
  exercise_id: string;
  duration_minutes: number;
  /** Populated for cloud routines so steps stay playable without source exercise access. */
  snapshot?: {
    title: string;
    instructions: string;
    chart_id: string | null;
  };
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  level: string;
  duration_minutes: number;
  visibility: string;
  is_seed?: boolean;
  steps: RoutineStep[];
  applicable_instruments: string[];
}

export interface PracticePath {
  id: string;
  title: string;
  level: string;
  sessions: string[];
  guidance: string;
}

export interface SeedContent {
  license_notice: string;
  instruments: string[];
  exercises: Exercise[];
  charts: Chart[];
  routines: Routine[];
  paths: PracticePath[];
  initial_recordings: unknown[];
}

export type WrittenPitch = 'C' | 'Bb' | 'Eb';

export type Visibility = 'Private' | 'Public' | 'Unlisted';

export interface LocalExercise extends Exercise {
  is_seed: false;
}

export interface LocalRoutine extends Omit<Routine, 'is_seed'> {
  is_seed: false;
  description: string;
}

export interface PracticeSessionRecord {
  id: string;
  finishedAt: string;
  durationSeconds: number;
  routineId?: string;
  routineTitle?: string;
  exerciseId?: string;
}
