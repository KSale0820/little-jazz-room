import { useEffect, useRef } from 'react';
import type { PracticeMetronomeController } from '../lib/usePracticeMetronome';
import { metronomeClickOptions } from '../lib/metronomeSync';
import './PracticeMetronomeSheet.css';

export function PracticeMetronomeSheet({ controller, onClose }: {
  controller: PracticeMetronomeController; onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    return () => previous?.focus?.();
  }, []);
  const trap = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)') ?? [])];
    if (!controls.length) return;
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault(); controls[controls.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
      event.preventDefault(); controls[0].focus();
    }
  };
  const options = metronomeClickOptions(controller.meter[0]);
  return <div className="practice-metronome-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section ref={dialog} className="practice-metronome-sheet" role="dialog" aria-modal="true"
      aria-label="Metronome settings" onKeyDown={trap}>
      <header><h2>Metronome</h2>
        <button type="button" aria-label="Close Metronome settings" onClick={onClose}>×</button>
      </header>
      <div className="practice-metronome-status">
        <button type="button" className={controller.playing ? 'on' : ''}
          aria-pressed={controller.playing} onClick={controller.toggle}>
          {controller.playing ? 'On' : 'Off'} <span aria-hidden="true" />
        </button>
        <p role="status">{controller.synced
          ? 'Synced to playback, including seeks and repeats.'
          : controller.playing
            ? 'Running independently. Playing the track will synchronize the clicks.'
            : 'Start here or use the switch beside the chart.'}</p>
      </div>
      <div className="practice-metronome-tempo">
        <span>{controller.synced ? 'Playback tempo' : 'Tempo'}</span>
        <div><button type="button" disabled={controller.synced} aria-label="Decrease metronome BPM"
          onClick={() => controller.changeBpm(controller.bpm - 1)}>−</button>
          <strong>{controller.bpm}<small>BPM</small></strong>
          <button type="button" disabled={controller.synced} aria-label="Increase metronome BPM"
            onClick={() => controller.changeBpm(controller.bpm + 1)}>+</button>
        </div>
        <input type="range" min={40} max={240} value={controller.bpm}
          disabled={controller.synced} aria-label="Metronome BPM"
          onChange={event => controller.changeBpm(Number(event.target.value))} />
        <button type="button" className="practice-metronome-tap" disabled={controller.synced}
          onClick={controller.tapTempo}>Tap Tempo</button>
      </div>
      <div className="practice-metronome-field">
        <h3>Time signature</h3>
        <p className="practice-metronome-piece-meter">
          {controller.meter.join('/')} <span>from the chart</span>
        </p>
      </div>
      <div className="practice-metronome-field">
        <h3>Clicks per measure</h3>
        <p className="practice-metronome-help">Choose fewer beats or an even subdivision of this measure. All clicks stay aligned to the original meter.</p>
        <div className="practice-metronome-pills" role="group" aria-label="Metronome clicks per measure">
          {options.map(value => <button key={value} type="button"
            aria-label={value + ' clicks per measure'}
            aria-pressed={controller.clicksPerBar === value}
            onClick={() => controller.changeClicksPerBar(value)}>{value}</button>)}
        </div>
      </div>
      <div className="practice-metronome-field">
        <h3>Accent clicks</h3>
        <div className="practice-metronome-pills" role="group" aria-label="Accent metronome clicks">
          {controller.accents.map((accent, index) =>
            <button key={index} type="button" aria-pressed={accent}
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
      {controller.synced && <p className="practice-metronome-help">Count-in is skipped when the track is already playing, so beats stay synchronized.</p>}
      {controller.error && <p role="alert" className="practice-metronome-error">{controller.error}</p>}
      <button type="button" className="practice-metronome-done" onClick={onClose}>Done</button>
    </section>
  </div>;
}
