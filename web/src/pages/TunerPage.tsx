import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localStorageScopeForUser } from '../repository/localRepository';
import { buildPitchSnapshot, deletePitchSnapshot, pitchSnapshotCsv, readPitchSnapshots, savePitchSnapshot, type TunerPitchSnapshot } from '../lib/tunerPitchHistory';
import {
  audioContextConstructor, detectPitch, inputRms, MIN_TUNER_RMS, pitchTrailGeometry,
  readingFromFrequency, retainMeasuredPitch,
  type PitchReading, type PitchTrailSample, type TuningMode, type RecentPitch,
} from './toolsAudio';
import './ToolsPages.css';
import './TunerClean.css';

type MicStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error';
type MicSignal = 'starting' | 'quiet' | 'unsteady' | 'active' | 'interrupted';

export function TunerPage({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userScope = localStorageScopeForUser(user?.id);
  const [savedPitch, setSavedPitch] = useState<TunerPitchSnapshot[]>(() => readPitchSnapshots(userScope));
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const [pitchWindowMs, setPitchWindowMs] = useState(30000);
  const [historyMessage, setHistoryMessage] = useState('');
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
  const recentPitchRef = useRef<RecentPitch>(null);
  const requestRef = useRef(0);
  const permissionPendingRef = useRef(false);
  const microphoneRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const lastWorkletFrameRef = useRef(0);
  const lastCaptureAtRef = useRef(0);
  const lastHistoryAtRef = useRef(0);
  const watchdogRef = useRef(0);
  const [capturePath, setCapturePath] = useState<'analyser' | 'worklet'>('analyser');
  const rafRef = useRef(0);
  const toneRef = useRef<{ context: AudioContext; oscillator: OscillatorNode } | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    recentPitchRef.current = null;
    setReading(null);
    setPitchTrail([]);
  }, [mode]);

  const selectedSnapshot = savedPitch.find(item => item.id === selectedSnapshotId) ?? null;
  const displayedPitch = selectedSnapshot?.samples ?? pitchTrail;
  const displayedNow = selectedSnapshot?.durationMs ?? pitchTrail.at(-1)?.timestamp ?? 0;
  const displayedWindow = pitchWindowMs === 0
    ? Math.max(8000, (displayedPitch.at(-1)?.timestamp ?? 0) - (displayedPitch[0]?.timestamp ?? 0))
    : pitchWindowMs;
  const trail = useMemo(() => pitchTrailGeometry(displayedPitch, displayedNow, displayedWindow),
    [displayedPitch, displayedNow, displayedWindow]);
  const pitchTrailEnabled = showPitchTrail;

  const stopMicrophone = useCallback(() => {
    requestRef.current++;
    permissionPendingRef.current = false;
    recentPitchRef.current = null;
    if (microphoneRef.current) {
      // Mark a real break between successive takes, not a fake continuous note.
      setPitchTrail(previous => previous.length
        ? [...previous, { timestamp: performance.now(), frequency: null }].slice(-3600)
        : previous);
    }
    window.clearInterval(watchdogRef.current);
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
      if (document.hidden && !permissionPendingRef.current && microphoneRef.current) {
        // Mobile browsers briefly suspend Web Audio when the page dims or
        // switches apps. Preserve the microphone and pitch history for resume.
        setReading(null);
        setMicSignal('interrupted');
        stopReference();
      } else if (!document.hidden && contextRef.current &&
        contextRef.current.state !== 'running') {
        void contextRef.current.resume().catch(() => setMicSignal('interrupted'));
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('focus', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('focus', onHidden);
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
    // Starting again does not discard the last take. Clear explicitly if wanted.
    setMessage('');
    setHistoryMessage('');
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
        lastCaptureAtRef.current = now;
        const frequency = detectPitch(frame, sampleRate);
        const measured = frequency === null ? null : readingFromFrequency(frequency, modeRef.current);
        const stable = retainMeasuredPitch(recentPitchRef.current, measured, now);
        recentPitchRef.current = stable.recent;
        setReading(stable.displayed);
        // Capture even while the graph is collapsed. Keep at most 15 minutes
        // of compact pitch points (4 Hz), including true silence as gaps.
        if (now - lastHistoryAtRef.current >= 250) {
          lastHistoryAtRef.current = now;
          setPitchTrail(previous => [...previous, { timestamp: now, frequency }].slice(-3600));
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
      lastCaptureAtRef.current = performance.now();
      rafRef.current = requestAnimationFrame(analyseFallback);
      // Detect suspended capture rather than silently leaving "Listening" on
      // screen. The analyser is already an independent worklet fallback.
      watchdogRef.current = window.setInterval(() => {
        if (request !== requestRef.current || document.hidden) return;
        if (context!.state !== 'running') {
          setReading(null);
          setMicSignal('interrupted');
          void context!.resume().catch(() => setMicSignal('interrupted'));
        } else if (performance.now() - lastCaptureAtRef.current > 3000) {
          // If requestAnimationFrame or the worklet stalls, the watchdog
          // directly samples the existing analyser on the audio clock.
          // Never manufacture a reading when these PCM samples are silent.
          const now = performance.now();
          analyser.getFloatTimeDomainData(samples);
          processSamples(samples, context!.sampleRate, now);
          setCapturePath('analyser');
        }
      }, 1000);
      context.onstatechange = () => {
        if (request !== requestRef.current) return;
        if (context!.state !== 'running') {
          setReading(null);
          setMicSignal('interrupted');
        } else {
          setMicSignal('starting');
        }
      };

      // AudioWorklet receives continuous microphone frames on the audio
      // rendering thread. iOS Safari's requestAnimationFrame may be uneven
      // even while the microphone remains open. Capture only: no playback.
      if (context.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        try {
          await context.audioWorklet.addModule('/worklets/tuner-capture.js');
          if (request !== requestRef.current) return;
          const worklet = new AudioWorkletNode(context, 'ljr-tuner-capture');
          worklet.addEventListener('processorerror', () => {
            if (request === requestRef.current) {
              lastWorkletFrameRef.current = 0;
              setCapturePath('analyser');
            }
          });
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
      stream.getAudioTracks()[0]?.addEventListener('mute', () => {
        if (request === requestRef.current) { setReading(null); setMicSignal('interrupted'); }
      });
      stream.getAudioTracks()[0]?.addEventListener('unmute', () => {
        if (request === requestRef.current) setMicSignal('starting');
      });
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
    if (!context || context.state === 'closed' ||
      (context.state === 'running' && performance.now() - lastCaptureAtRef.current > 3000)) {
      void startMicrophone(); return;
    }
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

  const savePitchHistory = () => {
    const snapshot = buildPitchSnapshot(mode, pitchTrail);
    if (!snapshot) { setHistoryMessage('Play a note first to save a pitch check.'); return; }
    if (!savePitchSnapshot(userScope, snapshot)) {
      setHistoryMessage('Could not save pitch history on this device.'); return;
    }
    setSavedPitch(readPitchSnapshots(userScope));
    setSelectedSnapshotId(snapshot.id);
    setShowPitchTrail(true);
    setHistoryMessage("Pitch check saved. Attach it in today's Session Journal.");
  };

  const resetPitchHistory = () => {
    setPitchTrail([]);
    lastHistoryAtRef.current = 0;
    setSelectedSnapshotId(null);
    setHistoryMessage('');
  };

  const removePitchHistory = (id: string) => {
    if (!deletePitchSnapshot(userScope, id)) {
      setHistoryMessage('Could not delete saved pitch check.'); return;
    }
    setSavedPitch(readPitchSnapshots(userScope));
    if (selectedSnapshotId === id) setSelectedSnapshotId(null);
  };

  const exportPitchHistory = (snapshot: TunerPitchSnapshot) => {
    const blob = new Blob([pitchSnapshotCsv(snapshot)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'little-jazz-pitch-' + snapshot.savedAt.slice(0, 10) + '.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
    if (status !== 'listening') return status === 'requesting' ? 'Connecting microphone…' : 'Ready to tune';
    if (micSignal === 'interrupted') return 'Audio paused. Tap Resume audio.';
    if (micSignal === 'quiet') return 'Listening for a note…';
    if (micSignal === 'unsteady') return 'Sound heard. Hold a steady note.';
    if (!reading) return 'Listening for a note…';
    if (!isNearString) return 'Play an open string';
    if (isTuned) return 'In tune!';
    return reading.cents < 0 ? 'Tune up' : 'Tune down';
  };

  return (
    <section className="tool-page tool-tuner" aria-label="Chromatic instrument tuner" data-capture-path={capturePath}>
      <header className="tool-heading">
        <button className="tool-back" type="button" onClick={onClose ?? (() => navigate('/practice'))} aria-label={onClose ? 'Close tool and return to session' : 'Back to Practice'}>‹</button>
        <h1>Tuner</h1>
        <button className="tool-settings" type="button" aria-label="Tuner help" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>?</button>
      </header>
      {showHelp ? (
        <p className="tool-help">Play or sing one sustained note at a time. Chromatic recognizes any note and can show your pitch over time. Guitar and Bass compare against standard open strings.</p>
      ) : null}
      <div className="tuner-modes" role="group" aria-label="Tuning mode">
        {(['chromatic', 'guitar', 'bass'] as const).map(option => (
          <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      <button className="tuner-mic" type="button" onClick={toggleMicrophone} aria-pressed={status === 'listening'}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
        </svg>
        {status === 'listening' ? 'Stop microphone' :
          status === 'requesting' ? 'Cancel microphone request' : 'Enable microphone'}
      </button>
      {status === 'listening' && micSignal === 'interrupted' ? (
        <button className="tuner-mic tuner-resume" type="button" onClick={resumeMicrophoneAudio}>Resume audio</button>
      ) : null}
      {(status === 'denied' || status === 'unsupported' || status === 'error' || message) ? (
        <p className="tool-error" role="alert">{message}</p>
      ) : null}
      <section className="tuner-main-card" aria-label="Live tuning">
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
      <div className="tuner-status" data-tuned={isTuned} role="status">{getTuningMessage()}</div>
      <div className="tuner-measurements">
        <div><strong>{reading && isNearString ? reading.targetLabel : '—'}</strong><span>{reading && isNearString ? reading.targetFrequency.toFixed(1) + ' Hz target' : 'Target'}</span></div>
        <div><strong>{reading && isNearString ? (reading.cents >= 0 ? '+' : '') + Math.round(reading.cents) + '¢' : '—'}</strong><span>Deviation</span></div>
      </div>
      </section>
      <div className="tuner-reference">
        <svg className="tuner-speaker" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" />
        </svg>
        <span><strong>Reference Pitch</strong><small>Play A (440 Hz)</small></span>
        <button type="button" className="tuner-reference-play" onClick={() => void toggleReference()}
          aria-label={referencePlaying ? 'Stop A 440 hertz tone' : 'Play A 440 hertz tone'}>
          {referencePlaying
            ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="7" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="m8 4 12 8-12 8z" /></svg>}
        </button>
      </div>
      <div className="tuner-trail-controls">
        <button type="button" className="tuner-trail-toggle" aria-pressed={showPitchTrail}
          onClick={() => setShowPitchTrail(value => !value)}>
          {showPitchTrail ? 'Hide pitch graph' : 'Show pitch graph'}
        </button>
      </div>
      {pitchTrailEnabled ? (
        <section className="tuner-trail-panel" aria-label="Live pitch graph">
          <div className="tuner-trail-heading"><strong>{selectedSnapshot ? 'Saved pitch check' : 'Pitch history'}</strong></div>
          <div className="tuner-history-range" role="group" aria-label="Pitch history range">
            {([['8s', 8000], ['30s', 30000], ['2m', 120000], ['Full take', 0]] as const).map(([label, ms]) =>
              <button type="button" key={label} aria-pressed={pitchWindowMs === ms}
                onClick={() => setPitchWindowMs(ms)}>{label}</button>)}
          </div>
          <div className="tuner-trail-plot">
            <span className="tuner-trail-high">{trail.highNote}</span>
            <svg viewBox="0 0 320 102" preserveAspectRatio="none" role="img"
              aria-label="Measured pitch over the selected time range. Higher notes appear higher; gaps indicate silence.">
              <line x1="0" x2="320" y1="27" y2="27" stroke="#dedecf" strokeDasharray="4 6" />
              <line x1="0" x2="320" y1="69" y2="69" stroke="#dedecf" strokeDasharray="4 6" />
              {trail.segments.map((segment, index) => (
                <polyline key={index} points={segment.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')}
                  fill="none" stroke="#397456" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {trail.current && <circle cx={trail.current.x} cy={trail.current.y} r="4.5" fill="#c69a52" />}
            </svg>
            <span className="tuner-trail-low">{trail.lowNote}</span>
          </div>
          <small>{pitchWindowMs === 0 ? 'Start of take' : pitchWindowMs / 1000 + ' seconds ago'} <span>{selectedSnapshot ? 'Saved' : 'Now'}</span></small>
          {selectedSnapshot ? (
            <div className="tuner-history-actions">
              <button type="button" onClick={() => exportPitchHistory(selectedSnapshot)}>Export CSV</button>
              <button type="button" onClick={() => setSelectedSnapshotId(null)}>View live take</button>
            </div>
          ) : null}
        </section>
      ) : null}
      <div className="tuner-history-actions">
        <button type="button" disabled={pitchTrail.filter(p => p.frequency !== null).length < 2}
          onClick={savePitchHistory}>Save pitch check for journal</button>
        <button type="button" disabled={!pitchTrail.length} onClick={resetPitchHistory}>Clear take</button>
      </div>
      {historyMessage ? <p className="tuner-history-message" role="status">{historyMessage}</p> : null}
      {savedPitch.length ? (
        <section className="tuner-saved-pitch" aria-label="Saved pitch checks">
          <div className="tuner-trail-heading"><strong>Saved pitch checks</strong>
            {savedPitch.length > 3 ? <button type="button" onClick={() => setShowAllSaved(v => !v)}>
              {showAllSaved ? 'Show fewer' : 'View all'}</button> : null}
          </div>
          {(showAllSaved ? savedPitch : savedPitch.slice(0, 3)).map(snapshot => (
            <div className="tuner-saved-pitch-row" key={snapshot.id}>
              <button type="button" onClick={() => { setSelectedSnapshotId(snapshot.id); setShowPitchTrail(true); }}>
                {new Date(snapshot.savedAt).toLocaleDateString()} · {snapshot.mode} · {Math.round(snapshot.durationMs / 1000)}s
              </button>
              <button type="button" aria-label={'Delete pitch check ' + snapshot.id}
                onClick={() => removePitchHistory(snapshot.id)}>×</button>
            </div>
          ))}
        </section>
      ) : null}

    </section>
  );
}
