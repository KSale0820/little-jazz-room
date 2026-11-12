import { useEffect, useRef } from 'react';
import type { MetronomeSignature, PracticeMetronomeController } from '../lib/usePracticeMetronome';
import './PracticeMetronomeSheet.css';
export function PracticeMetronomeSheet({ controller, onClose }: { controller: PracticeMetronomeController; onClose: () => void }) {
  const dialog=useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous=document.activeElement as HTMLElement|null;
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    return () => previous?.focus?.();
  },[]);
  const trap=(event:React.KeyboardEvent)=>{
    if(event.key==='Escape') {event.preventDefault();onClose();return;}
    if(event.key!=='Tab')return;
    const controls=[...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')??[])];
    if(!controls.length)return;
    if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls[controls.length-1].focus();}
    else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){event.preventDefault();controls[0].focus();}
  };
  return <div className="practice-metronome-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section ref={dialog} className="practice-metronome-sheet" role="dialog" aria-modal="true" aria-label="Metronome settings" onKeyDown={trap}>
      <header><h2>Metronome</h2><button type="button" aria-label="Close Metronome settings" onClick={onClose}>×</button></header>
      <div className="practice-metronome-status">
        <button type="button" className={controller.playing?'on':''} aria-pressed={controller.playing} onClick={controller.toggle}>
          {controller.playing?'On':'Off'} <span aria-hidden="true" />
        </button>
        <p>{controller.playing?'Metronome continues while viewing the chart.':'Start here or use the player quick toggle.'}</p>
      </div>
      <div className="practice-metronome-tempo">
        <span>Tempo</span>
        <div><button type="button" aria-label="Decrease metronome BPM" onClick={()=>controller.changeBpm(controller.bpm-1)}>−</button>
          <strong>{controller.bpm} <small>BPM</small></strong>
          <button type="button" aria-label="Increase metronome BPM" onClick={()=>controller.changeBpm(controller.bpm+1)}>+</button></div>
        <input type="range" min={40} max={240} value={controller.bpm} aria-label="Metronome BPM"
          onChange={e=>controller.changeBpm(Number(e.target.value))}/>
        <button type="button" className="practice-metronome-tap" onClick={controller.tapTempo}>Tap Tempo</button>
      </div>
      <div className="practice-metronome-field"><h3>Time Signature</h3>
        <div className="practice-metronome-pills">{(['2/4','3/4','4/4','6/8'] as MetronomeSignature[]).map(value=>
          <button key={value} type="button" aria-pressed={controller.signature===value}
            onClick={()=>controller.changeSignature(value)}>{value}</button>)}</div>
      </div>
      <div className="practice-metronome-field"><h3>Accent Beats</h3>
        <div className="practice-metronome-pills">{controller.accents.map((active,index)=>
          <button key={index} type="button" aria-pressed={active}
            className={controller.playing&&controller.activeBeat===index?'active-beat':''}
            aria-label={'Beat '+(index+1)+(active?', accented':'')} onClick={()=>controller.toggleAccent(index)}>
            {index+1} {active?'◆':'○'}</button>)}</div>
      </div>
      <div className="practice-metronome-count"><label><input type="checkbox" checked={controller.countIn}
        onChange={e=>controller.setCountIn(e.target.checked)}/> Count-in</label>
        <button type="button" disabled={!controller.countIn} onClick={()=>controller.setCountInBars(n=>n===1?2:1)}>
          {controller.countInBars} bar{controller.countInBars===1?'':'s'}</button></div>
      {controller.error&&<p role="alert" className="practice-metronome-error">{controller.error}</p>}
      <button type="button" className="practice-metronome-done" onClick={onClose}>Done</button>
    </section>
  </div>;
}
