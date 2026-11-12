import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localStorageScopeForUser } from '../repository/localRepository';
import { buildPitchSnapshot, sameLocalDay, savePitchSnapshot } from '../lib/tunerPitchHistory';
import { journalKey, readLocalList, persistLocalList, type PracticeJournalEntry } from '../lib/practicePlayerNotes';
import { SessionJournalSheet } from '../components/PracticePlayerSheets';
import { TunerPitchGraph } from '../components/TunerPitchGraph';
import {
  audioContextConstructor, detectPitch, gatePitchFrequency, inputRms, MIN_TUNER_RMS,
  readingFromFrequency, retainMeasuredPitch,
  type PitchGate, type PitchReading, type PitchTrailSample, type TuningMode, type RecentPitch,
} from './toolsAudio';
import './ToolsPages.css';
import './TunerClean.css';

type MicStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error';
type MicSignal = 'starting' | 'quiet' | 'unsteady' | 'active' | 'interrupted';

export function TunerPage({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userScope = localStorageScopeForUser(user?.id);
  const [journalEntries, setJournalEntries] = useState<PracticeJournalEntry[]>(() =>
    readLocalList<PracticeJournalEntry>(journalKey(userScope)));
  const [journalOpen, setJournalOpen] = useState(false);
  const [pendingPitchId, setPendingPitchId] = useState<string | null>(null);
  const [journalTarget, setJournalTarget] = useState<{
    sessionId: string; title: string; seconds: number;
  } | null>(null);
  const [historyMessage, setHistoryMessage] = useState('');
  const [mode, setMode] = useState<TuningMode>('chromatic');
  const [status, setStatus] = useState<MicStatus>('idle');
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [micSignal, setMicSignal] = useState<MicSignal>('starting');
  const [pitchTrail, setPitchTrail] = useState<PitchTrailSample[]>([]);
  const [message, setMessage] = useState('');
  const [referencePlaying, setReferencePlaying] = useState(false);
  const modeRef = useRef(mode);
  const recentPitchRef = useRef<RecentPitch>(null);
  const pitchGateRef = useRef<PitchGate>(null);
  const lastAnalysisRef = useRef(0);
  const graphProgressRef = useRef(0);
  const graphHasSoundRef = useRef(false);
  const graphNeedsGapRef = useRef(false);
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
    // Frequencies are concert-pitch measurements independent of tuning mode.
    // Switching Guitar/Bass/Chromatic must not erase a musician's take.
  }, [mode]);

  const stopMicrophone = useCallback(() => {
    requestRef.current++;
    permissionPendingRef.current = false;
    recentPitchRef.current = null;
    pitchGateRef.current = null;
    lastAnalysisRef.current = 0;
    // A pause only breaks the line when a new actual pitch arrives.
    graphNeedsGapRef.current = graphHasSoundRef.current;
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
        // Avoid overworking the phone's main thread during a sustained note.
        if (now - lastAnalysisRef.current < 125) return;
        lastAnalysisRef.current = now;
        const detected = detectPitch(frame, sampleRate);
        const gated = gatePitchFrequency(pitchGateRef.current, detected, now);
        pitchGateRef.current = gated.next;
        const frequency = gated.frequency;
        const measured = frequency === null ? null : readingFromFrequency(frequency, modeRef.current);
        const stable = retainMeasuredPitch(recentPitchRef.current, measured, now);
        recentPitchRef.current = stable.recent;
        setReading(stable.displayed);
        // Time on the graph advances for *measured pitches only*. Silence
        // marks a single break; there is no continuous blank recording.
        if (frequency === null) {
          if (graphHasSoundRef.current) graphNeedsGapRef.current = true;
        } else if (now - lastHistoryAtRef.current >= 250) {
          lastHistoryAtRef.current = now;
          const additions: PitchTrailSample[] = [];
          if (graphNeedsGapRef.current && graphHasSoundRef.current) {
            graphProgressRef.current += 250;
            additions.push({ timestamp: graphProgressRef.current, frequency: null });
          }
          graphProgressRef.current += 250;
          additions.push({
            timestamp: graphProgressRef.current, frequency, wallTime: Date.now(),
          });
          graphHasSoundRef.current = true;
          graphNeedsGapRef.current = false;
          setPitchTrail(previous => [...previous, ...additions]);
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

  const openDailyJournal = () => {
    const snapshot = buildPitchSnapshot(mode, pitchTrail);
    if (!snapshot) { setHistoryMessage('Play a note before adding a graph.'); return; }
    if (!savePitchSnapshot(userScope, snapshot)) {
      setHistoryMessage('Could not save your pitch graph on this device.'); return;
    }
    // Prefer the latest existing journal entry today. Never overwrite it
    // silently: the editor opens with its existing notes and the graph shown.
    const entries = readLocalList<PracticeJournalEntry>(journalKey(userScope));
    const current = entries.filter(entry => sameLocalDay(entry.createdAt, snapshot.savedAt))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const date = new Date(snapshot.savedAt);
    const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')].join('-');
    setJournalEntries(entries);
    setJournalTarget({
      sessionId: current?.sessionId ?? 'tuner-day:' + day,
      title: current?.chartTitle ?? 'Daily Journal',
      seconds: current?.durationSeconds ?? 0,
    });
    setPendingPitchId(snapshot.id);
    setJournalOpen(true);
    setHistoryMessage('');
  };

  const saveDailyJournal = (text: string, pitchCaptureIds: string[]) => {
    if (!journalTarget) return;
    const entries = readLocalList<PracticeJournalEntry>(journalKey(userScope));
    const existing = entries.find(entry => entry.sessionId === journalTarget.sessionId);
    const now = new Date().toISOString();
    const entry: PracticeJournalEntry = {
      id: existing?.id ?? crypto.randomUUID(),
      sessionId: journalTarget.sessionId,
      chartId: existing?.chartId ?? '',
      chartTitle: existing?.chartTitle ?? journalTarget.title,
      text, createdAt: existing?.createdAt ?? now, updatedAt: now,
      durationSeconds: existing?.durationSeconds ?? journalTarget.seconds,
      pitchCaptureIds,
    };
    const updated = [entry, ...entries.filter(item => item.sessionId !== journalTarget.sessionId)];
    if (!persistLocalList(journalKey(userScope), updated)) {
      setHistoryMessage('Could not save your journal entry on this device.');
      return;
    }
    setJournalEntries(updated);
    setJournalOpen(false);
    setPendingPitchId(null);
    setHistoryMessage('Graph added to your daily journal.');
    window.dispatchEvent(new Event('little-jazz-room:journal-updated'));
  };

  const resetPitchHistory = () => {
    setPitchTrail([]);
    graphProgressRef.current = 0;
    graphHasSoundRef.current = false;
    graphNeedsGapRef.current = false;
    lastHistoryAtRef.current = 0;
    setHistoryMessage('');
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
        <span className="tuner-header-spacer" aria-hidden="true" />
      </header>
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
      <section className="tuner-trail-panel" aria-label="Live pitch graph">
        <div className="tuner-trail-heading"><strong>Pitch history</strong></div>
        <TunerPitchGraph samples={pitchTrail} />
      </section>
      <div className="tuner-history-actions">
        <button type="button" disabled={pitchTrail.filter(p => p.frequency !== null).length < 2}
          onClick={openDailyJournal}>Add graph to journal</button>
        <button type="button" disabled={!pitchTrail.length}
          onClick={resetPitchHistory}>Clear graph</button>
      </div>
      {historyMessage ? <p className="tuner-history-message" role="status">{historyMessage}</p> : null}
      {journalOpen && journalTarget && pendingPitchId && createPortal(
        <SessionJournalSheet title="Daily Journal" chartTitle={journalTarget.title}
          sessionId={journalTarget.sessionId} seconds={journalTarget.seconds}
          entries={journalEntries} userScope={userScope}
          initialPitchCaptureIds={[pendingPitchId]}
          onSave={saveDailyJournal}
          onDelete={id => {
            const next = journalEntries.filter(entry => entry.id !== id);
            if (persistLocalList(journalKey(userScope), next)) setJournalEntries(next);
          }}
          onClose={() => { setJournalOpen(false); setPendingPitchId(null); }} />, document.body)}


    </section>
  );
}
