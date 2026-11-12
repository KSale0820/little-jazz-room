import type { Chart } from '../types/content';
import type { GuidedLesson } from './guidedLesson';

export type StepChordRange = [number, number];
export interface StepChartSection {
  stepNumber: number;
  startBar: number;
  endBar: number;
}

/** Map one written lesson step to the chart's actual measures, not inferred
 * from arbitrary words or from a cosmetic A/B/C form label. Bar indices are
 * 1-based and inclusive in lesson metadata. */
export function lessonChordRange(
  lesson: Pick<GuidedLesson, 'stepChordRanges'>,
  chart: Chart,
  stepIndex: number,
): StepChordRange | null {
  const range = lesson.stepChordRanges?.[stepIndex];
  if (!range) return null;
  const [start, end] = range;
  if (!Number.isInteger(start) || !Number.isInteger(end) ||
      start < 1 || start > end || end > chart.bars.length) return null;
  return [start, end];
}

/** Label the full chart as lesson steps only if explicit lesson ranges
 * cover all measures in order, once each. Overlapping/partial mappings
 * fall back to the original chart grid, so no chord is hidden or relabeled. */
export function routineStepChartSections(
  lesson: Pick<GuidedLesson, 'stepChordRanges'>,
  chart: Chart,
): StepChartSection[] {
  if (!chart.bars.length) return [];
  const sections: StepChartSection[] = [];
  let nextBar = 1;
  lesson.stepChordRanges?.forEach((range, index) => {
    if (!range || range[0] !== nextBar) return;
    const valid = lessonChordRange(lesson, chart, index);
    if (!valid) return;
    sections.push({ stepNumber: index + 1, startBar: valid[0], endBar: valid[1] });
    nextBar = valid[1] + 1;
  });
  return sections.length >= 2 && nextBar === chart.bars.length + 1 ? sections : [];
}
