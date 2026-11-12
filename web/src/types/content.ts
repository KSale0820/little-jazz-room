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
  /** Optional visual instruction, never a timed chord event. */
  annotation?: string;
}

export interface Chart {
  id: string;
  title: string;
  concert_key: string;
  time_signature: [number, number];
  feel: string;
  form: string;
  bars: ChartBar[];
  style_instruction?: string;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
  license?: string;
  difficulty?: string;
  practice_focus?: string;
  representation?: string;
  related_standards?: string[];
}

/** Optional structured lesson content. Legacy/custom exercises retain string instructions. */
export interface ExerciseLesson {
  goal: string;
  steps: string[];
  listenFor: string;
  success: string;
  terminologyHelp?: string;
  catPrompts: string[];
  /** Suggested beginner learning order, not a prerequisite. */
  learningOrder: number;
}

/** Optional in-player defaults. Stored with local/custom exercises and routine steps. */
export interface RoutinePlayerSettings {
  reference_bpm?: number;
  chart_key?: string;
  written_pitch?: WrittenPitch;
  loop_enabled?: boolean;
  loop_sections?: Array<{ startBar: number; endBar: number; plays: number }>;
  repeat?: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  /** One-sentence beginner-friendly overview, when available. */
  description?: string;
  /** Structured lesson, optional to support legacy/cloud content. */
  lesson?: ExerciseLesson;
  category: string;
  level: string;
  duration_minutes: number;
  instructions: string;
  suggested_material: string;
  suggested_bpm: number | null;
  player_settings?: RoutinePlayerSettings;
  audio_asset_id: string | null;
  visibility: string;
  is_seed?: boolean;
  chart_id: string | null;
  /** Catalog instrument ids from seed `instruments`, or `All` for any instrument. */
  applicable_instruments: string[];
}

export interface RoutineStep {
  exercise_id: string;
  player_settings?: RoutinePlayerSettings;
  duration_minutes: number;
  /** Populated for cloud routines so steps stay playable without source exercise access. */
  snapshot?: {
    title: string;
    instructions: string;
    chart_id: string | null;
    player_settings?: RoutinePlayerSettings;
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
  /** Preserved display label even when the source routine is renamed or deleted. */
  routineTitle?: string;
  exerciseId?: string;
}
