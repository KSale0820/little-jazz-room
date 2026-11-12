import { useCallback, useEffect, useRef, useState } from 'react';
import { audioContextConstructor, beatIntervalSeconds, beatsPerMeasure, clampBpm, defaultAccents } from '../pages/toolsAudio';
export type MetronomeSignature = '2/4' | '3/4' | '4/4' | '6/8';
/** Player-owned audio clock: closing the settings sheet does not unmount the scheduler. */
export function usePracticeMetronome() {
  const [playing,setPlaying] = useState(false);
  const [bpm,setBpmState] = useState(100);
  const [signature,setSignatureState] = useState<MetronomeSignature>('4/4');
  const [accents,setAccents] = useState(defaultAccents('4/4'));
  const [countIn,setCountIn] = useState(false);
  const [countInBars,setCountInBars] = useState(1);
  const [error,setError] = useState('');
  const [activeBeat,setActiveBeat] = useState(-1);
  const context = useRef<AudioContext | null>(null);
  const ticking = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nodes = useRef(new Set<OscillatorNode>());
  const next = useRef(0);
  const beat = useRef(0);
  const countLeft = useRef(0);
  const bpmRef = useRef(100);
  const signatureRef = useRef<MetronomeSignature>('4/4');
  const accentsRef = useRef(defaultAccents('4/4'));
  const taps = useRef<number[]>([]);

  const stop = useCallback(() => {
    ticking.current = false;
    if(timer.current) clearInterval(timer.current);
    timer.current = null;
    for(const osc of nodes.current) { try{osc.stop();}catch{/* ended */} }
    nodes.current.clear();
    if(context.current?.state === 'running') void context.current.suspend().catch(() => undefined);
    setPlaying(false); setActiveBeat(-1);
  },[]);
  const schedule = useCallback(() => {
    const ctx = context.current;
    if(!ticking.current || !ctx || ctx.state !== 'running') return;
    if(next.current < ctx.currentTime - .08) next.current = ctx.currentTime + .025;
    let guard = 0;
    while(next.current < ctx.currentTime + .15 && guard++ < 12) {
      const index = beat.current;
      const time = next.current;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      const counting = countLeft.current > 0;
      const accented = accentsRef.current[index] ?? false;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(counting ? 760 : accented ? 1420 : 970,time);
      gain.gain.setValueAtTime(.0001,time);
      gain.gain.exponentialRampToValueAtTime(counting ? .08 : accented ? .15 : .1,time+.002);
      gain.gain.exponentialRampToValueAtTime(.0001,time+.044);
      osc.connect(gain); gain.connect(ctx.destination);
      nodes.current.add(osc);
      osc.onended = () => { nodes.current.delete(osc); osc.disconnect(); gain.disconnect(); };
      osc.start(time); osc.stop(time+.05);
      if(counting) countLeft.current--;
      beat.current = (index+1) % beatsPerMeasure(signatureRef.current);
      next.current += beatIntervalSeconds(bpmRef.current,signatureRef.current);
      setActiveBeat(index);
    }
  },[]);
  const start = useCallback(async () => {
    const Ctor = audioContextConstructor();
    if(!Ctor) { setError('Web Audio is unavailable on this device.'); return; }
    try {
      const ctx = context.current ?? new Ctor();
      context.current = ctx;
      await ctx.resume();
      if(ticking.current) return;
      beat.current = 0;
      countLeft.current = countIn ? beatsPerMeasure(signatureRef.current)*countInBars : 0;
      next.current = ctx.currentTime + .04;
      ticking.current = true;
      setError(''); setPlaying(true);
      schedule();
      timer.current = setInterval(schedule,25);
    } catch { stop(); setError('Unable to start metronome audio. Check device permissions.'); }
  },[countIn,countInBars,schedule,stop]);
  const toggle = useCallback(() => { if(ticking.current) stop(); else void start(); },[start,stop]);
  const changeBpm = useCallback((value: number) => {
    const v=clampBpm(value); bpmRef.current=v; setBpmState(v);
  },[]);
  const changeSignature = useCallback((value: MetronomeSignature) => {
    if(ticking.current) stop();
    signatureRef.current=value; setSignatureState(value);
    const a=defaultAccents(value); accentsRef.current=a; setAccents(a);
  },[stop]);
  const toggleAccent = useCallback((index:number) => {
    const a=accentsRef.current.map((x,i)=>i===index?!x:x);
    accentsRef.current=a; setAccents(a);
  },[]);
  const tapTempo = useCallback(() => {
    const now=performance.now(), previous=taps.current;
    const array=previous.length && now-previous[previous.length-1] < 2200
      ? [...previous,now].slice(-6) : [now];
    taps.current=array;
    if(array.length>=2) {
      const diffs=array.slice(1).map((v,i)=>v-array[i]);
      changeBpm(60000/(diffs.reduce((s,v)=>s+v,0)/diffs.length));
    }
  },[changeBpm]);
  useEffect(() => {
    const hidden=() => { if(document.hidden) stop(); };
    document.addEventListener('visibilitychange',hidden);
    return () => {
      document.removeEventListener('visibilitychange',hidden);
      stop();
      const ctx=context.current;
      context.current=null;
      if(ctx) void ctx.close().catch(() => undefined);
    };
  },[stop]);
  return { playing, bpm, signature, accents, countIn, countInBars, error, activeBeat,
    start, stop, toggle, changeBpm, changeSignature, toggleAccent, setCountIn, setCountInBars, tapTempo };
}
export type PracticeMetronomeController=ReturnType<typeof usePracticeMetronome>;
