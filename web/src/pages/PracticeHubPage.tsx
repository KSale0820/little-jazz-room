import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import './DemoPages.css';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { setActiveRoutineId, routines } = useApp();
  const latest = routines.find(r => r.id === 'daily-warm-up') ?? routines[0];
  return (
    <section className="demo-page" aria-label="Practice hub">
      <header className="demo-header"><div><p className="demo-eyebrow">Find your rhythm</p><h1 className="demo-heading">Let's Practice</h1><p className="demo-subtitle">Choose how you want to practice today.</p></div></header>
      <button type="button" className="demo-card demo-card-peach" onClick={() => { setActiveRoutineId(null); navigate('/player'); }}>
        <img className="demo-card-image" src={VISUAL_ASSETS.approvedDecor.metronome} alt="" />
        <span className="demo-card-copy"><span className="demo-card-title">Free Practice</span><span className="demo-card-desc">Pick a chart and start your timer.</span></span>
        <span className="demo-chevron" aria-hidden="true">›</span>
      </button>
      <button type="button" className="demo-card demo-card-tint" onClick={() => navigate('/routines')}>
        <img className="demo-card-image" src={VISUAL_ASSETS.approvedDecor.books} alt="" />
        <span className="demo-card-copy"><span className="demo-card-title">Guided Practice</span><span className="demo-card-desc">Follow an ordered routine step by step.</span></span>
        <span className="demo-chevron" aria-hidden="true">›</span>
      </button>
      <h2 className="demo-section-title">Quick tools</h2>
      <div className="demo-stats">
        <div className="demo-stat"><strong style={{fontSize:18}}>Tuner</strong><span>Microphone · Preview</span></div>
        <div className="demo-stat"><strong style={{fontSize:18}}>Metronome</strong><span>Beat controls · Preview</span></div>
      </div>
      {latest ? <>
        <h2 className="demo-section-title">Ready for a warm-up?</h2>
        <button type="button" className="demo-row" onClick={() => { setActiveRoutineId(latest.id); navigate('/player'); }}>
          <span><span className="demo-row-title">{latest.title}</span><span className="demo-row-meta">{latest.duration_minutes} min · {latest.steps.length} steps</span></span><span aria-hidden="true">›</span>
        </button>
      </> : null}
    </section>
  );
}
