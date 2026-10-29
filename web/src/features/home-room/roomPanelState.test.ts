import { describe, expect, it } from 'vitest';
import { actionForObject, groupRoutines, nextPanel } from './roomPanelState';

describe('room interactions', () => {
  it('piano navigates to practice; other objects open panels', () => {
    expect(actionForObject('piano')).toEqual({ kind: 'navigate', to: '/practice' });
    expect(actionForObject('stand')).toEqual({ kind: 'panel', panel: 'music-stand' });
    expect(actionForObject('notebook')).toEqual({ kind: 'panel', panel: 'notebook' });
    expect(actionForObject('plants')).toEqual({ kind: 'panel', panel: 'plants' });
  });

  it('keeps one panel active at a time', () => {
    expect(nextPanel(null, 'notebook')).toBe('notebook');
    expect(nextPanel('notebook', 'plants')).toBe('plants');
    expect(nextPanel('plants', 'plants')).toBeNull();
    expect(nextPanel('plants', null)).toBeNull();
  });

  it('separates user routines from built-in examples', () => {
    const r = [{ id: 'a', is_seed: true }, { id: 'b', is_seed: false }, { id: 'c' }];
    const g = groupRoutines(r);
    expect(g.mine.map(x => x.id)).toEqual(['b']);
    expect(g.examples.map(x => x.id)).toEqual(['a', 'c']);
  });
});
