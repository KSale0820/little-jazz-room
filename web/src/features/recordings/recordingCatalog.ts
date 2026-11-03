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
  chartId: string;
  src: string;
  style: string;
  key: string;
  difficulty: string;
  instruments: string[];
  blues: boolean;
  /** Original recording speed in quarter notes per minute, NOT an audio DSP knob. */
  recordedBpm: number;
  /** First beat of the linked chart measured from the beginning of the recording. */
  chartStartSeconds: number;
  /** A note establishing ownership/licensing to use the audio in this app. */
  rightsNote: string;
}

/** No generated, synthetic or unlicensed placeholder recording is shipped. */
export const RECORDED_BACKING_TRACKS: RecordedBackingTrack[] = [];

export function recordingById(id: string | null): RecordedBackingTrack | null {
  return RECORDED_BACKING_TRACKS.find(recording => recording.id === id) ?? null;
}

export function chartBeatForRecordingTime(
  seconds: number, recording: Pick<RecordedBackingTrack, 'recordedBpm' | 'chartStartSeconds'>,
  timeSignature: readonly [number, number],
): number {
  const quarterNotes = Math.max(0, seconds - recording.chartStartSeconds) * recording.recordedBpm / 60;
  return quarterNotes * timeSignature[1] / 4;
}

export function recordingTimeForChartBeat(
  chartBeat: number, recording: Pick<RecordedBackingTrack, 'recordedBpm' | 'chartStartSeconds'>,
  timeSignature: readonly [number, number],
): number {
  return recording.chartStartSeconds + Math.max(0, chartBeat) * 60 * 4 / (recording.recordedBpm * timeSignature[1]);
}

/** Reject invalid catalog entries before enabling their buttons in the Tracks UI. */
export function isUsableRecordedTrack(recording: RecordedBackingTrack): boolean {
  return Boolean(
    recording.id.trim() && recording.title.trim() && recording.chartId.trim() &&
    recording.rightsNote.trim() &&
    /^\/audio\/backing-tracks\/[A-Za-z0-9_./-]+\.(mp3|m4a|wav|ogg)$/i.test(recording.src) &&
    !recording.src.includes('..') &&
    Number.isFinite(recording.recordedBpm) && recording.recordedBpm > 0 &&
    Number.isFinite(recording.chartStartSeconds) && recording.chartStartSeconds >= 0
  );
}
