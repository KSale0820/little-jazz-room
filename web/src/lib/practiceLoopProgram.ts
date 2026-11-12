import type { Chart } from '../types/content';
import type { LoopSection } from './practiceChartClock';

export interface CustomPracticeSection { id: string; label: string; startBar: number; endBar: number }
export interface PlayerLoopOption { id: string; label: string; startBar: number; endBar: number }

/** Keep chart section ordering, using the next section's first bar as the previous section's end. */
export function getPlayerLoopOptions(chart: Chart, custom: CustomPracticeSection[]): PlayerLoopOption[] {
  const starts: { label: string; startBar: number }[] = [];
  chart.bars.forEach((bar,index) => {
    if (bar.section && !starts.some(item => item.label === bar.section)) starts.push({ label: bar.section, startBar: index+1 });
  });
  const presets = starts.map((item,index) => ({
    id:'chart:'+item.label, label:item.label, startBar:item.startBar,
    endBar:index+1<starts.length ? starts[index+1].startBar-1 : chart.bars.length,
  }));
  return [...presets, ...custom.map(item => ({ ...item }))];
}

/** 11 means infinity in UI; an extremely long practical repeat for chart/audio schedulers.
 * This avoids non-JSON numbers while keeping seeking precise and user-adjustable.
 */
export const PRACTICAL_INFINITY = 1_000_000;
export function programPlays(count:number) { return count >= 11 ? PRACTICAL_INFINITY : Math.max(0,Math.min(10,count)); }
export function sectionRepeatProgram(options:PlayerLoopOption[], counts:Record<string,number>):LoopSection[] {
  return options.flatMap(option => {
    const plays=programPlays(counts[option.id]??1);
    return plays>0 ? [{ startBar:option.startBar,endBar:option.endBar,plays }] : [];
  });
}
