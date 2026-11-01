import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import './PracticeHubPage.css';

type QuickTool = 'tuner' | 'metronome';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { setActiveRoutineId, routines } = useApp();
  const [preview, setPreview] = useState<QuickTool | null>(null);
  const latest = routines.find(routine => routine.id === 'daily-warm-up') ?? routines[0];

  const startFreePractice = () => {
    setActiveRoutineId(null);
    navigate('/player');
  };

  const startWarmUp = () => {
    if (!latest) return;
    setActiveRoutineId(latest.id);
    navigate('/player');
  };

  return (
    <section className="p01-page" aria-label="Practice hub">
      <header className="p01-header">
        <p className="p01-eyebrow">A little music, every day</p>
        <h1>Let&apos;s Practice</h1>
        <p className="p01-intro">Choose how you want to practice today.</p>
      </header>

      <div className="p01-illustration" aria-hidden="true">
        <img src={VISUAL_ASSETS.vignettes.practice} alt="" />
      </div>

      <div className="p01-paths" aria-label="Choose a practice mode">
        <button type="button" className="p01-path p01-path-free" onClick={startFreePractice}>
          <span className="p01-path-art" aria-hidden="true">
            <img src={VISUAL_ASSETS.approvedDecor.metronome} alt="" />
          </span>
          <span className="p01-path-text">
            <strong>Free Practice</strong>
            <span>Pick a chart and play at your own pace.</span>
          </span>
          <span className="p01-path-arrow" aria-hidden="true">›</span>
        </button>

        <button type="button" className="p01-path p01-path-guided" onClick={() => navigate('/routines')}>
          <span className="p01-path-art" aria-hidden="true">
            <img src={VISUAL_ASSETS.approvedDecor.books} alt="" />
          </span>
          <span className="p01-path-text">
            <strong>Guided Practice</strong>
            <span>Follow a routine, one step at a time.</span>
          </span>
          <span className="p01-path-arrow" aria-hidden="true">›</span>
        </button>
      </div>

      <section className="p01-tools" aria-labelledby="p01-tools-heading">
        <h2 id="p01-tools-heading">Quick tools</h2>
        <div className="p01-tool-grid">
          <button type="button" className="p01-tool" onClick={() => setPreview('tuner')} aria-label="Tuner preview">
            <span className="p01-tool-symbol" aria-hidden="true"><span className="p01-tuning-fork" /></span>
            <span className="p01-tool-copy"><strong>Tuner</strong><small>Preview</small></span>
          </button>
          <button type="button" className="p01-tool" onClick={() => setPreview('metronome')} aria-label="Metronome preview">
            <span className="p01-tool-symbol" aria-hidden="true">
              <span className="p01-metronome-symbol" style={{ WebkitMaskImage: `url("${VISUAL_ASSETS.icons.metronome}")`, maskImage: `url("${VISUAL_ASSETS.icons.metronome}")` }} />
            </span>
            <span className="p01-tool-copy"><strong>Metronome</strong><small>Preview</small></span>
          </button>
        </div>
        {preview ? (
          <div className="p01-preview" role="status">
            <span><strong>{preview === 'tuner' ? 'Tuner' : 'Metronome'} preview</strong> · {preview === 'tuner' ? 'Microphone tuning is coming soon.' : 'Beat controls are coming soon.'}</span>
            <button type="button" onClick={() => setPreview(null)} aria-label="Dismiss tool preview">Close</button>
          </div>
        ) : null}
      </section>

      {latest ? (
        <section className="p01-resume" aria-labelledby="p01-resume-heading">
          <h2 id="p01-resume-heading">Ready for a warm-up?</h2>
          <button type="button" className="p01-routine" onClick={startWarmUp}>
            <span className="p01-routine-mark" aria-hidden="true">♪</span>
            <span className="p01-routine-text">
              <strong>{latest.title}</strong>
              <small>{latest.duration_minutes} min · {latest.steps.length} steps</small>
            </span>
            <span className="p01-routine-arrow" aria-hidden="true">›</span>
          </button>
        </section>
      ) : null}
    </section>
  );
}
