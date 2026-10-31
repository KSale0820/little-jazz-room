import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './DemoPages.css';

type RoutineTab = 'Presets' | 'My Routines' | 'Community';

export function RoutineLibraryPage() {
  const navigate = useNavigate();
  const { routines, setActiveRoutineId } = useApp();
  const [tab, setTab] = useState<RoutineTab>('Presets');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => routines.filter(r => {
    if (tab === 'Presets' && r.is_seed === false) return false;
    if (tab === 'My Routines' && r.is_seed !== false) return false;
    if (tab === 'Community') return false;
    return r.title.toLowerCase().includes(query.toLowerCase());
  }), [routines, tab, query]);

  return (
    <section className="demo-page" aria-label="Routine library">
      <header className="demo-header"><div><p className="demo-eyebrow">Practice your way</p><h1 className="demo-heading">Practice Routines</h1><p className="demo-subtitle">A little structure for the music you love.</p></div></header>
      <div className="demo-filter-group" role="group" aria-label="Routine category">
        {(['Presets', 'My Routines', 'Community'] as const).map(value => <button type="button" className="demo-filter" key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}
      </div>
      <input className="demo-search" aria-label="Search routines" placeholder="Search routines..." value={query} onChange={event => setQuery(event.target.value)} />
      {tab === 'Community' ? <p className="demo-subtitle">Community publishing and ratings are Preview. Routines you save on this device appear under My Routines.</p> : null}
      {shown.map(routine => (
        <button type="button" key={routine.id} className="demo-row" onClick={() => { setActiveRoutineId(routine.id); navigate('/player'); }}>
          <span><span className="demo-row-title">{routine.title}</span><span className="demo-row-meta">{routine.steps.length} exercises · {routine.duration_minutes} min · {routine.level}</span></span><span aria-hidden="true">›</span>
        </button>
      ))}
      {tab !== 'Community' && shown.length === 0 ? <p className="demo-subtitle">No routines yet in this category.</p> : null}
      <button type="button" className="demo-primary" style={{marginTop:18}} onClick={() => navigate('/create')}>+ Create routine</button>
      <p className="demo-subtitle" style={{textAlign:'center',marginTop:12}}>Your routines stay on this device for the class demo.</p>
    </section>
  );
}
