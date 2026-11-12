import { describe, expect, it } from 'vitest';
import type { Chart } from '../types/content';
import { getPlayerLoopOptions, sectionRepeatProgram, programPlays, PRACTICAL_INFINITY } from './practiceLoopProgram';
const chart: Chart = {
  id:'test', title:'Test chart',concert_key:'C',time_signature:[4,4],feel:'Swing',form:'A B',
  bars:[
    {number:1,section:'A',events:[]},
    {number:2,section:null,events:[]},
    {number:3,section:'B',events:[]},
    {number:4,section:null,events:[]},
  ],
};
describe('practice loop program', () => {
  it('creates real section ranges from the chart and custom sections', () => {
    expect(getPlayerLoopOptions(chart, [{id:'solo',label:'Solo',startBar:2,endBar:3}])).toEqual([
      {id:'chart:A',label:'A',startBar:1,endBar:2},
      {id:'chart:B',label:'B',startBar:3,endBar:4},
      {id:'solo',label:'Solo',startBar:2,endBar:3},
    ]);
  });
  it('defaults to 1x, skips 0x, repeats up to 10x, and runs infinity as a sustained program', () => {
    const options=getPlayerLoopOptions(chart,[]);
    expect(sectionRepeatProgram(options,{})).toEqual([
      {startBar:1,endBar:2,plays:1},{startBar:3,endBar:4,plays:1},
    ]);
    expect(sectionRepeatProgram(options,{'chart:A':0,'chart:B':10})).toEqual([{startBar:3,endBar:4,plays:10}]);
    expect(sectionRepeatProgram(options,{'chart:A':11})[0].plays).toBe(PRACTICAL_INFINITY);
    expect(programPlays(-9)).toBe(0);
  });
});
