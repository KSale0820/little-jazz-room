import { describe, expect, it } from 'vitest';
import { nextFallbackIndex } from './imageFallback';

describe('nextFallbackIndex', () => {
  it('advances on failure and stops at the last candidate', () => {
    expect(nextFallbackIndex({ key: 'a', index: 0 }, 'a', 2)).toEqual({ key: 'a', index: 1 });
    expect(nextFallbackIndex({ key: 'a', index: 1 }, 'a', 2)).toEqual({ key: 'a', index: 1 });
  });

  it('restarts from the first candidate when the reset key changes', () => {
    expect(nextFallbackIndex({ key: 'luna', index: 1 }, 'milo', 2)).toEqual({ key: 'milo', index: 1 });
  });
});
