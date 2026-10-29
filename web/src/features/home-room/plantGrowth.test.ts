import { describe, expect, it } from 'vitest';
import { plantGrowth, stageThresholds } from './plantGrowth';

describe('plantGrowth', () => {
  it('grows with total minutes', () => {
    const [t1, t2, t3] = stageThresholds(300);
    expect([t1, t2, t3]).toEqual([60, 150, 300]);
    expect(plantGrowth(0, 300).stage).toBe(0);
    expect(plantGrowth(59, 300).stage).toBe(0);
    expect(plantGrowth(60, 300).stage).toBe(1);
    expect(plantGrowth(150, 300).stage).toBe(2);
    expect(plantGrowth(300, 300).stage).toBe(3);
  });

  it('reports minutes to the next stage', () => {
    expect(plantGrowth(10, 300).minutesToNext).toBe(50);
    expect(plantGrowth(400, 300).minutesToNext).toBeNull();
  });
});
