import type { PlayerLoopOption } from '../lib/practiceLoopProgram';
import { repeatLabel, nextRepeatCount } from '../lib/practicePlayerNotes';
/** Small fixed-size chevrons avoid clipped font glyphs in compact steppers. */
export function ControlChevron({ up }: { up: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 16 12" width="12" height="8"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={up ? 'M3 9 8 4l5 5' : 'm3 3 5 5 5-5'} />
  </svg>;
}
export function PracticeInlineLoop({ options, counts, wholeCount, wholeSelected, onCount, onWhole, onAdd, onAdvanced, disabled = false }: {
  options: PlayerLoopOption[]; counts: Record<string,number>; wholeCount:number; wholeSelected:boolean;
  onCount:(id:string,value:number)=>void; onWhole:(value:number)=>void;
  onAdd:()=>void; onAdvanced:()=>void; disabled?: boolean;
}) {
  const picker=(id:string,label:string,value:number,handle:(v:number)=>void,selected=false)=>
    <div className={'practice-demo-loop-part'+(selected?' selected':'')} key={id}>
      <button type="button" className="practice-loop-option-name" disabled={disabled} onClick={()=>handle(value)}
        aria-label={'Select '+label+' loop range'}>{label}</button>
      <span className="practice-demo-count" role="group" aria-label={label+' repeats'}>
        <strong>{repeatLabel(value)}</strong>
        <span className="practice-loop-count-actions">
          <button type="button" aria-label={'Increase '+label+' repeats'} disabled={disabled} onClick={()=>handle(nextRepeatCount(value,1))}><ControlChevron up /></button>
          <button type="button" aria-label={'Decrease '+label+' repeats'} disabled={disabled} onClick={()=>handle(nextRepeatCount(value,-1))}><ControlChevron up={false} /></button>
        </span>
      </span>
    </div>;
  return <section className={'practice-demo-loop' + (disabled ? ' is-disabled' : '')} aria-label={disabled ? 'Loop unavailable without a recording' : 'Loop'}>
    <div className="practice-demo-loop-rail">
      <button className="practice-demo-loop-title" type="button" disabled={disabled} onClick={onAdvanced} title={disabled ? 'Loop unavailable without a recording' : 'Advanced loop editor'}>Loop</button>
      <button type="button" className="practice-demo-add-section" disabled={disabled} onClick={onAdd}>+ Section</button>
    </div>
    <div className="practice-demo-loop-items">
      {(() => {
        const items = [
          picker('whole','Whole',wholeCount,onWhole,wholeSelected),
          ...options.map(option=>picker(option.id,option.label,counts[option.id]??1,v=>onCount(option.id,v),!wholeSelected)),
        ];
        // Column-first DOM order yields a readable two-row, left-to-right layout.
        // Additional custom sections scroll horizontally without creating a third row.
        const columns = Math.max(4, Math.ceil(items.length / 2));
        return Array.from({ length: columns }, (_, index) => [items[index],items[index+columns]])
          .flat().filter(item => item !== undefined);
      })()}
    </div>
  </section>;
}
