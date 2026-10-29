import { PRACTICE_MILESTONE_MINUTES } from '../../lib/practiceStats';

export type PlantStage = 0 | 1 | 2 | 3;

export interface PlantGrowth {
  stage: PlantStage;
  label: string;
  minutesToNext: number | null;
  nextStageMinutes: number | null;
}

const STAGES: { stage: PlantStage; label: string }[] = [
  { stage: 0, label: 'Sprouting' },
  { stage: 1, label: 'Leafing out' },
  { stage: 2, label: 'Budding' },
  { stage: 3, label: 'In bloom' },
];

/** Stage thresholds are fractions of the existing practice milestone. */
export function stageThresholds(milestone = PRACTICE_MILESTONE_MINUTES): [number, number, number] {
  return [Math.round(milestone * 0.2), Math.round(milestone * 0.5), milestone];
}

/** Growth only ever depends on total logged minutes, so it never regresses. */
export function plantGrowth(totalMinutes: number, milestone = PRACTICE_MILESTONE_MINUTES): PlantGrowth {
  const [t1, t2, t3] = stageThresholds(milestone);
  const stage: PlantStage = totalMinutes >= t3 ? 3 : totalMinutes >= t2 ? 2 : totalMinutes >= t1 ? 1 : 0;
  const next = stage === 0 ? t1 : stage === 1 ? t2 : stage === 2 ? t3 : null;
  return {
    stage,
    label: STAGES[stage].label,
    nextStageMinutes: next,
    minutesToNext: next === null ? null : Math.max(0, next - totalMinutes),
  };
}
