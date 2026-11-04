import { describe, expect, it } from 'vitest';
import {
  RECORDED_BACKING_TRACKS, chartBeatForRecordingTime, isUsableRecordedTrack,
  recordingById, recordingTimeForChartBeat, hasChartSync, recordingBarSequence,
  chartBeatAtRecordingTime, recordingTimeForSelectedBar, recordingTimeForAdjacentBar,
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
    expect(recordingById('autumn-leaves')?.chartId).toBe('autumn-leaves-gm-video-35');
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
  it('transcribes the precise 5x form and final tag from the original video', () => {
    const autumn = recordingById('autumn-leaves');
    expect(autumn && hasChartSync(autumn)).toBe(true);
    if (!autumn || !hasChartSync(autumn)) throw Error('Expected linked Autumn Leaves');
    expect(autumn.recordedBpm).toBe(170);
    expect(autumn.chartStartSeconds).toBe(5.75);
    const order = recordingBarSequence(autumn, 35);
    expect(order).toHaveLength(161);
    expect(order.slice(0, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(order.slice(30, 34)).toEqual([30, 31, 0, 1]);
    expect(order.slice(126, 130)).toEqual([30, 31, 0, 1]);
    expect(order.slice(-5)).toEqual([28, 29, 32, 33, 34]);
    const bar = 240 / 170;
    expect(chartBeatAtRecordingTime(autumn.chartStartSeconds + 32 * bar, autumn, [4,4], 35)).toBeCloseTo(0, 6);
    expect(chartBeatAtRecordingTime(autumn.chartStartSeconds + 158 * bar, autumn, [4,4], 35)).toBeCloseTo(128, 6);
    expect(recordingTimeForSelectedBar(0, 51.4, autumn, [4,4], 35)).toBeCloseTo(autumn.chartStartSeconds + 32 * bar, 3);
    expect(recordingTimeForAdjacentBar(1, autumn.chartStartSeconds + 157 * bar, autumn, [4,4], 35))
      .toBeCloseTo(autumn.chartStartSeconds + 158 * bar, 3);
    expect(chartBeatAtRecordingTime(245, autumn, [4,4], 35)).toBeLessThan(35 * 4);
  });
});
