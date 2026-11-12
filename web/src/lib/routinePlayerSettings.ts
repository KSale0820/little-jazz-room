import type { Exercise, RoutinePlayerSettings, WrittenPitch } from '../types/content';
import type { LoopSection } from './practiceChartClock';

export type RoutineStepOutcome = 'complete' | 'needs-work' | 'skipped';
export type RoutineStepOutcomes = Record<number, RoutineStepOutcome>;

export interface ActivePlayerSettings {
  reference_bpm: number;
  chart_key: string;
  written_pitch: WrittenPitch;
  loop_enabled: boolean;
  loop_sections: LoopSection[];
  repeat: boolean;
}

export function defaultPlayerSettings(
  chartKey: string,
  suggestedBpm: number | null | undefined,
  preset?: RoutinePlayerSettings,
): ActivePlayerSettings {
  const reference_bpm = preset?.reference_bpm ?? suggestedBpm ?? 100;
  return {
    reference_bpm: Math.min(240, Math.max(40, Number.isFinite(reference_bpm) ? Math.round(reference_bpm) : 100)),
    chart_key: preset?.chart_key ?? chartKey,
    written_pitch: preset?.written_pitch ?? 'C',
    loop_enabled: preset?.loop_enabled ?? false,
    loop_sections: preset?.loop_sections?.map(section => ({ ...section })) ?? [],
    repeat: preset?.repeat ?? false,
  };
}

export function settingsChanged(current: ActivePlayerSettings, original: ActivePlayerSettings): boolean {
  return JSON.stringify(current) !== JSON.stringify(original);
}

export function makeSavedExercise(
  source: Exercise | undefined,
  title: string,
  instructions: string,
  chartId: string | null,
  durationMinutes: number,
  settings: ActivePlayerSettings,
): Exercise {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    category: source?.category ?? 'Technique',
    level: source?.level ?? 'Beginner',
    duration_minutes: durationMinutes,
    instructions,
    suggested_material: source?.suggested_material ?? 'Routine practice',
    suggested_bpm: settings.reference_bpm,
    audio_asset_id: source?.audio_asset_id ?? null,
    visibility: 'private',
    is_seed: false,
    chart_id: chartId,
    applicable_instruments: source?.applicable_instruments ?? ['All'],
    player_settings: {
      reference_bpm: settings.reference_bpm,
      chart_key: settings.chart_key,
      written_pitch: settings.written_pitch,
      loop_enabled: settings.loop_enabled,
      loop_sections: settings.loop_sections.map(section => ({ ...section })),
      repeat: settings.repeat,
    },
  };
}
