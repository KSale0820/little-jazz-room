export interface FallbackState {
  key: string;
  index: number;
}

/** State after one more image failure. A different key means "new image": the failure counts from zero. */
export function nextFallbackIndex(prev: FallbackState, key: string, candidateCount: number): FallbackState {
  const current = prev.key === key ? prev.index : 0;
  return current < candidateCount - 1 ? { key, index: current + 1 } : { key, index: Math.min(current, candidateCount - 1) };
}

export function activeFallbackIndex(state: FallbackState, key: string, candidateCount: number): number {
  return Math.min(state.key === key ? state.index : 0, candidateCount - 1);
}
