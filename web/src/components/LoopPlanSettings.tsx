import { useEffect, useRef, useState } from 'react';
import type { LoopSection } from '../lib/practiceChartClock';

interface Props {
  totalBars: number;
  enabled: boolean;
  sections: LoopSection[];
  repeatPlan: boolean;
  onApply: (enabled: boolean, sections: LoopSection[], repeatPlan: boolean) => void;
  onClose: () => void;
}

type StepperProps = {
  title: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min: number;
  max: number;
};

function Stepper({ title, value, onDecrease, onIncrease, min, max }: StepperProps) {
  return (
    <div className="practice-loop-range-stepper" role="group" aria-label={title}>
      <span>{title}</span>
      <div>
        <button type="button" aria-label={'Decrease ' + title.toLowerCase()} disabled={value <= min} onClick={onDecrease}>−</button>
        <output aria-label={title}>{value}</output>
        <button type="button" aria-label={'Increase ' + title.toLowerCase()} disabled={value >= max} onClick={onIncrease}>+</button>
      </div>
    </div>
  );
}

/** Draft edits are only applied when the user explicitly saves the repeat plan. */
export function LoopPlanSettings({ totalBars, enabled, sections, repeatPlan, onApply, onClose }: Props) {
  const [draftEnabled, setDraftEnabled] = useState(enabled);
  const [draftSections, setDraftSections] = useState<LoopSection[]>(sections.map(section => ({ ...section })));
  const [draftRepeatPlan, setDraftRepeatPlan] = useState(repeatPlan);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>('.practice-loop-close')?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  function updateSection(index: number, patch: Partial<LoopSection>) {
    setDraftSections(previous => previous.map((section, i) => i === index ? { ...section, ...patch } : section));
  }

  function addSection() {
    const previous = draftSections[draftSections.length - 1];
    const startBar = previous && previous.endBar < totalBars ? previous.endBar + 1 : 1;
    setDraftSections(items => [...items, { startBar, endBar: Math.min(totalBars, startBar + 3), plays: 2 }]);
    setDraftEnabled(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])];
    if (!controls.length) return;
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault(); controls[controls.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
      event.preventDefault(); controls[0].focus();
    }
  }

  const summary = !draftEnabled
    ? 'Full chart, once'
    : draftSections.length
      ? draftSections.map(item => 'Bars ' + item.startBar + '–' + item.endBar + ' ×' + item.plays).join(' → ')
      : 'No sections yet';

  return (
    <div className="practice-loop-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} className="practice-loop-sheet" role="dialog" aria-modal="true"
        aria-labelledby="practice-loop-heading" onKeyDown={handleKeyDown}>
        <header>
          <div><span className="practice-loop-eyebrow">CHART PRACTICE</span><h2 id="practice-loop-heading">Set up looping</h2></div>
          <button type="button" className="practice-loop-close" aria-label="Close loop settings" onClick={onClose}>×</button>
        </header>
        <p className="practice-loop-intro">Choose which sections to practice and how many times to play each one.</p>

        <div className="practice-loop-mode" role="group" aria-label="Looping mode">
          <button type="button" aria-pressed={!draftEnabled} className={!draftEnabled ? 'active' : undefined}
            onClick={() => setDraftEnabled(false)}>
            <strong>No looping</strong><span>Play chart once</span>
          </button>
          <button type="button" aria-pressed={draftEnabled} className={draftEnabled ? 'active' : undefined}
            onClick={() => setDraftEnabled(true)}>
            <strong>Repeat sections</strong><span>Custom practice plan</span>
          </button>
        </div>

        {draftEnabled ? (
          <section className="practice-loop-section" aria-label="Repeat sections">
            <div className="practice-loop-section-heading"><h3>Sections to play</h3><span>{draftSections.length} section{draftSections.length === 1 ? '' : 's'}</span></div>
            <p className="practice-loop-help">Sections play in this order. A count of 1 means play once.</p>
            <div className="practice-loop-cards">
              {draftSections.map((section, index) => (
                <section key={index} className="practice-loop-card" aria-label={'Section ' + (index + 1)}>
                  <header>
                    <strong>Section {index + 1}</strong>
                    <button type="button" aria-label={'Remove section ' + (index + 1)}
                      onClick={() => setDraftSections(items => items.filter((_, i) => i !== index))}>Remove</button>
                  </header>
                  <div className="practice-loop-custom-fields">
                    <Stepper title={'Section ' + (index + 1) + ' start bar'} value={section.startBar}
                      min={1} max={section.endBar}
                      onDecrease={() => updateSection(index, { startBar: section.startBar - 1 })}
                      onIncrease={() => updateSection(index, { startBar: section.startBar + 1 })} />
                    <Stepper title={'Section ' + (index + 1) + ' end bar'} value={section.endBar}
                      min={section.startBar} max={totalBars}
                      onDecrease={() => updateSection(index, { endBar: section.endBar - 1 })}
                      onIncrease={() => updateSection(index, { endBar: section.endBar + 1 })} />
                  </div>
                  <div className="practice-loop-repeat-row">
                    <Stepper title={'Section ' + (index + 1) + ' play count'} value={section.plays}
                      min={1} max={32}
                      onDecrease={() => updateSection(index, { plays: section.plays - 1 })}
                      onIncrease={() => updateSection(index, { plays: section.plays + 1 })} />
                    <span>{section.plays === 1 ? 'Play once' : 'Play ' + section.plays + ' times'}</span>
                  </div>
                </section>
              ))}
              {!draftSections.length && <p className="practice-loop-empty">No sections added. Add a section below or choose No looping.</p>}
            </div>
            <button type="button" className="practice-loop-add" onClick={addSection}>+ Add section</button>
            <button type="button" className="practice-loop-repeat-program" aria-pressed={draftRepeatPlan}
              onClick={() => setDraftRepeatPlan(value => !value)}>
              <span aria-hidden="true">{draftRepeatPlan ? '☑' : '□'}</span>
              <span><strong>Repeat whole plan</strong><small>{draftRepeatPlan ? 'Start over after the last section' : 'Stop at the end of the last section'}</small></span>
            </button>
          </section>
        ) : <p className="practice-loop-off-description">The chart will play from beginning to end once. The practice timer stays independent.</p>}

        <footer className="practice-loop-footer">
          <div aria-live="polite" className="practice-loop-current"><strong>Plan:</strong> {summary}</div>
          <button type="button" className="practice-loop-apply" disabled={draftEnabled && draftSections.length === 0}
            onClick={() => onApply(draftEnabled, draftSections, draftRepeatPlan)}>Apply plan</button>
        </footer>
      </div>
    </div>
  );
}
