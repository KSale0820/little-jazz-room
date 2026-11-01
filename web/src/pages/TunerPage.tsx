import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import {
  audioContextConstructor, detectPitch, readingFromFrequency,
  type PitchReading, type TuningMode,
} from './toolsAudio';
import './ToolsPages.css';

type MicStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error';

export function TunerPage() {
  const navigate = useNavigate();
  const { catId } = useApp();
  const [roomArtLoaded, setRoomArtLoaded] = useState(false);
  const [mode, setMode] = useState<TuningMode>('chromatic');
  const [status, setStatus] = useState<MicStatus>('idle');
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [message, setMessage] = useState('');
  const [referencePlaying, setReferencePlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const modeRef = useRef(mode);
  const requestRef = useRef(0);
  const microphoneRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef(0);
  const toneRef = useRef<{ context: AudioContext; oscillator: OscillatorNode } | null>(null);

  useEffect(() => { modeRef.current = mode; setReading(null); }, [mode]);

  const stopMicrophone = useCallback(() => {
    requestRef.current++;
    cancelAnimationFrame(rafRef.current);
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    microphoneRef.current?.getTracks().forEach(track => track.stop());
    microphoneRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close().catch(() => undefined);
  }, []);

  const stopReference = useCallback(() => {
    const tone = toneRef.current;
    toneRef.current = null;
    if (tone) {
      try { tone.oscillator.stop(); } catch { /* oscillator has already ended */ }
      void tone.context.close().catch(() => undefined);
    }
    setReferencePlaying(false);
  }, []);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) {
        stopMicrophone();
        stopReference();
        setReading(null);
        setStatus(current => current === 'listening' || current === 'requesting' ? 'idle' : current);
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      stopMicrophone();
      stopReference();
    };
  }, [stopMicrophone, stopReference]);

  const startMicrophone = async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !audioContextConstructor()) {
      setStatus('unsupported');
      setMessage('Microphone tuning requires HTTPS and a browser with microphone and Web Audio support.');
      return;
    }
    stopMicrophone();
    setReading(null);
    setStatus('requesting');
    setMessage('');
    const request = requestRef.current;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      const AudioCtor = audioContextConstructor();
      if (!AudioCtor) throw new Error('Web Audio is unavailable.');
      context = new AudioCtor();
      // Resume during the user gesture, which is important for iOS Safari.
      await context.resume();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      if (request !== requestRef.current) {
        stream.getTracks().forEach(track => track.stop());
        void context.close().catch(() => undefined);
        return;
      }
      microphoneRef.current = stream;
      contextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      const samples = new Float32Array(analyser.fftSize);
      let lastAnalysis = 0;
      const analyse = (now: number) => {
        if (request !== requestRef.current) return;
        if (now - lastAnalysis >= 105) {
          lastAnalysis = now;
          analyser.getFloatTimeDomainData(samples);
          const frequency = detectPitch(samples, context!.sampleRate);
          setReading(frequency === null ? null : readingFromFrequency(frequency, modeRef.current));
        }
        rafRef.current = requestAnimationFrame(analyse);
      };
      setStatus('listening');
      rafRef.current = requestAnimationFrame(analyse);
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (request === requestRef.current) {
          stopMicrophone();
          setReading(null);
          setStatus('error');
          setMessage('The microphone disconnected. Tap to try again.');
        }
      }, { once: true });
    } catch (error) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (context) void context.close().catch(() => undefined);
      if (request !== requestRef.current) return;
      const name = error instanceof DOMException ? error.name : '';
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError'
        ? 'denied' : name === 'NotSupportedError' ? 'unsupported' : 'error');
      setMessage(name === 'NotAllowedError' || name === 'PermissionDeniedError'
        ? 'Microphone access was denied. Allow access in your browser settings, then try again.'
        : name === 'NotFoundError'
          ? 'No microphone was found on this device.'
          : 'Could not start microphone audio. Check device permissions and try again.');
    }
  };

  const toggleMicrophone = () => {
    if (status === 'listening' || status === 'requesting') {
      stopMicrophone();
      setReading(null);
      setStatus('idle');
    } else {
      void startMicrophone();
    }
  };

  const toggleReference = async () => {
    if (toneRef.current) { stopReference(); return; }
    const AudioCtor = audioContextConstructor();
    if (!AudioCtor) {
      setMessage('Reference tone is not supported by this browser.');
      return;
    }
    let context: AudioContext | null = null;
    try {
      context = new AudioCtor();
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gain.gain.value = 0.075;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      toneRef.current = { context, oscillator };
      setReferencePlaying(true);
    } catch {
      if (context) void context.close().catch(() => undefined);
      setMessage('Could not play the reference tone. Check your audio settings.');
    }
  };

  const isTuned = reading !== null && Math.abs(reading.cents) <= 5;
  const isNearString = reading && (mode === 'chromatic' || reading.isOpenString);
  const needleAngle = reading && isNearString
    ? Math.max(-70, Math.min(70, reading.cents * 1.4)) : null;
  const getTuningMessage = () => {
    if (status !== 'listening') return status === 'requesting' ? 'Waiting for permission…' : 'Ready to tune';
    if (!reading) return 'Listening for a note…';
    if (!isNearString) return 'Play an open string';
    if (isTuned) return 'In tune!';
    return reading.cents < 0 ? 'Tune up' : 'Tune down';
  };

  return (
    <section className={`tool-page tool-tuner${roomArtLoaded ? ' tool-has-background' : ''}`} aria-label="Chromatic instrument tuner">
      <img className="tool-bottom-art" src="/visuals/tools/p04-tuner-background.png" alt="" aria-hidden="true"
        onLoad={() => setRoomArtLoaded(true)} onError={() => setRoomArtLoaded(false)} />
      <img className="tool-vine tool-vine-left" src={VISUAL_ASSETS.sharedMvp.botanicals.topLeft} alt="" aria-hidden="true" />
      <img className="tool-vine tool-vine-right" src={VISUAL_ASSETS.sharedMvp.botanicals.topRight} alt="" aria-hidden="true" />
      <header className="tool-heading">
        <button className="tool-back" type="button" onClick={() => navigate('/practice')} aria-label="Back to Practice">‹</button>
        <h1>Tuner</h1>
        <button className="tool-settings" type="button" aria-label="Tuner help" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>⚙</button>
      </header>
      {showHelp ? (
        <p className="tool-help">Play one note at a time in a quiet room. Guitar and Bass compare detected pitches against standard open strings. For best results, use headphones with the reference tone.</p>
      ) : null}
      <div className="tuner-modes" role="group" aria-label="Tuning mode">
        {(['chromatic', 'guitar', 'bass'] as const).map(option => (
          <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      <div className="tuner-reading" aria-live="off">
        <strong>{reading?.note ?? '—'}</strong>
        <span>{reading ? reading.frequency.toFixed(1) + ' Hz' : 'No pitch detected'}</span>
        {reading && mode !== 'chromatic' && reading.isOpenString ? (
          <small>Open string: {reading.targetLabel}</small>
        ) : null}
      </div>
      <div className="tuner-gauge" aria-label={reading && isNearString
        ? 'Deviation ' + Math.round(reading.cents) + ' cents'
        : 'No valid tuning measurement'}>
        <svg viewBox="0 0 320 150" role="img" aria-hidden="true">
          {Array.from({ length: 25 }, (_, index) => {
            const degrees = -70 + index * (140 / 24);
            const angle = degrees * Math.PI / 180;
            const outer = 134;
            const inner = index === 12 ? 100 : index % 4 === 0 ? 116 : 123;
            const color = index <= 2 || index >= 22 ? '#da5351' :
              index >= 5 && index <= 19 ? '#285b45' : '#1c3438';
            return <line key={index} x1={160 + Math.sin(angle) * inner}
              y1={146 - Math.cos(angle) * inner}
              x2={160 + Math.sin(angle) * outer}
              y2={146 - Math.cos(angle) * outer}
              stroke={color} strokeWidth={index === 12 ? 7 : 2.5} strokeLinecap="round" />;
          })}
          {needleAngle !== null ? (
            <g transform={'rotate(' + needleAngle + ' 160 146)'}>
              <path d="M154 141 L160 44 L166 141 Q160 152 154 141Z" fill="#17383a" />
            </g>
          ) : <circle cx="160" cy="141" r="5" fill="#afbaa9" />}
        </svg>
      </div>
      <div className="tuner-status" role="status">{getTuningMessage()}</div>
      <div className="tuner-measurements">
        <div><strong>{reading && isNearString ? reading.targetLabel : '—'}</strong><span>{reading && isNearString ? reading.targetFrequency.toFixed(1) + ' Hz target' : 'Target'}</span></div>
        <div><strong>{reading && isNearString ? (reading.cents >= 0 ? '+' : '') + Math.round(reading.cents) + '¢' : '—'}</strong><span>Deviation</span></div>
      </div>
      <button className="tuner-mic" type="button" onClick={toggleMicrophone} aria-pressed={status === 'listening'}>
        <span aria-hidden="true">◉</span> {status === 'listening' ? 'Stop microphone' :
          status === 'requesting' ? 'Cancel microphone request' : 'Enable microphone'}
      </button>
      {(status === 'denied' || status === 'unsupported' || status === 'error' || message) ? (
        <p className="tool-error" role="alert">{message}</p>
      ) : null}
      <div className="tuner-reference">
        <span className="tuner-speaker" aria-hidden="true">♫</span>
        <span><strong>Reference Pitch</strong><small>Play A (440 Hz)</small></span>
        <button type="button" className="tuner-reference-play" onClick={() => void toggleReference()}
          aria-label={referencePlaying ? 'Stop A 440 hertz tone' : 'Play A 440 hertz tone'}>
          {referencePlaying ? 'Ⅱ' : '▶'}
        </button>
      </div>
      <div className="tool-cat-scene tool-tuner-scene" aria-hidden="true">
        <img className="tool-scene-plant tool-plant-left" src={VISUAL_ASSETS.approvedDecor.plant} alt="" />
        <img className="tool-scene-plant tool-plant-right" src={VISUAL_ASSETS.approvedDecor.plant} alt="" />
        <img className="tool-scene-rug" src={VISUAL_ASSETS.sharedMvp.companionSurfaces.rug} alt="" />
        <img className="tool-scene-cat" src={VISUAL_ASSETS.cat.sleepingFile(catId)} alt="" />
      </div>
    </section>
  );
}
