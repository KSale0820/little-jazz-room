import { useEffect, useRef } from 'react';
import type { PracticeMetronomeController, MetronomeMeter } from '../lib/usePracticeMetronome';
import { metronomeClickOptions } from '../lib/metronomeSync';
import './PracticeMetronomeSheet.css';

type MetronomeDisplayMode = 'sheet' | 'page';

/** Shared player-popup and standalone-page controls. The same visual design and
 * audio engine now power both entry points without replacing the player clock. */
export function PracticeMetronomeControls({ controller, onClose, mode = 'sheet', chartAvailable = true }: {
  controller: PracticeMetronomeController;
  onClose: () => void;
  mode?: MetronomeDisplayMode;
  /** False for empty Free Practice and routine instructions without a chart. */
  chartAvailable?: boolean;
}) {
  const isPage = mode === 'page';
  const canChooseMeter = isPage || !chartAvailable;
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isPage) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    return () => previous?.focus?.();
  }, [isPage]);

  const trapModalFocus = (event: React.KeyboardEvent) => {
    if (isPage) return;
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const items = [...(panel.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled)',
    ) ?? [])];
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items[items.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
      event.preventDefault();
      items[0].focus();
    }
  };

  const clickOptions = metronomeClickOptions(controller.meter[0]);
  const signatures: { label: string; meter: MetronomeMeter }[] = [
    { label: '2/4', meter: [2, 4] },
    { label: '3/4', meter: [3, 4] },
    { label: '4/4', meter: [4, 4] },
    { label: '6/8', meter: [6, 8] },
  ];

  return <section ref={panel}
    className={'practice-metronome-sheet' + (isPage ? ' practice-metronome-page-surface' : '')}
    role={isPage ? 'region' : 'dialog'} aria-modal={isPage ? undefined : true}
    aria-label={isPage ? 'Metronome controls' : 'Metronome settings'}
    onKeyDown={isPage ? undefined : trapModalFocus}>
    <header className={isPage ? 'practice-metronome-page-header' : undefined}>
      {isPage && <button type="button" className="practice-metronome-page-back"
        aria-label="Back to Practice" onClick={onClose}>‹</button>}
      <h2>Metronome</h2>
      {isPage
        ? <span className="practice-metronome-page-spacer" aria-hidden="true" />
        : <button type="button" aria-label="Close Metronome settings" onClick={onClose}>×</button>}
    </header>

    {(isPage || chartAvailable) && <div className={'practice-metronome-status' + (isPage ? ' is-page-status' : ' is-player-status')}>
      <p role="status">{controller.synced && !isPage
        ? 'Synced to playback, including seeks and repeats.'
        : controller.playing
          ? 'Metronome running. Tap Stop below to finish.'
          : 'Set your tempo, then tap Start Metronome below.'}</p>
    </div>}

    <div className="practice-metronome-tempo">
      <span>{controller.synced && !isPage ? 'Playback tempo' : 'Tempo'}</span>
      <div>
        <button type="button" disabled={controller.synced && !isPage}
          aria-label="Decrease metronome BPM" onClick={() => controller.changeBpm(controller.bpm - 1)}>−</button>
        <strong>{controller.bpm}<small>BPM</small></strong>
        <button type="button" disabled={controller.synced && !isPage}
          aria-label="Increase metronome BPM" onClick={() => controller.changeBpm(controller.bpm + 1)}>+</button>
      </div>
      <input type="range" min={40} max={240} value={controller.bpm}
        disabled={controller.synced && !isPage} aria-label="Metronome BPM"
        onChange={event => controller.changeBpm(Number(event.target.value))} />
      <button type="button" className="practice-metronome-tap"
        disabled={controller.synced && !isPage}
        onClick={controller.tapTempo}>Tap Tempo</button>
    </div>

    <div className="practice-metronome-field">
      <h3>Time signature</h3>
      {canChooseMeter
        ? <div className="practice-metronome-pills" role="group" aria-label="Metronome time signature">
          {signatures.map(({ label, meter }) => <button key={label} type="button"
            aria-pressed={controller.meter[0] === meter[0] && controller.meter[1] === meter[1]}
            onClick={() => controller.setPieceMeter(meter)}>{label}</button>)}
        </div>
        : <p className="practice-metronome-piece-meter">
          {controller.meter.join('/')} <span>from the chart</span>
        </p>}
    </div>

    <div className="practice-metronome-field">
      <h3>Clicks per measure</h3>
      <div className="practice-metronome-pills" role="group" aria-label="Metronome clicks per measure">
        {clickOptions.map(value => <button key={value} type="button"
          aria-label={value + ' clicks per measure'}
          aria-pressed={controller.clicksPerBar === value}
          onClick={() => controller.changeClicksPerBar(value)}>{value}</button>)}
      </div>
    </div>

    <div className="practice-metronome-field">
      <h3>Accent clicks</h3>
      <div className="practice-metronome-pills" role="group" aria-label="Accent metronome clicks">
        {controller.accents.map((accent, index) => <button key={index} type="button"
          aria-pressed={accent}
          className={controller.playing && controller.activeBeat === index ? 'active-beat' : ''}
          aria-label={'Click ' + (index + 1) + (accent ? ', accented' : '')}
          onClick={() => controller.toggleAccent(index)}>
          {index + 1} {accent ? '◆' : '○'}
        </button>)}
      </div>
    </div>

    <div className="practice-metronome-count">
      <label><input type="checkbox" checked={controller.countIn}
        onChange={event => controller.setCountIn(event.target.checked)} /> Count-in</label>
      <button type="button" disabled={!controller.countIn}
        onClick={() => controller.setCountInBars(value => value === 1 ? 2 : 1)}>
        {controller.countInBars} bar{controller.countInBars === 1 ? '' : 's'}
      </button>
    </div>
    {!isPage && controller.synced &&
      <p className="practice-metronome-help">Count-in is skipped when the track is already playing, so beats stay synchronized.</p>}
    {controller.error && <p role="alert" className="practice-metronome-error">{controller.error}</p>}
    <div className="practice-metronome-actions">
      <button type="button" className="practice-metronome-page-start"
        aria-pressed={controller.playing} onClick={controller.toggle}>
        {controller.playing ? 'Stop Metronome' : 'Start Metronome'}
      </button>
      <button type="button" className="practice-metronome-page-return" onClick={onClose}>
        {isPage ? 'Back to Practice' : 'Return to Practice'}
      </button>
    </div>
  </section>;
}

/** The player keeps its modal and its own playback-synchronized controller. */
export function PracticeMetronomeSheet({ controller, onClose, chartAvailable = true }: {
  controller: PracticeMetronomeController; onClose: () => void;
  chartAvailable?: boolean;
}) {
  return <div className="practice-metronome-backdrop"
    onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <PracticeMetronomeControls controller={controller} onClose={onClose} chartAvailable={chartAvailable} />
  </div>;
}
