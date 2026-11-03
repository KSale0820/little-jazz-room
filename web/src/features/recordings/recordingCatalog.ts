/**
 * Owned/licensed stereo recordings supplied by the project owner.
 *
 * A recording may be a finished stereo MP3/M4A/WAV; stems are NOT required.
 * Leave the list empty until real playable, permission-cleared audio files exist.
 * Audio served from public/audio/backing-tracks/ has no Supabase dependency.
 */
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
  /** A note establishing ownership/licensing to use the audio in this app. */
  rightsNote: string;
}

/** The owner supplied this recording as an MP4; only the AAC audio is retained. */
export const RECORDED_BACKING_TRACKS: RecordedBackingTrack[] = [{
  id: 'autumn-leaves',
  title: 'Autumn Leaves',
  subtitle: 'Jazz backing track · audio only',
  chartId: null, // Do not substitute an unrelated seeded chart.
  src: '/audio/backing-tracks/autumn-leaves.m4a',
  style: 'Jazz',
  key: 'G minor',
  difficulty: 'All',
  instruments: ['All'],
  blues: false,
  recordedBpm: null, // Do not guess a BPM from the video.
  chartStartSeconds: null,
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
