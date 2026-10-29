import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChordGrid } from '../components/ChordGrid';
import { CatSprite } from '../features/cats/CatCompanion';
import { chartsById, exercisesById } from '../data/seed';
import { formatChartMeta } from '../lib/chords';
import { commitStepElapsed, sessionDurationSeconds } from '../lib/practiceSessionTimer';
import { resolvePlayableStep } from '../lib/routinePlayback';
import { useApp } from '../context/AppContext';
import type { WrittenPitch } from '../types/content';

const CHROMA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function PracticePage() {
  const navigate = useNavigate();
  const {
    charts,
    exercises,
    routines,
    activeRoutineId,
    addSession,
    showToast,
    teamSignedIn,
    catId,
    catMotion,
    focusMode,
    setFocusMode,
  } = useApp();

  const routine = activeRoutineId ? (routines.find(r => r.id === activeRoutineId) ?? null) : null;
  const [stepIndex, setStepIndex] = useState(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);

  const currentStep = routine?.steps[stepIndex] ?? null;
  const playableStep = useMemo(() => {
    if (!currentStep) return null;
    return resolvePlayableStep(currentStep, exercises, exercisesById);
  }, [currentStep, exercises]);

  const defaultChartId = playableStep?.chart_id ?? charts[0]?.id ?? 'blues-f-12';
  const [chartId, setChartId] = useState(defaultChartId);
  const [panel, setPanel] = useState<'chords' | 'player'>('player');
  const [writtenPitch, setWrittenPitch] = useState<WrittenPitch>('C');
  const [chartKey, setChartKey] = useState('F');
  const [selectedBar, setSelectedBar] = useState(0);
  const [loopValue, setLoopValue] = useState('all');
  const [stepSeconds, setStepSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const sessionSeconds = sessionDurationSeconds(accumulatedSeconds, stepSeconds);

  useEffect(() => {
    setStepIndex(0);
    setAccumulatedSeconds(0);
    setStepSeconds(0);
    setRunning(false);
  }, [activeRoutineId, routine?.id]);

  const chart = chartsById[chartId] ?? charts[0]!;
  const stepMinutes = currentStep?.duration_minutes ?? playableStep?.duration_minutes ?? 0;
  const stepTargetSeconds = stepMinutes * 60;

  useEffect(() => {
    if (playableStep?.chart_id) {
      setChartId(playableStep.chart_id);
      const c = chartsById[playableStep.chart_id];
      if (c) setChartKey(c.concert_key);
      setSelectedBar(0);
    }
  }, [playableStep?.exercise_id, playableStep?.chart_id]);

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => setStepSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const loopRange = useMemo((): [number, number] | null => {
    if (loopValue === 'all') return null;
    const [a, b] = loopValue.split('-').map(Number);
    if (!a || !b) return null;
    return [a, b];
  }, [loopValue]);

  const loopOptions = useMemo(() => {
    const n = chart.bars.length;
    const chunks = Array.from({ length: Math.ceil(n / 4) }, (_, i) => {
      const a = 1 + i * 4;
      const b = Math.min(n, a + 3);
      return { value: `${a}-${b}`, label: `Bars ${a}–${b}` };
    });
    return [{ value: 'all', label: `All ${n}` }, ...chunks];
  }, [chart]);

  const toggleTimer = () => setRunning(r => !r);

  const goStep = (delta: number) => {
    if (!routine) return;
    setRunning(false);
    setAccumulatedSeconds(prev => commitStepElapsed(prev, stepSeconds));
    setStepSeconds(0);
    setStepIndex(i => Math.max(0, Math.min(routine.steps.length - 1, i + delta)));
  };

  const finish = async () => {
    setRunning(false);
    const durationSeconds = sessionDurationSeconds(accumulatedSeconds, stepSeconds);
    try {
      await addSession({
        id: `sess-${Date.now()}`,
        finishedAt: new Date().toISOString(),
        durationSeconds,
        routineId: activeRoutineId ?? undefined,
        exerciseId: playableStep?.exercise_id,
      });
      setAccumulatedSeconds(0);
      setStepSeconds(0);
      showToast(teamSignedIn ? 'Session saved to your team account.' : 'Session saved on this device.');
      navigate('/profile');
    } catch {
      showToast('Could not save session. Try again when online.');
    }
  };

  const stepTimeLabel = `${String(Math.floor(stepSeconds / 60)).padStart(2, '0')}:${String(stepSeconds % 60).padStart(2, '0')}`;
  const sessionTimeLabel = `${String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:${String(sessionSeconds % 60).padStart(2, '0')}`;
  const targetLabel = `${String(Math.floor(stepTargetSeconds / 60)).padStart(2, '0')}:${String(stepTargetSeconds % 60).padStart(2, '0')}`;

  return (
    <section className="page practice-page pad tight" aria-label="Practice">
      <div className="pageheading">
        <h2>Practice</h2>
        <span className="mutebadge">No audio loaded</span>
      </div>

      {routine ? (
        <div className="box routine-player-head">
          <div className="between">
            <div>
              <h3>{routine.title}</h3>
              <small>
                Exercise {stepIndex + 1} of {routine.steps.length}
                {playableStep ? ` · ${playableStep.title}` : ''}
              </small>
            </div>
            <span className="mutebadge">{stepMinutes} min suggested</span>
          </div>
          <div className="routine-step-nav between" style={{ marginTop: 10 }}>
            <button type="button" className="btn tiny" disabled={stepIndex === 0} onClick={() => goStep(-1)}>
              Previous exercise
            </button>
            <button
              type="button"
              className="btn tiny"
              disabled={!routine || stepIndex >= routine.steps.length - 1}
              onClick={() => goStep(1)}
            >
              Next exercise
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">Choose a routine in Explore to follow ordered exercises.</p>
      )}

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={panel === 'chords'}
          className={panel === 'chords' ? 'active' : undefined}
          onClick={() => setPanel('chords')}
        >
          Chords
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={panel === 'player'}
          className={panel === 'player' ? 'active' : undefined}
          onClick={() => setPanel('player')}
        >
          Player
        </button>
      </div>
      {panel === 'chords' && (
        <div id="chordPanel">
          <label className="form-label" htmlFor="chartStudy">
            Harmony study chart
          </label>
          <select
            id="chartStudy"
            className="field"
            aria-label="Choose a jazz harmony study"
            value={chartId}
            onChange={e => {
              const id = e.target.value;
              setChartId(id);
              const c = chartsById[id];
              if (c) setChartKey(c.concert_key);
              setSelectedBar(0);
            }}
          >
            {charts.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} · {c.bars.length} bars
              </option>
            ))}
          </select>
          <div className="between" style={{ margin: '14px 0 4px' }}>
            <h3>{chart.title}</h3>
            <small>{formatChartMeta(chart)}</small>
          </div>
          <div className="between" style={{ marginBottom: 10 }}>
            <small>Original study · not an exact licensed song chart</small>
            <label className="row tiny">
              Written pitch{' '}
              <select
                className="picker"
                value={writtenPitch}
                onChange={e => setWrittenPitch(e.target.value as WrittenPitch)}
                aria-label="Written pitch for transposing instruments"
              >
                <option value="C">Concert</option>
                <option value="Bb">B♭ instruments</option>
                <option value="Eb">E♭ instruments</option>
              </select>
            </label>
          </div>
          <ChordGrid
            chart={chart}
            chartKey={chartKey}
            writtenPitch={writtenPitch}
            selectedBar={selectedBar}
            loopRange={loopRange}
            onSelectBar={setSelectedBar}
          />
          <p className="muted" style={{ marginTop: 8 }}>
            Tap a measure to highlight it. Chart only; audio is not synchronized.
          </p>
        </div>
      )}
      {panel === 'player' && (
        <div id="playerPanel">
          <div className="simple">
            <h3>{playableStep?.title ?? 'Practice instructions'}</h3>
            <p className="placeholder" style={{ marginTop: 8 }}>
              {playableStep?.instructions ??
                'Select a routine in Explore or follow the chart study on the Chords tab.'}
            </p>
            <small className="muted">
              Suggested duration: {stepMinutes} min · Step {stepTimeLabel}
              {stepTargetSeconds > 0 ? ` / ${targetLabel}` : ''} · Session {sessionTimeLabel}
            </small>
          </div>
          <div className="simple">
            <h3>Backing recording</h3>
            <p className="placeholder" style={{ marginTop: 7 }}>
              No recording selected. Future releases will support original mixed recordings and
              synchronized recorded instrument stems.
            </p>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 9 }}
              disabled
              title="Preview only until recordings exist"
            >
              Recorded stems · Preview (disabled)
            </button>
          </div>
        </div>
      )}
      <div className="between" style={{ marginTop: 17 }}>
        <label className="row tiny">
          Chart key{' '}
          <select
            className="picker"
            value={chartKey}
            onChange={e => setChartKey(e.target.value)}
            aria-label="Chart transposition key"
          >
            {CHROMA.map(k => (
              <option key={k} value={k}>
                {k.replace('b', '♭')} (chart)
              </option>
            ))}
          </select>
        </label>
        <label className="row tiny">
          Loop bars{' '}
          <select
            className="picker"
            value={loopValue}
            onChange={e => {
              setLoopValue(e.target.value);
              showToast('Notation loop selected, not a synchronized audio loop.');
            }}
            aria-label="Loop bars for notation highlight"
          >
            {loopOptions.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="playerline">
        <button
          type="button"
          aria-label="Previous bar"
          onClick={() => setSelectedBar(i => (i + chart.bars.length - 1) % chart.bars.length)}
        >
          ◀◀
        </button>
        <button type="button" aria-label="Start or pause timer" className="bigplay" onClick={toggleTimer}>
          {running ? 'Ⅱ' : '▶'}
        </button>
        <button
          type="button"
          aria-label="Next bar"
          onClick={() => setSelectedBar(i => (i + 1) % chart.bars.length)}
        >
          ▶▶
        </button>
      </div>
      <div className="between">
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{sessionTimeLabel}</strong>
        <small>
          Step {stepTimeLabel} · Measure {selectedBar + 1} / {chart.bars.length}
        </small>
        <button type="button" className="btn" onClick={finish}>
          Finish
        </button>
      </div>
      <label className="row tiny focus-toggle">
        <input type="checkbox" checked={focusMode} onChange={e => setFocusMode(e.target.checked)} />
        Focus mode (hide companion)
      </label>
      {!focusMode && (
        <div className="practice-companion" aria-hidden>
          <CatSprite catId={catId} size={48} animated={catMotion} decorative />
          <span className="muted tiny">Companion below controls · not on notation</span>
        </div>
      )}
      <div className="player-options">
        <div className="between">
          <h3>Recording and advanced audio</h3>
          <span className="mutebadge">Future</span>
        </div>
        <p className="placeholder" style={{ marginTop: 8 }}>
          Mix stem volumes, tempo/pitch processing, and melody fade: disabled until verified
          recorded-audio processing exists.
        </p>
        <button type="button" className="btn" disabled>
          Metronome · Preview
        </button>
      </div>
    </section>
  );
}
