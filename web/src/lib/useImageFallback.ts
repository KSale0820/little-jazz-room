import { useCallback, useState } from 'react';
import { activeFallbackIndex, nextFallbackIndex, type FallbackState } from './imageFallback';

/**
 * Walks an ordered list of candidate URLs when an image fails to load.
 * Failure progress is tied to `resetKey` (cat id, lighting, ...), so changing it
 * restarts from the first candidate instead of inheriting a stale fallback.
 */
export function useImageFallback(candidates: readonly string[], resetKey: string) {
  const [state, setState] = useState<FallbackState>({ key: resetKey, index: 0 });
  const index = activeFallbackIndex(state, resetKey, candidates.length);
  const onError = useCallback(
    () => setState(prev => nextFallbackIndex(prev, resetKey, candidates.length)),
    [resetKey, candidates.length],
  );
  return { src: candidates[index], onError };
}
