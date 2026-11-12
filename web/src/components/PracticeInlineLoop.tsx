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
      {picker('whole','Whole',wholeCount,onWhole,wholeSelected)}
      {options.map(option=>picker(option.id,option.label,counts[option.id]??1,v=>onCount(option.id,v),!wholeSelected))}
    </div>
  </section>;
}
