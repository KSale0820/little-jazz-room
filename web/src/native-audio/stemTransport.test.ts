import { describe, expect, it } from 'vitest';
import { positionAt, resolveOffset } from './stemTransport';

describe('shared-clock transport math', () => {
  it('clamps seeks and ignores invalid input', () => {
    expect(resolveOffset(-4, 12, null)).toBe(0);
    expect(resolveOffset(40, 12, null)).toBe(12);
    expect(resolveOffset(NaN, 12, null)).toBe(0);
  });
  it('wraps repeated loop positions on the same timeline', () => {
    expect(resolveOffset(5, 12, { start: 2, end: 4 })).toBe(3);
    expect(positionAt(18, 10, 12, { start: 2, end: 4 })).toBe(2);
    expect(positionAt(13.5, 10, 12, { start: 2, end: 4 })).toBe(3.5);
  });
  it('rejects invalid loop boundaries', () => {
    expect(() => resolveOffset(3, 12, { start: 5, end: 4 })).toThrow();
    expect(() => resolveOffset(3, 12, { start: 5, end: 13 })).toThrow();
  });
});
