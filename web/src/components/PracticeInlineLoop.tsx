import type { PlayerLoopOption } from '../lib/practiceLoopProgram';
import { repeatLabel, nextRepeatCount } from '../lib/practicePlayerNotes';
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
          <button type="button" aria-label={'Increase '+label+' repeats'} disabled={disabled} onClick={()=>handle(nextRepeatCount(value,1))}>⌃</button>
          <button type="button" aria-label={'Decrease '+label+' repeats'} disabled={disabled} onClick={()=>handle(nextRepeatCount(value,-1))}>⌄</button>
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
