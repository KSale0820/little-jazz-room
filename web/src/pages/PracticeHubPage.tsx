import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import './PracticeHubPage.css';

type QuickTool = 'tuner' | 'metronome';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { catId, sessions, routines, setActiveRoutineId } = useApp();
  const [preview, setPreview] = useState<QuickTool | null>(null);
  const latestSession = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
  const recentRoutine = latestSession?.routineId
    ? routines.find(routine => routine.id === latestSession.routineId)
    : null;

  const startFreePractice = () => {
    setActiveRoutineId(null);
    navigate('/player');
  };

  const resumePractice = () => {
    if (!latestSession) return;
    setActiveRoutineId(recentRoutine?.id ?? null);
    navigate('/player');
  };

  return (
    <section className="p01-page" aria-label="Practice hub">
      <div className="p01-botanical p01-botanical-left" aria-hidden="true" />
      <div className="p01-botanical p01-botanical-right" aria-hidden="true" />

      <header className="p01-header">
        <p className="p01-greeting">Good morning,</p>
        <h1>Let&apos;s Practice</h1>
        <p className="p01-intro">Choose how you want to practice today.</p>
      </header>

      <div className="p01-paths" aria-label="Choose a practice mode">
        <button type="button" className="p01-path p01-path-free" onClick={startFreePractice}>
          <span className="p01-path-art p01-path-art-record" aria-hidden="true">
            <img src={VISUAL_ASSETS.vignettes.practice} alt="" />
          </span>
          <span className="p01-path-text">
            <strong>Free Practice</strong>
            <span>Pick a track and start playing.</span>
          </span>
          <span className="p01-chevron" aria-hidden="true">›</span>
        </button>

        <button type="button" className="p01-path p01-path-guided" onClick={() => navigate('/routines')}>
          <span className="p01-path-art p01-path-art-score" aria-hidden="true">
            <img src={VISUAL_ASSETS.vignettes.practice} alt="" />
          </span>
          <span className="p01-path-text">
            <strong>Guided Practice</strong>
            <span>Follow a routine with step by step exercises.</span>
          </span>
          <span className="p01-chevron" aria-hidden="true">›</span>
        </button>
      </div>

      <section className="p01-tools" aria-labelledby="p01-tools-heading">
        <h2 id="p01-tools-heading">Quick Tools</h2>
        <div className="p01-tool-grid">
          <button type="button" className="p01-tool" onClick={() => setPreview('tuner')}>
            <span className="p01-tuning-fork" aria-hidden="true" />
            <strong>Tuner</strong>
            <small>Check your pitch.</small>
          </button>
          <button type="button" className="p01-tool" onClick={() => setPreview('metronome')}>
            <span className="p01-metronome-symbol" style={{
              WebkitMaskImage: `url("${VISUAL_ASSETS.icons.metronome}")`,
              maskImage: `url("${VISUAL_ASSETS.icons.metronome}")`,
            }} aria-hidden="true" />
            <strong>Metronome</strong>
            <small>Keep steady time.</small>
          </button>
          <button type="button" className="p01-tool" onClick={resumePractice} disabled={!latestSession}>
            <span className="p01-resume-symbol" aria-hidden="true">♫</span>
            <strong>Resume</strong>
            <small>{latestSession ? 'Continue your last session.' : 'No session yet.'}</small>
          </button>
        </div>
        {preview ? (
          <div className="p01-preview" role="status">
            <span><strong>{preview === 'tuner' ? 'Tuner' : 'Metronome'} preview</strong> · {preview === 'tuner' ? 'Microphone tuning is coming soon.' : 'Beat controls are coming soon.'}</span>
            <button type="button" onClick={() => setPreview(null)} aria-label="Dismiss tool preview">Close</button>
          </div>
        ) : null}
      </section>

      <section className="p01-recent" aria-labelledby="p01-recent-heading">
        <div className="p01-recent-header">
          <h2 id="p01-recent-heading">Recently Played</h2>
          <button type="button" className="p01-see-all" onClick={() => navigate('/progress')}>See All <span aria-hidden="true">›</span></button>
        </div>
        {latestSession ? (
          <button type="button" className="p01-recent-track" onClick={resumePractice}>
            <span className="p01-recent-image"><img src={VISUAL_ASSETS.vignettes.practice} alt="" /></span>
            <span className="p01-recent-copy">
              <strong>{recentRoutine?.title ?? 'Free Practice'}</strong>
              <span>{Math.max(1, Math.round(latestSession.durationSeconds / 60))} min · Last session</span>
            </span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
        ) : (
          <button type="button" className="p01-recent-track" onClick={startFreePractice}>
            <span className="p01-recent-image"><img src={VISUAL_ASSETS.vignettes.practice} alt="" /></span>
            <span className="p01-recent-copy">
              <strong>Start your first session</strong>
              <span>Your recent practice will appear here.</span>
            </span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
        )}
      </section>

      <div className="p01-footer-decoration" aria-hidden="true">
        <img className="p01-footer-plant" src={VISUAL_ASSETS.approvedDecor.plant} alt="" />
        <img className="p01-sleeping-cat" src={VISUAL_ASSETS.cat.sleepingFile(catId)} alt="" />
      </div>
    </section>
  );
}
