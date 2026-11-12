import type { PlayerLoopOption } from '../lib/practiceLoopProgram';
import { repeatLabel } from '../lib/practicePlayerNotes';
export function PracticeInlineLoop({ options, counts, wholeCount, wholeSelected, onCount, onWhole, onAdd, onAdvanced }: {
  options: PlayerLoopOption[]; counts: Record<string,number>; wholeCount:number; wholeSelected:boolean;
  onCount:(id:string,value:number)=>void; onWhole:(value:number)=>void;
  onAdd:()=>void; onAdvanced:()=>void;
}) {
  const picker=(id:string,label:string,value:number,handle:(v:number)=>void,selected=false)=>
    <div className={'practice-demo-loop-part'+(selected?' selected':'')} key={id}>
      <button type="button" className="practice-loop-option-name" onClick={()=>handle(value)}
        aria-label={'Select '+label+' loop range'}>{label}</button>
      <span className="practice-demo-count" role="group" aria-label={label+' repeats'}>
        <strong>{repeatLabel(value)}</strong>
        <span className="practice-loop-count-actions">
          <button type="button" aria-label={'Increase '+label+' repeats'} onClick={()=>handle(value >= 11 ? 11 : value+1)}>⌃</button>
          <button type="button" aria-label={'Decrease '+label+' repeats'} onClick={()=>handle(value>=11?10:Math.max(0,value-1))}>⌄</button>
        </span>
      </span>
    </div>;
  return <section className="practice-demo-loop" aria-label="Loop">
    <button className="practice-demo-loop-title" type="button" onClick={onAdvanced} title="Advanced loop editor">Loop</button>
    <div className="practice-demo-loop-items">
      {picker('whole','Whole',wholeCount,onWhole,wholeSelected)}
      {options.map(option=>picker(option.id,option.label,counts[option.id]??1,v=>onCount(option.id,v),!wholeSelected))}
      <button type="button" className="practice-demo-add-section" onClick={onAdd}>+ Section</button>
    </div>
  </section>;
}
