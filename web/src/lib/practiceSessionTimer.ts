/** Accumulated practice time when moving between routine steps (includes skipped steps). */

export function sessionDurationSeconds(accumulatedSeconds: number, currentStepSeconds: number): number {
  return Math.max(0, accumulatedSeconds) + Math.max(0, currentStepSeconds);
}

/** Call before changing step index; returns new accumulated total. */
export function commitStepElapsed(accumulatedSeconds: number, currentStepSeconds: number): number {
  return sessionDurationSeconds(accumulatedSeconds, currentStepSeconds);
}

export function resetSessionTiming(): { accumulatedSeconds: number; currentStepSeconds: number } {
  return { accumulatedSeconds: 0, currentStepSeconds: 0 };
}
