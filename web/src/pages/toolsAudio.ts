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
  if (mode !== 'chromatic') {
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

/** YIN-style difference / cumulative mean normalized difference pitch estimate.
 * Returns null for silence, aperiodic noise, weak matches, or invalid audio.
 * A tuner must never manufacture a reading when a microphone has no signal.
 */
export function detectPitch(samples: Float32Array, sampleRate: number): number | null {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || samples.length < 4096) return null;
  let power = 0;
  for (let i = 0; i < samples.length; i += 4) power += samples[i] * samples[i];
  const rms = Math.sqrt(power / Math.ceil(samples.length / 4));
  if (rms < 0.012) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / 1200));
  const maxTau = Math.min(Math.ceil(sampleRate / 38), Math.floor(samples.length / 2) - 2);
  if (maxTau <= minTau) return null;
  const differences = new Float32Array(maxTau + 2);
  const normalized = new Float32Array(maxTau + 2);
  const count = Math.min(3072, samples.length - maxTau - 1);
  let cumulative = 0;
  for (let tau = 1; tau <= maxTau + 1; tau++) {
    let difference = 0;
    for (let i = 0; i < count; i += 2) {
      const delta = samples[i] - samples[i + tau];
      difference += delta * delta;
    }
    differences[tau] = difference;
    cumulative += difference;
    normalized[tau] = cumulative > 0 ? difference * tau / cumulative : 1;
  }

  let bestTau = -1;
  for (let tau = minTau; tau < maxTau; tau++) {
    if (normalized[tau] < 0.13) {
      while (tau + 1 < maxTau && normalized[tau + 1] < normalized[tau]) tau++;
      bestTau = tau;
      break;
    }
  }
  if (bestTau < 0 || normalized[bestTau] > 0.13) return null;
  const a = normalized[bestTau - 1];
  const b = normalized[bestTau];
  const c = normalized[bestTau + 1];
  const divisor = a - 2 * b + c;
  const correction = Math.abs(divisor) > 1e-7 ? 0.5 * (a - c) / divisor : 0;
  const tau = bestTau + Math.max(-1, Math.min(1, correction));
  const frequency = sampleRate / tau;
  return frequency >= 35 && frequency <= 1400 ? frequency : null;
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
