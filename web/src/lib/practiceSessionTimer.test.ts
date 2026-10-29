import { describe, expect, it } from 'vitest';
import {
  commitStepElapsed,
  resetSessionTiming,
  sessionDurationSeconds,
} from './practiceSessionTimer';

describe('practiceSessionTimer', () => {
  it('sums accumulated and current step seconds for finish', () => {
    expect(sessionDurationSeconds(120, 45)).toBe(165);
  });

  it('accumulates time when skipping to next step', () => {
    let accumulated = 0;
    accumulated = commitStepElapsed(accumulated, 90);
    expect(accumulated).toBe(90);
    accumulated = commitStepElapsed(accumulated, 30);
    expect(accumulated).toBe(120);
    expect(sessionDurationSeconds(accumulated, 15)).toBe(135);
  });

  it('resetSessionTiming clears counters', () => {
    expect(resetSessionTiming()).toEqual({ accumulatedSeconds: 0, currentStepSeconds: 0 });
  });
});
