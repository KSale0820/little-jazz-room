/** Device-local, account-scoped frequency snapshots. No audio is stored or uploaded. */
import type { PitchTrailSample, TuningMode } from '../pages/toolsAudio';

export interface TunerPitchSnapshot {
  id: string;
  savedAt: string;
  mode: TuningMode;
  durationMs: number;
  /** Relative elapsed milliseconds and detected Hz; null marks a silent gap. */
  samples: PitchTrailSample[];
}

const MAX_SAVED = 24;
const KEY_PREFIX = 'little-jazz-room:tuner-pitch-checks:v1:';
export const pitchSnapshotKey = (scope: string) => KEY_PREFIX + scope;

export function readPitchSnapshots(scope: string): TunerPitchSnapshot[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(pitchSnapshotKey(scope)) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is TunerPitchSnapshot =>
      item && typeof item === 'object' && typeof item.id === 'string' &&
      typeof item.savedAt === 'string' && Array.isArray(item.samples));
  } catch { return []; }
}

export function buildPitchSnapshot(
  mode: TuningMode, points: PitchTrailSample[], now = new Date(),
): TunerPitchSnapshot | null {
  const valid = points.filter(p => Number.isFinite(p.timestamp) &&
    (p.frequency === null || (Number.isFinite(p.frequency) && p.frequency > 0)));
  if (valid.filter(p => p.frequency !== null).length < 2) return null;
  const origin = valid[0].timestamp;
  const samples = valid.slice(-3600).map(p => ({
    timestamp: Math.max(0, Math.round(p.timestamp - origin)),
    frequency: p.frequency === null ? null : Math.round(p.frequency * 100) / 100,
  }));
  return {
    id: crypto.randomUUID(), savedAt: now.toISOString(), mode,
    durationMs: samples.at(-1)?.timestamp ?? 0, samples,
  };
}

export function savePitchSnapshot(scope: string, snapshot: TunerPitchSnapshot): boolean {
  try {
    const previous = readPitchSnapshots(scope);
    localStorage.setItem(pitchSnapshotKey(scope), JSON.stringify(
      [snapshot, ...previous.filter(item => item.id !== snapshot.id)].slice(0, MAX_SAVED)));
    return true;
  } catch { return false; }
}

export function deletePitchSnapshot(scope: string, id: string): boolean {
  try {
    localStorage.setItem(pitchSnapshotKey(scope), JSON.stringify(
      readPitchSnapshots(scope).filter(item => item.id !== id)));
    return true;
  } catch { return false; }
}

export function sameLocalDay(a: string, b: string): boolean {
  const first = new Date(a), second = new Date(b);
  return Number.isFinite(first.getTime()) && Number.isFinite(second.getTime()) &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export function pitchSnapshotCsv(snapshot: TunerPitchSnapshot): string {
  return ['elapsed_seconds,frequency_hz', ...snapshot.samples.map(p =>
    (p.timestamp / 1000).toFixed(2) + ',' + (p.frequency ?? ''))].join('\n');
}
