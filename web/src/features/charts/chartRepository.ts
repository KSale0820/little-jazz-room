import type { Chart, Exercise, Routine } from '../../types/content';

const PREFIX = 'little-jazz-room:charts:v1:';

export function newLocalChartId(): string {
  return 'chart-local-' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
}

export interface ChartRepository {
  readonly scope: string;
  listCharts(): Chart[];
  getChart(id: string): Chart | undefined;
  saveChart(chart: Chart): void;
  deleteChart(id: string, exercises?: Exercise[], routines?: Routine[]): void;
}

export function createChartRepository(scope: string): ChartRepository {
  const key = PREFIX + scope;
  const read = (): Chart[] => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(raw)
        ? raw.filter((item): item is Chart => Boolean(item && typeof item === 'object'
          && typeof item.id === 'string' && item.id.startsWith('chart-local-')
          && typeof item.title === 'string' && Array.isArray(item.bars)))
        : [];
    } catch {
      return [];
    }
  };
  const write = (charts: Chart[]) => {
    // Do not swallow quota/security errors or tell the user a chart was saved when it was not.
    localStorage.setItem(key, JSON.stringify(charts));
  };
  return {
    scope,
    listCharts: read,
    getChart(id) { return read().find(chart => chart.id === id); },
    saveChart(chart) {
      if (!chart.id.startsWith('chart-local-') || !chart.is_custom) {
        throw new Error('Built-in charts are read-only. Use Duplicate to edit a copy.');
      }
      if (!chart.bars.length) throw new Error('Cannot save an empty chart.');
      const charts = read();
      const index = charts.findIndex(item => item.id === chart.id);
      if (index >= 0) charts[index] = chart;
      else charts.push(chart);
      write(charts);
    },
    deleteChart(id, exercises = [], routines = []) {
      const references = exercises.filter(exercise => exercise.chart_id === id);
      const snapshots = routines.filter(routine => routine.steps.some(step => step.snapshot?.chart_id === id));
      if (references.length || snapshots.length) {
        throw new Error('This chart is used by a practice exercise or routine. Unlink it before deleting.');
      }
      write(read().filter(chart => chart.id !== id));
    },
  };
}

export function mergeCharts(seeded: Chart[], custom: Chart[]): Chart[] {
  const builtInIds = new Set(seeded.map(chart => chart.id));
  return [...seeded, ...custom.filter(chart => !builtInIds.has(chart.id))];
}

export function getChartById(id: string | null | undefined, charts: Chart[]): Chart | undefined {
  return id ? charts.find(chart => chart.id === id) : undefined;
}
