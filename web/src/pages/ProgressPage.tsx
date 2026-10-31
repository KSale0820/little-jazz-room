import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import { computeGentleStreak } from '../lib/practiceStats';
import './DemoPages.css';

export function ProgressPage() {
  const { sessions, catId, routines, setActiveRoutineId } = useApp();
  const navigate = useNavigate();
  const cat = JAZZ_CATS.find(c => c.id === catId);
  const totalMinutes = sessions.reduce((sum, session) => sum + Math.floor(session.durationSeconds / 60), 0);
  const thisWeek = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return sessions.filter(s => new Date(s.finishedAt) >= start).reduce((sum, s) => sum + Math.floor(s.durationSeconds / 60), 0);
  }, [sessions]);
  const streak = computeGentleStreak(sessions);
  return (
    <section className="demo-page" aria-label="Progress">
      <header className="demo-header"><div><p className="demo-eyebrow">Your little victories</p><h1 className="demo-heading">Progress</h1></div><button type="button" className="demo-link" onClick={() => navigate('/profile')}>Settings ⚙</button></header>
      <div className="demo-cat-art">
        <div><h2 className="demo-card-title">{cat?.name ?? 'Your companion'}</h2><p className="demo-subtitle">Great progress this week!</p><button className="demo-link" style={{marginTop:12}} type="button" onClick={() => navigate('/profile', {state:{scrollToCat:true}})}>Change</button></div>
        <CatSprite catId={catId} variant="portrait" size={140} />
      </div>
      <div className="demo-stats">
        <div className="demo-stat"><strong>{streak}</strong><span>day streak</span></div>
        <div className="demo-stat"><strong>{thisWeek}</strong><span>minutes this week</span></div>
      </div>
      <div className="demo-stat"><strong>{totalMinutes}</strong><span>total recorded practice minutes on this device</span></div>
      <h2 className="demo-section-title">Recent sessions</h2>
      <ul className="demo-history">
        {[...sessions].sort((a,b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0,8).map(session => {
          const routine = routines.find(r => r.id === session.routineId);
          return <li key={session.id}><strong>{routine?.title ?? 'Free practice'}</strong><small>{new Date(session.finishedAt).toLocaleDateString()} · {Math.floor(session.durationSeconds / 60)} min {session.durationSeconds % 60 ? session.durationSeconds % 60 + ' sec' : ''}</small></li>;
        })}
        {sessions.length === 0 ? <li>Nothing logged yet. Your first practice will appear here.</li> : null}
      </ul>
      <button type="button" className="demo-primary" style={{marginTop:18}} onClick={() => { setActiveRoutineId('daily-warm-up'); navigate('/player'); }}>Practice Again</button>
    </section>
  );
}
