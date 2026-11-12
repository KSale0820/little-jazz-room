import { beforeEach, describe, expect, it } from 'vitest';
import { buildPitchSnapshot, deletePitchSnapshot, pitchSnapshotCsv, readPitchSnapshots,
  sameLocalDay, savePitchSnapshot } from './tunerPitchHistory';

const data = new Map<string, string>();
beforeEach(() => {
  data.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
    },
  });
});

describe('tuner pitch journal snapshots', () => {
  it('only saves real frequency measurements and preserves silent gaps', () => {
    expect(buildPitchSnapshot('chromatic', [{ timestamp: 0, frequency: null }])).toBeNull();
    const snapshot = buildPitchSnapshot('chromatic', [
      { timestamp: 1000, frequency: 440 },
      { timestamp: 1250, frequency: null },
      { timestamp: 1500, frequency: 441.456 },
    ], new Date('2026-11-11T18:00:00Z'));
    expect(snapshot?.samples).toEqual([
      { timestamp: 0, frequency: 440 },
      { timestamp: 250, frequency: null },
      { timestamp: 500, frequency: 441.46 },
    ]);
    expect(snapshot?.durationMs).toBe(500);
    expect(pitchSnapshotCsv(snapshot!)).toContain('0.25,');
  });

  it('separates account histories and deletes only selected captures', () => {
    const a = buildPitchSnapshot('guitar', [
      { timestamp: 10, frequency: 110 }, { timestamp: 260, frequency: 112 },
    ])!;
    expect(savePitchSnapshot('account-A', a)).toBe(true);
    expect(readPitchSnapshots('account-B')).toEqual([]);
    expect(readPitchSnapshots('account-A')[0].id).toBe(a.id);
    expect(deletePitchSnapshot('account-A', a.id)).toBe(true);
    expect(readPitchSnapshots('account-A')).toEqual([]);
  });

  it('matches calendar dates in local time, not UTC string prefixes', () => {
    expect(sameLocalDay('2026-11-11T09:00:00Z', '2026-11-11T19:00:00Z')).toBe(true);
    expect(sameLocalDay('invalid', '2026-11-11T19:00:00Z')).toBe(false);
  });
});
