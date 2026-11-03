import { describe, expect, it } from 'vitest';
import { assertNativeAudioStorage } from './localRecordings';

describe('private recording storage', () => {
  it('refuses to stage recordings in a normal browser', () => {
    expect(() => assertNativeAudioStorage()).toThrow(/installed iOS or Android/);
  });
});
