import { describe, expect, it } from 'vitest';
import {
  RECORDED_BACKING_TRACKS, chartBeatForRecordingTime, isUsableRecordedTrack,
  recordingById, recordingTimeForChartBeat,
} from './recordingCatalog';
import type { SyncedRecording } from './recordingCatalog';

const recording: SyncedRecording = {
  id: 'test-recording', title: 'Test Recording', subtitle: 'Original study',
  chartId: 'blues-f-12', src: '/audio/backing-tracks/study.mp3',
  style: 'Swing', key: 'F', difficulty: 'Beginner',
  instruments: ['Piano'], blues: true,
  recordedBpm: 120, chartStartSeconds: 2, rightsNote: 'Recorded and owned by test author',
};

describe('recorded backing-track catalog', () => {
  it('never invents an audio recording when the catalog is empty', () => {
    expect(RECORDED_BACKING_TRACKS).toHaveLength(1);
    expect(recordingById('after-hours')).toBeNull();
    expect(recordingById('autumn-leaves')?.chartId).toBeNull();
    expect(recordingById('autumn-leaves')?.src).toBe('/audio/backing-tracks/autumn-leaves.m4a');
  });

  it('accepts an owned static recording and rejects unsafe or unlicensed entries', () => {
    expect(isUsableRecordedTrack(recording)).toBe(true);
    expect(isUsableRecordedTrack({ ...recording, rightsNote: '' })).toBe(false);
    expect(isUsableRecordedTrack({ ...recording, src: '/audio/backing-tracks/../private.mp3' })).toBe(false);
    expect(isUsableRecordedTrack({ ...recording, src: 'https://example.com/study.mp3' })).toBe(false);
    expect(isUsableRecordedTrack({ ...recording, recordedBpm: 0 })).toBe(false);
    expect(isUsableRecordedTrack(RECORDED_BACKING_TRACKS[0]!)).toBe(true);
    expect(isUsableRecordedTrack({ ...recording, chartId: null, recordedBpm: null, chartStartSeconds: null })).toBe(true);
  });

  it('aligns the first chart beat after an audio count-in', () => {
    expect(chartBeatForRecordingTime(0, recording, [4, 4])).toBe(0);
    expect(chartBeatForRecordingTime(2, recording, [4, 4])).toBe(0);
    expect(chartBeatForRecordingTime(3, recording, [4, 4])).toBe(2);
    expect(recordingTimeForChartBeat(2, recording, [4, 4])).toBe(3);
  });

  it('uses denominator-note beats for 6/8 but quarter-note recorded BPM', () => {
    expect(chartBeatForRecordingTime(3, recording, [6, 8])).toBe(4);
    expect(recordingTimeForChartBeat(4, recording, [6, 8])).toBe(3);
    expect(chartBeatForRecordingTime(3, recording, [3, 4])).toBe(2);
  });
});
