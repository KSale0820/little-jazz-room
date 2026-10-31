import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './DemoPages.css';

export function TracksPage() {
  const { charts, setActiveRoutineId } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Blues' | 'Other'>('All');
  const filtered = useMemo(() => charts.filter(chart => {
    const match = chart.title.toLowerCase().includes(query.toLowerCase());
    const isBlues = chart.title.toLowerCase().includes('blues');
    return match && (filter === 'All' || (filter === 'Blues' ? isBlues : !isBlues));
  }), [charts, query, filter]);

  return (
    <section className="demo-page" aria-label="Tracks">
      <header className="demo-header">
        <div><p className="demo-eyebrow">The listening room</p><h1 className="demo-heading">Tracks</h1></div>
        <button type="button" className="demo-link" onClick={() => navigate('/charts')}>Charts ›</button>
      </header>
      <input className="demo-search" aria-label="Search tracks and charts" placeholder="Search tracks, styles, keys..." value={query} onChange={event => setQuery(event.target.value)} />
      <div className="demo-filter-group" aria-label="Chart categories">
        {(['All', 'Blues', 'Other'] as const).map(value => (
          <button type="button" key={value} className="demo-filter" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'All' ? 'Recent' : value === 'Other' ? 'Original studies' : value}</button>
        ))}
      </div>
      <h2 className="demo-section-title">Pick up a tune</h2>
      <p className="demo-subtitle" style={{marginBottom:12}}>Original harmony studies. Recorded backing tracks are Preview.</p>
      {filtered.map(chart => (
        <button type="button" key={chart.id} className="demo-row" onClick={() => { setActiveRoutineId(null); navigate('/player?chart=' + encodeURIComponent(chart.id)); }}>
          <span><span className="demo-row-title">{chart.title}</span><span className="demo-row-meta">{chart.bars.length} bars · Key {chart.concert_key} · Chart available · Audio Preview</span></span>
          <span aria-hidden="true">›</span>
        </button>
      ))}
      {!filtered.length ? <p className="demo-subtitle">No matching studies. Try a different search.</p> : null}
    </section>
  );
}
