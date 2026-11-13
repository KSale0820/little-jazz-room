/** Audio helpers shared by P04 (Tuner) and P05 (Metronome). No synthetic pitch data. */
export type TuningMode = 'chromatic' | 'guitar' | 'bass';
export type PitchReading = {
  frequency: number;
  note: string;
  cents: number;
  targetFrequency: number;
  targetLabel: string;
  isOpenString: boolean;
};

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
const OPEN_STRINGS = {
  guitar: [40, 45, 50, 55, 59, 64],
  bass: [28, 33, 38, 43],
} as const;

export function clampBpm(value: number): number {
  return Math.max(40, Math.min(240, Math.round(value)));
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function midiToName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12] + String(Math.floor(midi / 12) - 1);
}

export function readingFromFrequency(frequency: number, mode: TuningMode): PitchReading | null {
  if (!Number.isFinite(frequency) || frequency < 35 || frequency > 1400) return null;
  const measuredMidi = Math.round(69 + 12 * Math.log2(frequency / 440));
  let targetMidi = measuredMidi;
  let isOpenString = false;
  if (mode === 'guitar' || mode === 'bass') {
    const nearest = OPEN_STRINGS[mode].reduce((a, b) =>
      Math.abs(12 * Math.log2(frequency / midiToFrequency(a))) <
      Math.abs(12 * Math.log2(frequency / midiToFrequency(b))) ? a : b);
    // Do not claim an open string when the sound is far from standard tuning.
    if (Math.abs(12 * Math.log2(frequency / midiToFrequency(nearest))) <= 2) {
      targetMidi = nearest;
      isOpenString = true;
    }
  }
  const targetFrequency = midiToFrequency(targetMidi);
  return {
    frequency, note: midiToName(measuredMidi),
    cents: 1200 * Math.log2(frequency / targetFrequency),
    targetFrequency, targetLabel: midiToName(targetMidi), isOpenString,
  };
}

/** RMS signal level reported from actual microphone samples. */
export function inputRms(samples: Float32Array): number {
  if (!samples.length) return 0;
  let power = 0;
  for (let i = 0; i < samples.length; i += 4) power += samples[i] * samples[i];
  return Math.sqrt(power / Math.ceil(samples.length / 4));
}

// iPhone microphone input can be substantially quieter than desktop input.
// YIN's periodicity check still rejects silence and broadband noise.
export const MIN_TUNER_RMS = 0.0012;
export const QUIET_TUNER_RMS = 0.003;

/** YIN-style difference / cumulative mean normalized difference pitch estimate.
 * Returns null for silence, aperiodic noise, weak matches, or invalid audio.
 * A tuner must never manufacture a reading when a microphone has no signal.
 */
export function detectPitch(samples: Float32Array, sampleRate: number): number | null {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || samples.length < 4096) return null;
  if (inputRms(samples) < MIN_TUNER_RMS) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / 1200));
  const maxTau = Math.min(Math.ceil(sampleRate / 38), Math.floor(samples.length / 2) - 2);
  if (maxTau <= minTau) return null;
  const normalized = new Float32Array(maxTau + 2);
  // Analyze the most RECENT 2560 samples. The previous implementation read
  // the oldest part of the 8192-sample buffer, making live vocal tracking lag.
  // A wide enough window also captures multiple cycles of a lower voice.
  const count = Math.min(2560, samples.length - maxTau - 1);
  const offset = Math.max(0, samples.length - maxTau - count - 1);
  let cumulative = 0;
  for (let tau = 1; tau <= maxTau + 1; tau++) {
    let difference = 0;
    for (let i = 0; i < count; i += 3) {
      const delta = samples[offset + i] - samples[offset + i + tau];
      difference += delta * delta;
    }
    cumulative += difference;
    normalized[tau] = cumulative > 0 ? difference * tau / cumulative : 1;
  }

  // Sustained voices have vibrato, air and strong overtones; their periodic
  // YIN minima can sit above the strict 0.13 threshold used for pure tones.
  // Prefer the first good local minimum to reduce octave errors, then allow
  // a stronger fallback minimum only while the sound is still periodic.
  // Quiet iPhone input can contain more broadband interference: be more
  // conservative with periodicity as signal level approaches the noise floor.
  const quiet = inputRms(samples) < QUIET_TUNER_RMS;
  const strongThreshold = quiet ? 0.16 : 0.23;
  const weakThreshold = quiet ? 0.22 : 0.31;
  let bestTau = -1;
  let fallbackTau = -1;
  let fallbackValue = weakThreshold;
  for (let tau = minTau; tau < maxTau; tau++) {
    const value = normalized[tau];
    if (value > normalized[tau - 1] || value >= normalized[tau + 1]) continue;
    if (value < strongThreshold) {
      bestTau = tau;
      break;
    }
    if (value < fallbackValue) {
      fallbackValue = value;
      fallbackTau = tau;
    }
  }
  if (bestTau < 0) bestTau = fallbackTau;
  if (bestTau < 1 || normalized[bestTau] >= weakThreshold) return null;
  const a = normalized[bestTau - 1];
  const b = normalized[bestTau];
  const c = normalized[bestTau + 1];
  const divisor = a - 2 * b + c;
  const correction = Math.abs(divisor) > 1e-7 ? 0.5 * (a - c) / divisor : 0;
  const tau = bestTau + Math.max(-1, Math.min(1, correction));
  const frequency = sampleRate / tau;
  return frequency >= 35 && frequency <= 1400 ? frequency : null;
}


/** A pitch trail measures detected fundamental frequency over time, not loudness.
 * A null pitch is silence/unpitched audio and deliberately breaks the line.
 */
export type PitchTrailSample = { timestamp: number; frequency: number | null; wallTime?: number };
export type PitchTrailPoint = { x: number; y: number };
export type PitchTrailGeometry = {
  segments: PitchTrailPoint[][];
  lowNote: string;
  highNote: string;
  current: PitchTrailPoint | null;
};

export function pitchTrailGeometry(samples: PitchTrailSample[], now: number, durationMs = 8000): PitchTrailGeometry {
  const visible = samples.filter(s => s.timestamp >= now - durationMs && s.timestamp <= now);
  const semitones = visible.filter(s => s.frequency !== null && s.frequency > 0)
    .map(s => 69 + 12 * Math.log2(s.frequency! / 440));
  const mid = semitones.length
    ? (Math.min(...semitones) + Math.max(...semitones)) / 2 : 69;
  const span = Math.max(8, semitones.length ? Math.max(...semitones) - Math.min(...semitones) + 2 : 8);
  const low = mid - span / 2;
  const high = mid + span / 2;
  const segments: PitchTrailPoint[][] = [];
  let currentSegment: PitchTrailPoint[] = [];
  let current: PitchTrailPoint | null = null;
  for (const sample of visible) {
    if (sample.frequency === null || sample.frequency <= 0) {
      if (currentSegment.length) segments.push(currentSegment);
      currentSegment = [];
      current = null;
      continue;
    }
    const midi = 69 + 12 * Math.log2(sample.frequency / 440);
    const point = {
      x: Math.max(0, Math.min(320, ((sample.timestamp - (now - durationMs)) / durationMs) * 320)),
      y: Math.max(4, Math.min(90, 94 - ((midi - low) / (high - low)) * 90)),
    };
    currentSegment.push(point);
    current = point;
  }
  if (currentSegment.length) segments.push(currentSegment);
  return {
    segments, current,
    lowNote: midiToName(Math.round(low)),
    highNote: midiToName(Math.round(high)),
  };
}

/** Keep only the most recent *measured* pitch during a short drop-out.
 * Neither the reading nor the trail extrapolates a frequency.
 */
/** Ignore one-frame octave/harmonic errors without obscuring real note changes.
 * Jumps beyond a fifth must repeat consistently before they're accepted.
 * After a clear pause, any note can start immediately.
 */
export type PitchGate = { frequency: number; at: number; candidate: number | null; candidateAt: number } | null;
export function gatePitchFrequency(
  prior: PitchGate, frequency: number | null, now: number,
): { frequency: number | null; next: PitchGate } {
  if (frequency === null || !Number.isFinite(frequency)) return { frequency: null, next: prior };
  if (!prior || now - prior.at > 650 ||
    Math.abs(12 * Math.log2(frequency / prior.frequency)) <= 7) {
    return { frequency, next: { frequency, at: now, candidate: null, candidateAt: 0 } };
  }
  if (prior.candidate !== null &&
    Math.abs(12 * Math.log2(frequency / prior.candidate)) < 0.7 &&
    now - prior.candidateAt >= 100) {
    return { frequency, next: { frequency, at: now, candidate: null, candidateAt: 0 } };
  }
  return { frequency: null, next: {
    ...prior, candidate: frequency, candidateAt:
      prior.candidate !== null &&
      Math.abs(12 * Math.log2(frequency / prior.candidate)) < 0.7 ? prior.candidateAt : now,
  } };
}

export const PITCH_DROPOUT_MS = 400;
export type RecentPitch = { reading: PitchReading; at: number } | null;

export function retainMeasuredPitch(
  recent: RecentPitch, measurement: PitchReading | null, now: number,
): { recent: RecentPitch; displayed: PitchReading | null; measured: boolean } {
  if (measurement) {
    const updated = { reading: measurement, at: now };
    return { recent: updated, displayed: measurement, measured: true };
  }
  if (recent && now - recent.at <= PITCH_DROPOUT_MS) {
    return { recent, displayed: recent.reading, measured: false };
  }
  return { recent: null, displayed: null, measured: false };
}

/** For compound 6/8, BPM means dotted-quarter beats; each click is an eighth note. */
export function beatIntervalSeconds(bpm: number, signature: string): number {
  return 60 / clampBpm(bpm) / (signature === '6/8' ? 3 : 1);
}

export function beatsPerMeasure(signature: string): number {
  return signature === '6/8' ? 6 : Number(signature.split('/')[0]);
}

export function defaultAccents(signature: string): boolean[] {
  return Array.from({ length: beatsPerMeasure(signature) }, (_, index) =>
    index === 0 || (signature === '6/8' && index === 3));
}

export function audioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const support = window as Window & { webkitAudioContext?: typeof AudioContext };
  return typeof AudioContext === 'function' ? AudioContext : support.webkitAudioContext ?? null;
}
