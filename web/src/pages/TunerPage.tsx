import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAppearance } from '../context/AppearanceContext';
import { DecorativeCat } from '../features/cats/DecorativeCat';
import {
  audioContextConstructor, detectPitch, inputRms, MIN_TUNER_RMS, pitchTrailGeometry,
  readingFromFrequency, retainMeasuredPitch,
  type PitchReading, type PitchTrailSample, type TuningMode, type RecentPitch,
} from './toolsAudio';
import './ToolsPages.css';
import './CleanPixelToolsProgress.css';
import './CleanPixelMotifPlacements.css';
import './ToolsPolishedPair.css';
import './ToolsMockupApproved.css';

type MicStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error';
type MicSignal = 'starting' | 'quiet' | 'unsteady' | 'active' | 'interrupted';

export function TunerPage({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const { catId } = useApp();
  const { catMode } = useAppearance();
  const [mode, setMode] = useState<TuningMode>('chromatic');
  const [status, setStatus] = useState<MicStatus>('idle');
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [micSignal, setMicSignal] = useState<MicSignal>('starting');
  const [showPitchTrail, setShowPitchTrail] = useState(false);
  const [pitchTrail, setPitchTrail] = useState<PitchTrailSample[]>([]);
  const [message, setMessage] = useState('');
  const [referencePlaying, setReferencePlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const modeRef = useRef(mode);
  const showPitchTrailRef = useRef(false);
  const recentPitchRef = useRef<RecentPitch>(null);
  const requestRef = useRef(0);
  const permissionPendingRef = useRef(false);
  const microphoneRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const lastWorkletFrameRef = useRef(0);
  const [capturePath, setCapturePath] = useState<'analyser' | 'worklet'>('analyser');
  const rafRef = useRef(0);
  const toneRef = useRef<{ context: AudioContext; oscillator: OscillatorNode } | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    recentPitchRef.current = null;
    setReading(null);
    setPitchTrail([]);
  }, [mode]);

  useEffect(() => {
    showPitchTrailRef.current = showPitchTrail;
  }, [showPitchTrail]);

  const trail = useMemo(() => pitchTrailGeometry(
    pitchTrail, pitchTrail[pitchTrail.length - 1]?.timestamp ?? 0,
  ), [pitchTrail]);

  const stopMicrophone = useCallback(() => {
    requestRef.current++;
    permissionPendingRef.current = false;
    recentPitchRef.current = null;
    setPitchTrail([]);
    cancelAnimationFrame(rafRef.current);
    workletRef.current?.port.close();
    workletRef.current?.disconnect();
    workletRef.current = null;
    lastWorkletFrameRef.current = 0;
    setCapturePath('analyser');
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
      // Safari may report a transient visibility change during the permission
      // sheet. Do not cancel a pending getUserMedia() when that happens.
      if (document.hidden && !permissionPendingRef.current) {
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
    setMicSignal('starting');
    setPitchTrail([]);
    setMessage('');
    permissionPendingRef.current = true;
    const request = requestRef.current;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      const AudioCtor = audioContextConstructor();
      if (!AudioCtor) throw new Error('Web Audio is unavailable.');
      context = new AudioCtor();
      // Start unlocking Web Audio and requesting the mic in the SAME tap.
      // Do not await resume() first: it can remain pending in iOS Safari.
      void context.resume().catch(() => undefined);
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      permissionPendingRef.current = false;
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
      // Keep the capture graph active even on WebKit builds that only pull
      // audio from nodes connected to destination. Gain 0 prevents feedback.
      const silentOutput = context.createGain();
      silentOutput.gain.value = 0;
      analyser.connect(silentOutput);
      silentOutput.connect(context.destination);
      sourceRef.current = source;
      if (context.state !== 'running') void context.resume().catch(() => undefined);
      const samples = new Float32Array(analyser.fftSize);
      let lastAnalysis = 0;
      const startedAt = performance.now();

      // All pitch UI updates go through one handler regardless of capture
      // backend. The worklet is fed by the audio clock, not the display clock.
      const processSamples = (frame: Float32Array, sampleRate: number, now: number) => {
        if (request !== requestRef.current) return;
        const frequency = detectPitch(frame, sampleRate);
        const measured = frequency === null ? null : readingFromFrequency(frequency, modeRef.current);
        const stable = retainMeasuredPitch(recentPitchRef.current, measured, now);
        recentPitchRef.current = stable.recent;
        setReading(stable.displayed);
        if (showPitchTrailRef.current && (frequency !== null || stable.recent === null)) {
          setPitchTrail(previous => [
            ...previous.filter(point => point.timestamp > now - 8000),
            { timestamp: now, frequency },
          ].slice(-100));
        }
        const level = inputRms(frame);
        setMicSignal(stable.displayed !== null ? 'active' : level >= MIN_TUNER_RMS
          ? 'unsteady' : now - startedAt > 1500 ? 'quiet' : 'starting');
      };

      // A fallback analyser remains connected even if Safari cannot load or
      // later stops delivering AudioWorklet frames. No extra mic permission.
      const analyseFallback = (now: number) => {
        if (request !== requestRef.current) return;
        if (now - lastAnalysis >= 85) {
          lastAnalysis = now;
          if (context!.state !== 'running') {
            recentPitchRef.current = null;
            setMicSignal('interrupted');
            setReading(null);
          } else if (!lastWorkletFrameRef.current || now - lastWorkletFrameRef.current > 750) {
            analyser.getFloatTimeDomainData(samples);
            processSamples(samples, context!.sampleRate, now);
            setCapturePath('analyser');
          }
        }
        rafRef.current = requestAnimationFrame(analyseFallback);
      };
      setStatus('listening');
      rafRef.current = requestAnimationFrame(analyseFallback);

      // AudioWorklet receives continuous microphone frames on the audio
      // rendering thread. iOS Safari's requestAnimationFrame may be uneven
      // even while the microphone remains open. Capture only: no playback.
      if (context.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        try {
          await context.audioWorklet.addModule('/worklets/tuner-capture.js');
          if (request !== requestRef.current) return;
          const worklet = new AudioWorkletNode(context, 'ljr-tuner-capture');
          worklet.port.onmessage = event => {
            if (request !== requestRef.current || event.data?.type !== 'frame') return;
            const now = performance.now();
            lastWorkletFrameRef.current = now;
            setCapturePath('worklet');
            processSamples(new Float32Array(event.data.samples), event.data.sampleRate, now);
          };
          source.connect(worklet);
          worklet.connect(silentOutput);
          workletRef.current = worklet;
        } catch {
          // Older/limited Safari continues using the analyser, unchanged.
        }
      }
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
      permissionPendingRef.current = false;
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

  const resumeMicrophoneAudio = () => {
    const context = contextRef.current;
    if (!context) return;
    void context.resume().then(() => {
      setMicSignal(context.state === 'running' ? 'starting' : 'interrupted');
    }).catch(() => {
      setMicSignal('interrupted');
    });
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
  const unavailable = status === 'denied' || status === 'unsupported' || status === 'error';
  const getTuningMessage = () => {
    if (status !== 'listening') return status === 'requesting' ? 'Connecting microphone…' : 'Ready to tune';
    if (micSignal === 'interrupted') return 'Audio paused. Resume audio';
    if (micSignal === 'quiet') return 'Listening for a note…';
    if (micSignal === 'unsteady') return 'Hold a steady note';
    if (!reading) return 'Listening for a note…';
    if (!isNearString) return 'Play an open string';
    if (isTuned) return 'In Tune';
    if (reading.cents > 0) return Math.abs(reading.cents) < 18 ? 'Slightly Sharp' : 'Too Sharp';
    return Math.abs(reading.cents) < 18 ? 'Slightly Flat' : 'Too Flat';
  };

  return (
    <section className="tool-page tool-tuner jazz-tool-page" aria-label="Chromatic instrument tuner" data-capture-path={capturePath}>
      <header className="tool-heading jazz-tool-header">
        <button className="tool-back" type="button" onClick={onClose ?? (() => navigate('/practice'))}
          aria-label={onClose ? 'Close tool and return to session' : 'Back to Practice'}>‹</button>
        <h1><img src="/visuals/tools/pixel/tuner.png" alt="" aria-hidden="true" /> Tuner</h1>
        <button type="button" className="tool-settings" aria-label="Tuner help" aria-expanded={showHelp}
          onClick={() => setShowHelp(value => !value)}>?</button>
      </header>

      <div className="jazz-tool-settings" hidden={!showHelp}>
        <div className="jazz-tool-settings-heading"><strong>Tuner options</strong>
          <button type="button" onClick={() => setShowHelp(false)} aria-label="Close tuner options">×</button>
        </div>
        <p className="tool-help">Play or sing one sustained note at a time. Chromatic works with any pitched instrument or voice. Guitar and Bass compare standard open strings.</p>
        <div className="tuner-modes" role="group" aria-label="Tuning mode">
          {(['chromatic', 'guitar', 'bass'] as const).map(option => (
            <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
        <div className="tuner-trail-controls">
          <button type="button" className="tuner-trail-toggle" aria-pressed={showPitchTrail}
            onClick={() => setShowPitchTrail(value => !value)}>
            {showPitchTrail ? 'Hide pitch graph' : 'Show pitch graph'}
          </button>
        </div>
        <div className="tuner-reference">
          <span className="tuner-speaker" aria-hidden="true">♫</span>
          <span><strong>Reference Pitch</strong><small>Play A (440 Hz)</small></span>
          <button type="button" className="tuner-reference-play" onClick={() => void toggleReference()}
            aria-label={referencePlaying ? 'Stop A 440 hertz tone' : 'Play A 440 hertz tone'}>
            <img src={referencePlaying ? '/visuals/tools/pixel/stop.png' : '/visuals/tools/pixel/play.png'} alt="" aria-hidden="true" />
          </button>
        </div>
      </div>

      {unavailable ? (
        <section className="jazz-tuner-card jazz-tuner-unavailable" role="alert" aria-label="Microphone unavailable">
          <span className="jazz-unavailable-icon" aria-hidden="true">
            {status === 'denied' ? '♩' : status === 'unsupported' ? '×' : '!'}
          </span>
          <h2>{status === 'denied' ? 'Microphone Access Denied' :
            status === 'unsupported' ? 'No Microphone Available' : 'Tuner Error'}</h2>
          <p>{message || 'Could not start microphone audio. Check permissions and try again.'}</p>
          <button type="button" className="jazz-unavailable-retry" onClick={() => void startMicrophone()}>
            {status === 'denied' ? 'Try Microphone Again' : 'Try Again'}
          </button>
          <button type="button" className="jazz-unavailable-dismiss"
            onClick={onClose ?? (() => navigate('/practice'))}>Not Now</button>
        </section>
      ) : (
        <div className="jazz-tuner-card">
          <div className="tuner-gauge" aria-label={reading && isNearString
            ? 'Deviation ' + Math.round(reading.cents) + ' cents' : 'No valid tuning measurement'}>
            <svg viewBox="0 0 320 167" role="img" aria-hidden="true">
              {Array.from({ length: 35 }, (_, index) => {
                const from = -68 + index * (136 / 35);
                const to = -68 + (index + .85) * (136 / 35);
                const arcPoint = (angle: number, radius: number) => {
                  const r = angle * Math.PI / 180;
                  return [160 + Math.sin(r) * radius, 150 - Math.cos(r) * radius];
                };
                const a = arcPoint(from, 116);
                const b = arcPoint(from, 129);
                const c = arcPoint(to, 129);
                const d = arcPoint(to, 116);
                return <polygon key={index} points={[a, b, c, d].map(point => point.join(',')).join(' ')}
                  fill={index >= 13 && index <= 21 ? '#90b966' : '#c5aed7'} />;
              })}
              {[-50, -20, -10, 0, 10, 20, 50].map(value => {
                const angle = value / 50 * 68 * Math.PI / 180;
                const radius = 146;
                return <text key={value} x={160 + Math.sin(angle) * radius}
                  y={153 - Math.cos(angle) * radius} textAnchor="middle" fontSize="12.5"
                  fill="currentColor" fontWeight="650">{value > 0 ? '+' : ''}{value}</text>;
              })}
              <g transform={'rotate(' + (needleAngle ?? 0) + ' 160 150)'}
                opacity={reading && isNearString ? 1 : .32}>
                <line x1="160" y1="150" x2="160" y2="42" stroke="currentColor"
                  strokeWidth="4.2" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          <div className="tuner-reading" aria-live="off">
            <strong>{reading?.note ?? '—'}</strong>
            <span>{reading ? reading.frequency.toFixed(1) + ' Hz' : 'No pitch detected'}
              {reading && isNearString ? '  ·  ' + (reading.cents >= 0 ? '+' : '') + reading.cents.toFixed(1) + '¢' : ''}
            </span>
            {reading && mode !== 'chromatic' && reading.isOpenString ? (
              <small>Open string: {reading.targetLabel}</small>
            ) : null}
          </div>
          <div className={'tuner-status' + (status === 'listening' && isNearString && isTuned ? ' is-in-tune' : '') +
            (status === 'listening' && isNearString && reading && !isTuned ? ' is-deviating' : '')}
            role="status">{getTuningMessage()}</div>
          <div className="tuner-measurements">
            <div><strong>{reading && isNearString ? reading.targetLabel : '—'}</strong>
              <span>{reading && isNearString ? reading.targetFrequency.toFixed(1) + ' Hz target' : 'Target'}</span></div>
            <div><strong>{reading && isNearString ? (reading.cents >= 0 ? '+' : '') + Math.round(reading.cents) + '¢' : '—'}</strong>
              <span>Deviation</span></div>
          </div>
        </div>
      )}

      {showPitchTrail && !unavailable ? (
        <section className="tuner-trail-panel" aria-label="Live pitch graph">
          <div className="tuner-trail-heading"><strong>Pitch over time</strong></div>
          <div className="tuner-trail-plot">
            <span className="tuner-trail-high">{trail.highNote}</span>
            <svg viewBox="0 0 320 102" preserveAspectRatio="none" role="img"
              aria-label="Live graph of detected pitch over eight seconds. Higher notes appear higher. Breaks indicate silence.">
              <line x1="0" x2="320" y1="27" y2="27" stroke="#dedecf" strokeDasharray="4 6" />
              <line x1="0" x2="320" y1="69" y2="69" stroke="#dedecf" strokeDasharray="4 6" />
              {trail.segments.map((segment, index) => (
                <polyline key={index} points={segment.map(point => point.x.toFixed(1) + ',' + point.y.toFixed(1)).join(' ')}
                  fill="none" stroke="#397456" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {trail.current && <circle cx={trail.current.x} cy={trail.current.y} r="4.5" fill="#c69a52" />}
            </svg>
            <span className="tuner-trail-low">{trail.lowNote}</span>
          </div>
          <small>8 seconds ago <span>Now</span></small>
        </section>
      ) : null}

      {!unavailable ? (
        <div className="jazz-tuner-microphone-actions">
          <button className="tuner-mic" type="button" onClick={toggleMicrophone}
            aria-label={status === 'listening' ? 'Stop microphone' : status === 'requesting' ? 'Cancel microphone request' : 'Enable microphone'}
            aria-pressed={status === 'listening'}>
            <span className="jazz-mic-symbol" aria-hidden="true">♩</span>
            {status === 'listening' ? 'Listening…  ·  Stop' :
              status === 'requesting' ? 'Cancel microphone request' : 'Enable microphone'}
          </button>
          {status === 'listening' && micSignal === 'interrupted' ? (
            <button className="tuner-mic jazz-mic-resume" type="button"
              onClick={resumeMicrophoneAudio}>Resume audio</button>
          ) : null}
        </div>
      ) : null}
      {message && !unavailable ? <p className="tool-error" role="alert">{message}</p> : null}

      <div className="jazz-tool-footer" aria-hidden="true">
        <img className="jazz-tool-plant" src="/visuals/tools/mockup/pothos.svg" alt="" />
        <div className="tool-cat-scene tool-tuner-scene">
          {catId === 'luna' ? (
            <img className="tool-scene-cat jazz-mock-cat" src="/visuals/tools/mockup/cat-sleeping.svg"
              alt="" style={{ visibility: catMode ? 'visible' : 'hidden' }} />
          ) : <DecorativeCat catId={catId} variant="sleeping" size={116} className="tool-scene-cat" />}
        </div>
        <span className="jazz-decor-note">♫</span>
      </div>
    </section>
  );
}
