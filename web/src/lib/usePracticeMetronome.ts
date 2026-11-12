import { useCallback, useEffect, useRef, useState } from 'react';
import { audioContextConstructor, clampBpm } from '../pages/toolsAudio';
import { metronomeClickOptions, metronomeClickSound, playbackClickTimes, secondsBetweenClicks } from './metronomeSync';
import type { PlaybackClockSample } from './metronomeSync';

export type MetronomeMeter = [number, number];
function firstAccent(count: number) { return Array.from({ length: count }, (_, i) => i === 0); }
const idleSource = (): PlaybackClockSample => ({ playing: false, positionSeconds: 0 });

/** One Web Audio scheduler survives closing the player modal. When the player is
 * running, HTMLMediaElement.currentTime or the chart-following clock owns phase.
 * User-selected click counts divide the source measure evenly. */
export function usePracticeMetronome() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [meter, setMeter] = useState<MetronomeMeter>([4, 4]);
  const [clicksPerBar, setClicksPerBar] = useState(4);
  const [accents, setAccents] = useState(firstAccent(4));
  const [countIn, setCountIn] = useState(false);
  const [countInBars, setCountInBars] = useState(1);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');
  const [activeBeat, setActiveBeat] = useState(-1);

  const context = useRef<AudioContext | null>(null);
  const ticking = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nodes = useRef(new Set<OscillatorNode>());
  const visualQueue = useRef<{ time: number; index: number }[]>([]);
  const next = useRef(0);
  const beat = useRef(0);
  const countLeft = useRef(0);
  const bpmRef = useRef(100);
  const meterRef = useRef<MetronomeMeter>([4, 4]);
  const clicksRef = useRef(4);
  const accentsRef = useRef(firstAccent(4));
  const taps = useRef<number[]>([]);
  const playbackSource = useRef<() => PlaybackClockSample>(idleSource);
  const wasSynced = useRef(false);
  const previousPosition = useRef<number | null>(null);
  const latestScheduledTick = useRef(-1);

  const connectPlayback = useCallback((getSnapshot: () => PlaybackClockSample) => {
    playbackSource.current = getSnapshot;
  }, []);

  const stop = useCallback(() => {
    ticking.current = false;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    for (const osc of nodes.current) { try { osc.stop(); } catch { /* already ended */ } }
    nodes.current.clear();
    visualQueue.current = [];
    if (context.current?.state === 'running') void context.current.suspend().catch(() => undefined);
    wasSynced.current = false;
    previousPosition.current = null;
    latestScheduledTick.current = -1;
    setPlaying(false);
    setSynced(false);
    setActiveBeat(-1);
  }, []);

  const playClick = useCallback((ctx: AudioContext, at: number, index: number, counting: boolean) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    // UI Click 1 is audio index 0. Count-in uses the same accent mapping
    // instead of masking it with the old identical count-in tone.
    const sound = metronomeClickSound(index, accentsRef.current, counting);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(sound.frequency, at);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(sound.volume, at + .002);
    gain.gain.exponentialRampToValueAtTime(.0001, at + .044);
    osc.connect(gain);
    gain.connect(ctx.destination);
    nodes.current.add(osc);
    osc.onended = () => { nodes.current.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(at);
    osc.stop(at + .05);
    // The audible onset is scheduled ahead on the Web Audio clock. Advance the
    // highlighted accent only after that onset, never at enqueue time.
    visualQueue.current.push({ time: at, index });
  }, []);

  const flushVisualBeat = useCallback((ctx: AudioContext) => {
    // ctx.currentTime is the RENDER clock, ahead of audio reaching a phone's
    // speaker/Bluetooth device. Use the OUTPUT timestamp for the gold beat
    // highlight, otherwise beat 2 can light while beat 1 is still audible.
    const output = ctx.getOutputTimestamp?.();
    const outputTime = output && Number.isFinite(output.contextTime) && output.contextTime > 0
      ? Math.min(ctx.currentTime, output.contextTime)
      : Math.max(0, ctx.currentTime -
          Math.max(0, (ctx.baseLatency || .04) + (ctx.outputLatency || 0)));
    let current: number | null = null;
    while (visualQueue.current.length && visualQueue.current[0].time <= outputTime + .004) {
      current = visualQueue.current.shift()!.index;
    }
    if (current !== null) setActiveBeat(current);
  }, []);

  const schedule = useCallback(() => {
    const ctx = context.current;
    if (!ticking.current || !ctx || ctx.state !== 'running') return;

    const source = playbackSource.current();
    const clickCount = clicksRef.current;
    const sourceBpm = source.playing && source.tempoBpm && source.tempoBpm > 0
      ? source.tempoBpm : bpmRef.current;
    if (source.playing && sourceBpm !== bpmRef.current) {
      bpmRef.current = sourceBpm;
      setBpm(Math.round(sourceBpm));
    }
    const seconds = secondsBetweenClicks(sourceBpm, meterRef.current, clickCount);
    if (!Number.isFinite(seconds)) return;

    if (source.playing) {
      if (!wasSynced.current || previousPosition.current === null ||
        source.positionSeconds < previousPosition.current - .12 ||
        source.positionSeconds > previousPosition.current + .75) {
        latestScheduledTick.current = -1;
        visualQueue.current = [];
      }
      previousPosition.current = source.positionSeconds;
      if (!wasSynced.current) setSynced(true);
      wasSynced.current = true;
      const upcoming = playbackClickTimes(source.positionSeconds, seconds, latestScheduledTick.current);
      upcoming.forEach(({ tick, delay }) => {
        playClick(ctx, ctx.currentTime + delay, tick % clickCount, false);
        latestScheduledTick.current = tick;
      });
      flushVisualBeat(ctx);
      return;
    }

    if (wasSynced.current) {
      // Playback paused or stopped: preserve the musician's independent metronome
      // while returning to a fresh, unsynchronized count without burst clicks.
      next.current = ctx.currentTime + .04;
      visualQueue.current = [];
      beat.current = 0;
      latestScheduledTick.current = -1;
      previousPosition.current = null;
      setSynced(false);
      wasSynced.current = false;
    }
    if (next.current < ctx.currentTime - .08) next.current = ctx.currentTime + .025;
    let guard = 0;
    while (next.current < ctx.currentTime + .15 && guard++ < 12) {
      const counting = countLeft.current > 0;
      playClick(ctx, next.current, beat.current, counting);
      if (counting) countLeft.current--;
      beat.current = (beat.current + 1) % clickCount;
      next.current += seconds;
    }
    flushVisualBeat(ctx);
  }, [flushVisualBeat, playClick]);

  const start = useCallback(async () => {
    const AudioCtor = audioContextConstructor();
    if (!AudioCtor) { setError('Web Audio is unavailable on this device.'); return; }
    try {
      const ctx = context.current ?? new AudioCtor();
      context.current = ctx;
      await ctx.resume(); // must follow an explicit tap for Safari/Web Audio
      if (ticking.current) return;
      beat.current = 0;
      wasSynced.current = false;
      previousPosition.current = null;
      latestScheduledTick.current = -1;
      visualQueue.current = [];
      setActiveBeat(-1);
      // Do not play a count-in over the already-running backing track.
      countLeft.current = playbackSource.current().playing ? 0 : countIn ? clicksRef.current * countInBars : 0;
      // Leave enough lead-in for the first beat to reach mobile audio hardware.
      next.current = ctx.currentTime + .095;
      ticking.current = true;
      setError('');
      setPlaying(true);
      schedule();
      timer.current = setInterval(schedule, 25);
    } catch {
      stop();
      setError('Unable to start the metronome. Check device audio and try again.');
    }
  }, [countIn, countInBars, schedule, stop]);
  const toggle = useCallback(() => { if (ticking.current) stop(); else void start(); }, [start, stop]);
  const changeBpm = useCallback((value: number) => {
    const nextBpm = clampBpm(value);
    bpmRef.current = nextBpm;
    setBpm(nextBpm);
  }, []);
  const setPieceMeter = useCallback((value: MetronomeMeter) => {
    const [numerator, denominator] = value;
    if (!Number.isInteger(numerator) || numerator < 1 || numerator > 16 ||
      ![2, 4, 8, 16].includes(denominator)) return;
    if (meterRef.current[0] === numerator && meterRef.current[1] === denominator) return;
    meterRef.current = [numerator, denominator];
    setMeter([numerator, denominator]);
    const nextClicks = numerator;
    clicksRef.current = nextClicks;
    setClicksPerBar(nextClicks);
    const nextAccents = firstAccent(nextClicks);
    accentsRef.current = nextAccents;
    setAccents(nextAccents);
    beat.current = 0;
    latestScheduledTick.current = -1;
    next.current = (context.current?.currentTime ?? 0) + .04;
  }, []);
  const changeClicksPerBar = useCallback((value: number) => {
    if (!metronomeClickOptions(meterRef.current[0]).includes(value)) return;
    clicksRef.current = value;
    setClicksPerBar(value);
    const nextAccents = firstAccent(value);
    accentsRef.current = nextAccents;
    setAccents(nextAccents);
    beat.current = 0;
    latestScheduledTick.current = -1;
    next.current = (context.current?.currentTime ?? 0) + .04;
  }, []);
  const toggleAccent = useCallback((index: number) => {
    const updated = accentsRef.current.map((value, i) => i === index ? !value : value);
    accentsRef.current = updated;
    setAccents(updated);
  }, []);
  const tapTempo = useCallback(() => {
    const now = performance.now(), previous = taps.current;
    const times = previous.length && now - previous[previous.length - 1] < 2200
      ? [...previous, now].slice(-6) : [now];
    taps.current = times;
    if (times.length >= 2) {
      const differences = times.slice(1).map((time, i) => time - times[i]);
      changeBpm(60000 / (differences.reduce((sum, interval) => sum + interval, 0) / differences.length));
    }
  }, [changeBpm]);

  useEffect(() => {
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      stop();
      const ctx = context.current;
      context.current = null;
      if (ctx) void ctx.close().catch(() => undefined);
    };
  }, [stop]);

  return { playing, synced, bpm, meter, clicksPerBar, accents, countIn, countInBars, error, activeBeat,
    start, stop, toggle, changeBpm, setPieceMeter, changeClicksPerBar, toggleAccent,
    setCountIn, setCountInBars, tapTempo, connectPlayback };
}
export type PracticeMetronomeController = ReturnType<typeof usePracticeMetronome>;
