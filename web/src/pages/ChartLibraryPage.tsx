import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { createChartRepository, newLocalChartId } from '../features/charts/chartRepository';
import type { Chart } from '../types/content';
import './ChartBuilderPage.css';
import './CleanPixelCharts.css';
import './BuilderStudio.css';

export function ChartLibraryPage() {
  const { repo, charts, exercises, routines, refreshLocal, setActiveRoutineId } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const chartRepo = useMemo(() => createChartRepository(repo.scope), [repo.scope]);
  const filtered = charts.filter(chart => chart.title.toLowerCase().includes(query.toLowerCase().trim()));
  const mine = filtered.filter(chart => chart.is_custom);
  const builtIns = filtered.filter(chart => !chart.is_custom);

  const duplicate = (chart: Chart) => {
    try {
      const now = new Date().toISOString();
      const copy: Chart = { ...chart, id: newLocalChartId(), title: chart.title + ' (copy)',
        is_custom: true, created_at: now, updated_at: now,
        bars: chart.bars.map(bar => ({ ...bar, events: bar.events.map(event => ({ ...event })) })) };
      chartRepo.saveChart(copy);
      refreshLocal();
      navigate('/charts/' + encodeURIComponent(copy.id) + '/edit');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not make a copy.');
    }
  };

  const remove = (chart: Chart) => {
    if (!window.confirm('Delete “' + chart.title + '”? This cannot be undone.')) return;
    try {
      chartRepo.deleteChart(chart.id, exercises, routines);
      refreshLocal();
      setNotice('Chart deleted.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to delete chart.');
    }
  };

  const renderChart = (chart: Chart) => (
    <article key={chart.id} className="chart-library-card">
      <div className="chart-library-card-main">
        <span className="chart-library-card-icon" aria-hidden="true">▤</span>
        <div className="chart-library-card-copy">
          <h3>{chart.title}</h3>
          <p>{chart.concert_key.replace(/b/g, '♭')} · {chart.time_signature.join('/')} · {chart.bars.length} measures</p>
        </div>
        <details className="chart-library-menu">
          <summary aria-label={'Actions for ' + chart.title} title="Chart actions">•••</summary>
          <div className="chart-library-actions">
            <button type="button" onClick={() => { setActiveRoutineId(null); navigate('/player?chart=' + encodeURIComponent(chart.id)); }}>Practice</button>
            {chart.is_custom && <button type="button" onClick={() => navigate('/charts/' + encodeURIComponent(chart.id) + '/edit')}>Edit</button>}
            <button type="button" onClick={() => duplicate(chart)}>{chart.is_custom ? 'Duplicate' : 'Edit a copy'}</button>
            {chart.is_custom && <button type="button" className="chart-library-delete" onClick={() => remove(chart)}>Delete</button>}
          </div>
        </details>
      </div>
      {chart.style_instruction && <p className="chart-library-instruction">{chart.style_instruction}</p>}
    </article>
  );

  return (
    <section className="chart-builder-page chart-library-page" aria-label="My Charts">
      <header className="chart-builder-header">
        <div className="builder-library-heading">
          <button type="button" className="builder-library-back" aria-label="Back to Tracks" onClick={() => navigate('/tracks')}>‹</button>
          <h1 aria-label="My Charts">Chart Builder</h1>
        </div>
      </header>
      <button type="button" className="chart-builder-primary chart-library-create" onClick={() => navigate('/charts/new')}><span aria-hidden="true">＋</span> New Chart</button>
      <label className="chart-builder-field">
        <span className="builder-studio-visually-hidden">Search charts</span>
        <input type="search" value={query} placeholder="Search charts…" onChange={e => setQuery(e.target.value)} />
      </label>
      {notice && <p role="status" className="chart-builder-notice">{notice}</p>}
      <p className="builder-library-subtitle">Create, edit, and organize chord charts for your practice, routines, and exercises.</p>
      <h2 className="chart-builder-section-title">Your charts <span>{mine.length}</span></h2>
      {mine.length ? mine.map(renderChart) : <p className="chart-library-empty">Your own charts will appear here. Create one to get started.</p>}
      <h2 className="chart-builder-section-title">Built-in charts <span>{builtIns.length}</span></h2>
      <p className="chart-builder-caption">Built-in charts are read-only. Choose Edit a copy to make your own version.</p>
      {builtIns.map(renderChart)}
      {!filtered.length && <p className="chart-library-empty">No charts match that search.</p>}
    </section>
  );
}
