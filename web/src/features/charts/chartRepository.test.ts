import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildChartFromDraft, freshChartDraft } from './chartModel';
import { createChartRepository, getChartById, mergeCharts, newLocalChartId } from './chartRepository';
import type { Chart, Exercise } from '../../types/content';

const stored = new Map<string, string>();
beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  });
});

function chart(): Chart {
  const draft = freshChartDraft();
  draft.title = 'My ii–V–I';
  draft.bars[0]!.events[0]!.symbol = 'Dm7';
  draft.bars[1]!.events[0]!.symbol = 'G7';
  draft.bars[2]!.events[0]!.symbol = 'Cmaj7';
  draft.bars[3]!.events[0]!.symbol = 'Cmaj7';
  return buildChartFromDraft(draft, newLocalChartId());
}

describe('local-first chart repository', () => {
  it('saves, retrieves, edits and lists charts with stable IDs', () => {
    const repository = createChartRepository('user-a');
    const created = chart();
    repository.saveChart(created);
    expect(repository.getChart(created.id)).toEqual(created);
    repository.saveChart({ ...created, title: 'Edited name' });
    expect(repository.listCharts()).toHaveLength(1);
    expect(repository.getChart(created.id)?.title).toBe('Edited name');
    expect(createChartRepository('user-a').getChart(created.id)?.bars[0]?.events[0]?.root).toBe('D');
  });

  it('isolates signed-in account data and anonymous charts', () => {
    const saved = chart();
    createChartRepository('user-a').saveChart(saved);
    expect(createChartRepository('user-b').getChart(saved.id)).toBeUndefined();
    expect(createChartRepository('anonymous').listCharts()).toHaveLength(0);
  });

  it('never overrides built-in charts', () => {
    const saved = chart();
    expect(() => createChartRepository('user-a').saveChart({ ...saved, id: 'ii-v-i-c', is_custom: false })).toThrow(/read-only/);
    expect(mergeCharts([{ ...saved, id: 'seed-one' }], [saved]).map(c => c.id)).toEqual(['seed-one', saved.id]);
    expect(getChartById(saved.id, [saved])).toEqual(saved);
  });

  it('blocks deletion while an exercise references the chart', () => {
    const repository = createChartRepository('user-a');
    const saved = chart();
    repository.saveChart(saved);
    const exercises = [{ id: 'ex1', chart_id: saved.id }] as Exercise[];
    expect(() => repository.deleteChart(saved.id, exercises)).toThrow(/Unlink/);
    expect(repository.getChart(saved.id)).toBeDefined();
    repository.deleteChart(saved.id);
    expect(repository.getChart(saved.id)).toBeUndefined();
  });

  it('surfaces browser storage failures instead of claiming success', () => {
    const repository = createChartRepository('user-a');
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('Quota exceeded'); },
    });
    expect(() => repository.saveChart(chart())).toThrow('Quota exceeded');
  });
});
