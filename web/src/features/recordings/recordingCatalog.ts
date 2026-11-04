/**
 * Owned/licensed stereo recordings supplied by the project owner.
 *
 * A recording may be a finished stereo MP3/M4A/WAV; stems are NOT required.
 * Leave the list empty until real playable, permission-cleared audio files exist.
 * Audio served from public/audio/backing-tracks/ has no Supabase dependency.
 */
/** Literal measure order displayed by a recording, including repeats and a final tag. */
export interface RecordingArrangement {
  formBars: number;
  completePasses: number;
  finalPassBars: number;
  tagStartBar: number;
  tagBars: number;
}

export interface RecordedBackingTrack {
  id: string;
  title: string;
  subtitle: string;
  chartId: string | null;
  src: string;
  style: string;
  key: string;
  difficulty: string;
  instruments: string[];
  blues: boolean;
  /** Original recording speed in quarter notes per minute, NOT an audio DSP knob. */
  recordedBpm: number | null;
  /** First beat of the linked chart measured from the beginning of the recording. */
  chartStartSeconds: number | null;
  /** Recording-specific, video-verified passage order; never inferred from chart length. */
  arrangement?: RecordingArrangement;
  /** A note establishing ownership/licensing to use the audio in this app. */
  rightsNote: string;
}

/** The owner supplied this recording as an MP4; only the AAC audio is retained. */
export const RECORDED_BACKING_TRACKS: RecordedBackingTrack[] = [{
  id: 'autumn-leaves',
  title: 'Autumn Leaves',
  subtitle: 'Jazz backing track · audio only',
  chartId: 'autumn-leaves-gm-video-35', // Exact chord symbols from the original user-supplied video.
  src: '/audio/backing-tracks/autumn-leaves.m4a',
  style: 'Jazz',
  key: 'G minor',
  difficulty: 'All',
  instruments: ['All'],
  blues: false,
  recordedBpm: 170, // Verified from every highlighted measure in five passes of the video.
  chartStartSeconds: 5.75, // Video first black-highlighted measure begins ~5.767s (30 fps).
  arrangement: { formBars: 32, completePasses: 4, finalPassBars: 30, tagStartBar: 33, tagBars: 3 },
  rightsNote: 'Creator supplied the video and confirmed ownership of the recording.',
}];

export type SyncedRecording = RecordedBackingTrack & {
  chartId: string;
  recordedBpm: number;
  chartStartSeconds: number;
};

export function hasChartSync(recording: RecordedBackingTrack): recording is SyncedRecording {
  return recording.chartId !== null && recording.chartId.trim().length > 0 &&
    recording.recordedBpm !== null && recording.recordedBpm > 0 &&
    Number.isFinite(recording.recordedBpm) &&
    recording.chartStartSeconds !== null &&
    Number.isFinite(recording.chartStartSeconds) && recording.chartStartSeconds >= 0;
}


/** Return a zero-based chart-bar index for every measure actually sounded on the recording. */
export function recordingBarSequence(
  recording: Pick<RecordedBackingTrack, 'arrangement'>, chartBarCount: number,
): number[] {
  if (!Number.isInteger(chartBarCount) || chartBarCount < 1) return [];
  const form = recording.arrangement;
  if (!form) return Array.from({ length: chartBarCount }, (_, index) => index);
  if (![form.formBars, form.completePasses, form.finalPassBars, form.tagStartBar, form.tagBars].every(Number.isInteger)
    || form.formBars < 1 || form.completePasses < 0 || form.finalPassBars < 0
    || form.finalPassBars > form.formBars || form.formBars > chartBarCount
    || form.tagStartBar < 1 || form.tagBars < 1
    || form.tagStartBar + form.tagBars - 1 > chartBarCount) return [];
  const fullPass = Array.from({ length: form.formBars }, (_, index) => index);
  return [
    ...Array.from({ length: form.completePasses }, () => fullPass).flat(),
    ...fullPass.slice(0, form.finalPassBars),
    ...Array.from({ length: form.tagBars }, (_, index) => form.tagStartBar - 1 + index),
  ];
}

/** Actual audio.currentTime controls the chart beat, including last-chorus jump to tag. */
export function chartBeatAtRecordingTime(
  seconds: number, recording: SyncedRecording,
  meter: readonly [number, number], chartBarCount: number,
): number {
  const sequence = recordingBarSequence(recording, chartBarCount);
  if (!sequence.length) return 0;
  const perBar = meter[0];
  const absoluteBeat = chartBeatForRecordingTime(seconds, recording, meter);
  const clampedBeat = Math.min(sequence.length * perBar - 1e-6, Math.max(0, absoluteBeat));
  const sequenceBar = Math.floor(clampedBeat / perBar);
  return sequence[sequenceBar]! * perBar + clampedBeat % perBar;
}

/** Tapping a chart bar seeks the closest occurrence, not always the first chorus. */
export function recordingTimeForSelectedBar(
  barIndex: number, nowSeconds: number, recording: SyncedRecording,
  meter: readonly [number, number], chartBarCount: number,
): number {
  const sequence = recordingBarSequence(recording, chartBarCount);
  const perBar = meter[0];
  const current = Math.min(sequence.length - 1,
    Math.floor(chartBeatForRecordingTime(nowSeconds, recording, meter) / perBar));
  let closest = -1;
  let distance = Infinity;
  sequence.forEach((value, index) => {
    if (value !== barIndex) return;
    const delta = Math.abs(index - current);
    if (delta < distance || (delta === distance && index > closest)) {
      closest = index;
      distance = delta;
    }
  });
  return closest < 0 ? nowSeconds : recordingTimeForChartBeat(closest * perBar, recording, meter);
}

/** Previous/next measure follows actual chronology, including the skipped final two bars. */
export function recordingTimeForAdjacentBar(
  delta: number, nowSeconds: number, recording: SyncedRecording,
  meter: readonly [number, number], chartBarCount: number,
): number {
  const sequence = recordingBarSequence(recording, chartBarCount);
  if (!sequence.length) return nowSeconds;
  const perBar = meter[0];
  const current = Math.min(sequence.length - 1,
    Math.floor(chartBeatForRecordingTime(nowSeconds, recording, meter) / perBar));
  const next = Math.max(0, Math.min(sequence.length - 1, current + delta));
  return recordingTimeForChartBeat(next * perBar, recording, meter);
}

export function recordingById(id: string | null): RecordedBackingTrack | null {
  return RECORDED_BACKING_TRACKS.find(recording => recording.id === id) ?? null;
}

export function chartBeatForRecordingTime(
  seconds: number, recording: Pick<SyncedRecording, 'recordedBpm' | 'chartStartSeconds'>,
  timeSignature: readonly [number, number],
): number {
  const quarterNotes = Math.max(0, seconds - recording.chartStartSeconds) * recording.recordedBpm / 60;
  return quarterNotes * timeSignature[1] / 4;
}

export function recordingTimeForChartBeat(
  chartBeat: number, recording: Pick<SyncedRecording, 'recordedBpm' | 'chartStartSeconds'>,
  timeSignature: readonly [number, number],
): number {
  return recording.chartStartSeconds + Math.max(0, chartBeat) * 60 * 4 / (recording.recordedBpm * timeSignature[1]);
}

/** Reject invalid catalog entries before enabling their buttons in the Tracks UI. */
export function isUsableRecordedTrack(recording: RecordedBackingTrack): boolean {
  return Boolean(
    recording.id.trim() && recording.title.trim() &&
    recording.rightsNote.trim() &&
    /^\/audio\/backing-tracks\/[A-Za-z0-9_./-]+\.(mp3|m4a|wav|ogg)$/i.test(recording.src) &&
    !recording.src.includes('..') &&
    (recording.chartId === null || hasChartSync(recording))
  );
}
