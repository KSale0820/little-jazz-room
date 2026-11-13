import { describe, expect, it } from 'vitest';
import { metronomeClickOptions, metronomeClickSound, playbackClickTimes, secondsBetweenClicks } from './metronomeSync';
describe('playback-aligned metronome',()=>{
  it('plays the selected click 1 accent on beat index 0, including count-in', () => {
    const accents = [true, false, false, false];
    expect(metronomeClickSound(0, accents, false)).toEqual({
      accent: true, frequency: 1420, volume: .16,
    });
    expect(metronomeClickSound(1, accents, false)).toEqual({
      accent: false, frequency: 970, volume: .1,
    });
    expect(metronomeClickSound(0, accents, true)).toEqual({
      accent: true, frequency: 1420, volume: .16,
    });
    expect(metronomeClickSound(1, accents, true)).toEqual({
      accent: false, frequency: 760, volume: .085,
    });
  });
  it('moves accents only when a different visible click is selected', () => {
    expect(metronomeClickSound(0, [false, true, false, false], false).accent).toBe(false);
    expect(metronomeClickSound(1, [false, true, false, false], false).accent).toBe(true);
  });
  it('limits clicks to exact divisors and subdivisions of the piece',()=>{
    expect(metronomeClickOptions(4)).toEqual([1,2,4,8,16]);
    expect(metronomeClickOptions(3)).toEqual([1,3,6,12]);
    expect(metronomeClickOptions(6)).toEqual([1,2,3,6,12,24]);
    expect(metronomeClickOptions(1)).toEqual([1,2,4]);
    expect(metronomeClickOptions(5)).toEqual([1,5,10,20]);
    expect(metronomeClickOptions(7)).toEqual([1,7,14,28]);
  });
  it('falls back to a single click for invalid meter counts',()=>{
    expect(metronomeClickOptions(0)).toEqual([1]);
    expect(metronomeClickOptions(-3)).toEqual([1]);
    expect(metronomeClickOptions(3.5)).toEqual([1]);
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
