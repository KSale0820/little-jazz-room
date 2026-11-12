/** Subdivision values divide the notated measure evenly or subdivide it by 2/4. */
export function metronomeClickOptions(beatsPerBar: number): number[] {
  if (!Number.isInteger(beatsPerBar) || beatsPerBar < 1) return [1];
  const maximum = Math.min(32, beatsPerBar * 4);
  return Array.from({length: maximum}, (_, i) => i + 1)
    .filter(n => beatsPerBar % n === 0 || (n % beatsPerBar === 0 && n / beatsPerBar <= 4));
}
/** Quarter-note BPM, expressed in the source meter (including e.g. 6/8). */
export function secondsBetweenClicks(bpm: number, meter: readonly [number, number], clicksPerBar: number): number {
  if (!(bpm > 0) || !(meter[0] > 0) || !(meter[1] > 0) || !(clicksPerBar > 0)) return Infinity;
  return meter[0] * (4 / meter[1]) * (60 / bpm) / clicksPerBar;
}
/** Find scheduled downbeats after a media seek or pause without drifting from the song clock. */
export function playbackClickTimes(positionSeconds: number, intervalSeconds: number, latestTick: number, lookAhead = .12) {
  if (!Number.isFinite(positionSeconds) || !Number.isFinite(intervalSeconds) || intervalSeconds <= 0) return [] as {tick:number,delay:number}[];
  const earliest = Math.max(0, Math.ceil((positionSeconds - .005) / intervalSeconds));
  const events: {tick:number,delay:number}[] = [];
  for (let tick = Math.max(earliest, latestTick + 1); tick < earliest + 12; tick++) {
    const delay = tick * intervalSeconds - positionSeconds;
    if (delay > lookAhead) break;
    if (delay >= -.03) events.push({tick, delay:Math.max(.012,delay)});
  }
  return events;
}
export interface PlaybackClockSample {
  playing: boolean;
  /** Signed seconds relative to the first bar's downbeat, not the audio-file start. */
  positionSeconds: number;
  /** Effective source tempo, including any recorded playback-rate adjustment. */
  tempoBpm?: number;
}

/** Shared 0-based accent indexing for every click, including count-in.
 * UI Click 1 maps to index 0. Count-in must not silently suppress the selected
 * first-beat accent, or it sounds as though the emphasis arrives a beat late. */
export function metronomeClickSound(
  zeroBasedBeatIndex: number, selectedAccents: readonly boolean[], countingIn: boolean,
): { frequency: number; volume: number; accent: boolean } {
  const accent = Boolean(selectedAccents[zeroBasedBeatIndex]);
  return {
    accent,
    frequency: accent ? 1420 : countingIn ? 760 : 970,
    volume: accent ? .16 : countingIn ? .085 : .1,
  };
}
