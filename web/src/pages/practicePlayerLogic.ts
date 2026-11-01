/** Millisecond-accurate elapsed time, independent of interval callback frequency. */
export function elapsedMilliseconds(
  storedMs: number,
  startedAtMs: number | null,
  nowMs: number,
): number {
  const active = startedAtMs === null ? 0 : Math.max(0, nowMs - startedAtMs);
  return Math.max(0, storedMs) + active;
}

/** A practice clock or friendly completion duration from actual seconds. */
export function formatPracticeTime(seconds: number, verbose = false): string {
  const safe = Math.max(0, Math.floor(seconds));
  if (verbose) {
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;
    if (minutes === 0) return safe + (safe === 1 ? ' second' : ' seconds');
    if (remainder === 0) return minutes + (minutes === 1 ? ' minute' : ' minutes');
    return minutes + ' min ' + remainder + ' sec';
  }
  const minutes = Math.floor(safe / 60);
  const secs = String(safe % 60).padStart(2, '0');
  if (minutes >= 60) return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0') + ':' + secs;
  return String(minutes).padStart(2, '0') + ':' + secs;
}
