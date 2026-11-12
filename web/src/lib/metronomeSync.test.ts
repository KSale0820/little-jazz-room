import { describe, expect, it } from 'vitest';
import { metronomeClickOptions, playbackClickTimes, secondsBetweenClicks } from './metronomeSync';
describe('playback-aligned metronome',()=>{
  it('limits clicks to exact divisors and subdivisions of the piece',()=>{
    expect(metronomeClickOptions(4)).toEqual([1,2,4,8,16]);
    expect(metronomeClickOptions(3)).toEqual([1,3,6,12]);
    expect(metronomeClickOptions(6)).toEqual([1,2,3,6,12,24]);
  });
  it('uses the actual notated meter with quarter-note BPM',()=>{
    expect(secondsBetweenClicks(120,[4,4],4)).toBeCloseTo(.5);
    expect(secondsBetweenClicks(120,[6,8],6)).toBeCloseTo(.25);
    expect(secondsBetweenClicks(120,[4,4],2)).toBeCloseTo(1);
  });
  it('anchors clicks to the song after seek and during intro',()=>{
    expect(playbackClickTimes(-.08,.5,-1)).toEqual([{tick:0,delay:.08}]);
    expect(playbackClickTimes(1.1,.5,-1)).toEqual([]);
    expect(playbackClickTimes(1.46,.5,-1)).toEqual([{tick:3,delay:.040000000000000036}]);
    expect(playbackClickTimes(1.46,.5,3)).toEqual([]);
  });
});
