import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAppearance } from '../context/AppearanceContext';
import { DecorativeCat } from '../features/cats/DecorativeCat';
import {
  audioContextConstructor, beatIntervalSeconds, beatsPerMeasure,
  clampBpm, defaultAccents,
} from './toolsAudio';
import './ToolsPages.css';
import './CleanPixelToolsProgress.css';
import './CleanPixelMotifPlacements.css';
import './ToolsPolishedPair.css';
import './ToolsMockupApproved.css';

type Signature = '2/4' | '3/4' | '4/4' | '6/8';
type ScheduledBeat = { time: number; index: number; countIn: boolean };

export function MetronomePage({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const { catId } = useApp();
  const { catMode } = useAppearance();
  const [showOptions, setShowOptions] = useState(false);
  const [showSignaturePicker, setShowSignaturePicker] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [signature, setSignature] = useState<Signature>('4/4');
  const [accents, setAccents] = useState<boolean[]>(defaultAccents('4/4'));
  const [countIn, setCountIn] = useState(true);
  const [countInBars, setCountInBars] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [countingIn, setCountingIn] = useState(false);
  const [error, setError] = useState('');
  const [taps, setTaps] = useState(0);

  const contextRef = useRef<AudioContext | null>(null);
  const bpmRef = useRef(120);
  const signatureRef = useRef<Signature>('4/4');
  const accentsRef = useRef<boolean[]>(defaultAccents('4/4'));
  const beatIndexRef = useRef(0);
  const nextTimeRef = useRef(0);
  const countInLeftRef = useRef(0);
  const playingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef(0);
  const scheduledRef = useRef<ScheduledBeat[]>([]);
  const oscillatorsRef = useRef(new Set<OscillatorNode>());
  const tapTimesRef = useRef<number[]>([]);

  const playClick = useCallback((context: AudioContext, at: number, accented: boolean, isCountIn: boolean) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(isCountIn ? 760 : accented ? 1420 : 970, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(isCountIn ? 0.09 : accented ? 0.18 : 0.11, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.044);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillatorsRef.current.add(oscillator);
    oscillator.onended = () => {
      oscillatorsRef.current.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + 0.05);
  }, []);

  // Scheduling uses the AudioContext clock, never setInterval for note onset.
  // The interval only looks ahead to enqueue sample-accurate Web Audio clicks.
  const scheduleBeats = useCallback(() => {
    const context = contextRef.current;
    if (!playingRef.current || !context || context.state !== 'running') return;
    if (nextTimeRef.current < context.currentTime - 0.08) {
      nextTimeRef.current = context.currentTime + 0.025;
    }
    let safeguard = 0;
    while (nextTimeRef.current < context.currentTime + 0.17 && safeguard++ < 12) {
      const index = beatIndexRef.current;
      const isCountIn = countInLeftRef.current > 0;
      const accented = accentsRef.current[index] ?? false;
      playClick(context, nextTimeRef.current, accented, isCountIn);
      scheduledRef.current.push({ time: nextTimeRef.current, index, countIn: isCountIn });
      if (isCountIn) countInLeftRef.current--;
      beatIndexRef.current = (index + 1) % beatsPerMeasure(signatureRef.current);
      nextTimeRef.current += beatIntervalSeconds(bpmRef.current, signatureRef.current);
    }
  }, [playClick]);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    cancelAnimationFrame(animationRef.current);
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    oscillatorsRef.current.clear();
    scheduledRef.current = [];
    setPlaying(false);
    setActiveBeat(-1);
    setCountingIn(false);
    const context = contextRef.current;
    if (context && context.state === 'running') void context.suspend().catch(() => undefined);
  }, []);

  const stopAndDispose = useCallback(() => {
    stop();
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close().catch(() => undefined);
  }, [stop]);

  useEffect(() => {
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      stopAndDispose();
    };
  }, [stop, stopAndDispose]);

  const start = async () => {
    const AudioCtor = audioContextConstructor();
    if (!AudioCtor) {
      setError('Your browser does not support Web Audio playback.');
      return;
    }
    setError('');
    try {
      const context = contextRef.current ?? new AudioCtor();
      contextRef.current = context;
      // Called by a click/tap: iOS Safari requires direct user activation.
      await context.resume();
      if (playingRef.current) return;
      playingRef.current = true;
      beatIndexRef.current = 0;
      countInLeftRef.current = countIn ? beatsPerMeasure(signatureRef.current) * countInBars : 0;
      nextTimeRef.current = context.currentTime + 0.055;
      scheduledRef.current = [];
      setActiveBeat(-1);
      setPlaying(true);
      setCountingIn(countIn);
      const updateVisualBeat = () => {
        if (!playingRef.current) return;
        const now = context.currentTime;
        let last: ScheduledBeat | undefined;
        while (scheduledRef.current.length && scheduledRef.current[0].time <= now + 0.006) {
          last = scheduledRef.current.shift();
        }
        if (last) {
          setActiveBeat(last.index);
          setCountingIn(last.countIn);
        }
        animationRef.current = requestAnimationFrame(updateVisualBeat);
      };
      scheduleBeats();
      intervalRef.current = setInterval(scheduleBeats, 25);
      animationRef.current = requestAnimationFrame(updateVisualBeat);
    } catch {
      stopAndDispose();
      setError('Could not start sound. Check your device audio settings and tap Play again.');
    }
  };

  const setTempo = (value: number) => {
    const next = clampBpm(value);
    bpmRef.current = next;
    setBpm(next);
  };

  const changeSignature = (next: Signature) => {
    // Reset on meter changes so no old-measure events survive.
    if (playingRef.current) stop();
    signatureRef.current = next;
    const nextAccents = defaultAccents(next);
    accentsRef.current = nextAccents;
    setAccents(nextAccents);
    setSignature(next);
    setActiveBeat(-1);
  };

  const toggleAccent = (index: number) => {
    const next = accentsRef.current.map((value, i) => i === index ? !value : value);
    accentsRef.current = next;
    setAccents(next);
  };

  const tapTempo = () => {
    const now = performance.now();
    const previous = tapTimesRef.current;
    const times = previous.length && now - previous[previous.length - 1] < 2200
      ? [...previous, now].slice(-6) : [now];
    tapTimesRef.current = times;
    setTaps(times.length);
    if (times.length >= 2) {
      const differences = times.slice(1).map((time, index) => time - times[index]);
      const mean = differences.reduce((sum, interval) => sum + interval, 0) / differences.length;
      setTempo(60000 / mean);
    }
  };

  const beatCount = beatsPerMeasure(signature);
  return (
    <section className="tool-page tool-metronome jazz-tool-page" aria-label="Metronome">
      <header className="tool-heading jazz-tool-header">
        <button className="tool-back" type="button" onClick={onClose ?? (() => navigate('/practice'))}
          aria-label={onClose ? 'Close tool and return to session' : 'Back to Practice'}>‹</button>
        <h1><img src="/visuals/tools/pixel/metronome.png" alt="" aria-hidden="true" /> Metronome</h1>
        <button className="tool-settings" type="button" aria-label="Metronome settings"
          aria-expanded={showOptions} onClick={() => setShowOptions(value => !value)}>?</button>
      </header>

      <div className="jazz-tool-settings" hidden={!showOptions}>
        <div className="jazz-tool-settings-heading">
          <strong>Metronome options</strong>
          <button type="button" aria-label="Close metronome options"
            onClick={() => setShowOptions(false)}>×</button>
        </div>
        <label className="jazz-tool-field-label" htmlFor="metronome-tempo-range">Tempo · {bpm} BPM</label>
        <input id="metronome-tempo-range" className="metronome-slider" type="range"
          min="40" max="240" step="1" value={bpm}
          onChange={event => setTempo(Number(event.target.value))}
          style={{ background: 'linear-gradient(to right, var(--color-action) ' + (bpm - 40) / 2 +
            '%, var(--color-surface-raised) ' + (bpm - 40) / 2 + '%)' }} />
        <div className="metronome-countin">
          <label><input type="checkbox" checked={countIn}
            onChange={event => setCountIn(event.target.checked)} />
            <span className="metronome-switch" aria-hidden="true" /> Count-in</label>
          <button type="button" className="metronome-count-select"
            onClick={() => setCountInBars(current => current === 1 ? 2 : 1)}
            aria-label="Toggle count-in between one and two measures" disabled={!countIn}>
            {beatCount * countInBars} beats <span aria-hidden="true">›</span>
          </button>
        </div>
        <p className="jazz-tool-options-note">Accent the beats below, and use Tap Tempo to find your pulse.</p>
      </div>

      <div className="jazz-metronome-card">
        <div className="jazz-metronome-value">
          <span aria-hidden="true" className="jazz-metronome-note">♪</span>
          <span aria-hidden="true" className="jazz-metronome-equals">=</span>
          <div className="metronome-bpm">
            <strong aria-live="off">{bpm}</strong>
            <span>BPM</span>
          </div>
        </div>

        <div className="metronome-tempo">
          <button type="button" className="metronome-step"
            onClick={() => setTempo(bpmRef.current - 1)} aria-label="Decrease tempo by 1 BPM">−</button>
          <button type="button" className="metronome-play" aria-pressed={playing}
            onClick={() => playing ? stop() : void start()}
            aria-label={playing ? 'Stop metronome' : 'Start metronome'}>
            <span aria-hidden="true">{playing ? '■' : '▶'}</span>
          </button>
          <button type="button" className="metronome-step"
            onClick={() => setTempo(bpmRef.current + 1)} aria-label="Increase tempo by 1 BPM">+</button>
        </div>

        <div className="metronome-tap-row">
          <button type="button" className="metronome-tap" onClick={tapTempo}><span aria-hidden="true">☞</span> Tap Tempo</button>
          <span className="jazz-tap-status">{taps >= 2 ? 'Tempo set from your taps' : ''}</span>
        </div>

        <div className="jazz-metronome-settings">
          <div className="jazz-metronome-setting-row">
            <h2 id="metronome-signature-heading">Time Signature</h2>
            <button type="button" className="jazz-signature-toggle"
              aria-controls="jazz-signature-picker" aria-expanded={showSignaturePicker}
              onClick={() => setShowSignaturePicker(value => !value)}>
              {signature} <span aria-hidden="true">⌄</span>
            </button>
          </div>
          <div id="jazz-signature-picker" className="metronome-signatures" hidden={!showSignaturePicker}
            role="group" aria-label="Time Signature">
            {(['2/4', '3/4', '4/4', '6/8'] as const).map(value => (
              <button type="button" key={value} aria-pressed={signature === value}
                onClick={() => { changeSignature(value); setShowSignaturePicker(false); }}>{value}</button>
            ))}
          </div>
          <div className="jazz-metronome-setting-row jazz-metronome-accent-row">
            <h2 id="metronome-accents-heading">Accent</h2>
            <div className="metronome-beats" role="group" aria-label="Choose accented beats">
              {accents.map((accent, index) => (
                <button type="button" key={index}
                  className={(accent ? 'is-accent ' : '') + (playing && activeBeat === index ? 'is-current' : '')}
                  aria-pressed={accent}
                  aria-label={'Beat ' + (index + 1) + (accent ? ', accented' : ', unaccented')}
                  onClick={() => toggleAccent(index)}>
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="metronome-playing-status" role="status">
          {playing ? countingIn ? 'Counting in…' : 'Playing · ' + signature :
            signature === '6/8' ? 'BPM counts dotted-quarter beats' : 'Ready when you are'}
        </p>
        {error ? <p className="tool-error" role="alert">{error}</p> : null}
      </div>

      <div className="jazz-tool-footer" aria-hidden="true">
        <img className="jazz-tool-plant" src="/visuals/tools/mockup/pothos.svg" alt="" />
        <div className="tool-cat-scene tool-metronome-scene">
          {catId === 'luna' ? (
            <img className="tool-scene-cat jazz-mock-cat" src="/visuals/tools/mockup/cat-sitting.svg"
              alt="" style={{ visibility: catMode ? 'visible' : 'hidden' }} />
          ) : <DecorativeCat catId={catId} variant="sitting" size={120} className="tool-scene-cat" />}
        </div>
        <span className="jazz-decor-note">♫</span>
      </div>
    </section>
  );
}
