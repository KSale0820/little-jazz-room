import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './DemoPages.css';
import './TracksPage.css';

type Category = 'Recent' | 'Favorites' | 'Standards' | 'Blues' | 'Original studies';
type FilterField = 'instrument' | 'style' | 'key' | 'difficulty';
type TrackFilter = { instrument: string; style: string; key: string; difficulty: string; chartOnly: boolean };
const EMPTY_FILTER: TrackFilter = { instrument: 'All', style: 'All', key: 'All', difficulty: 'All', chartOnly: false };
const FAVORITE_PREFIX = 'little-jazz-room:track-favorites:v1:';

type TrackPreview = {
  id: string;
  chartId: string;
  title: string;
  subtitle: string;
  style: string;
  key: string;
  bpm: number | null;
  difficulty: string;
  instruments: string[];
  blues: boolean;
};

// UI-only original-track previews. The linked seed charts remain authoritative
// for notation, and no recorded audio is claimed or played.
const TRACK_PREVIEWS: TrackPreview[] = [
  { id: 'after-hours', chartId: 'blues-f-12', title: 'After-Hours Blues', subtitle: 'Medium swing · 12-bar blues', style: 'Swing', key: 'F', bpm: 92, difficulty: 'Beginner', instruments: ['Piano', 'Guitar', 'Bass', 'Drums', 'Trumpet', 'Tenor Saxophone'], blues: true },
  { id: 'moonlit', chartId: 'rhythm-bb-32', title: 'Moonlit Changes', subtitle: 'Ballad · ii–V–I study', style: 'Ballad', key: 'B♭', bpm: 72, difficulty: 'Intermediate', instruments: ['Piano', 'Guitar', 'Bass', 'Trumpet', 'Tenor Saxophone'], blues: false },
  { id: 'staircase', chartId: 'ballad-eb-16', title: 'Blue Staircase', subtitle: 'Bebop · original study', style: 'Bebop', key: 'E♭', bpm: 124, difficulty: 'Intermediate', instruments: ['Piano', 'Guitar', 'Bass', 'Alto Saxophone', 'Tenor Saxophone'], blues: false },
  { id: 'sunday', chartId: 'minor-bossa-cm-16', title: 'Sunday Walk', subtitle: 'Easy bossa · original study', style: 'Bossa', key: 'C minor', bpm: null, difficulty: 'Beginner', instruments: ['Piano', 'Guitar', 'Bass', 'Drums'], blues: false },
];

const CATEGORIES: Category[] = ['Recent', 'Favorites', 'Standards', 'Blues', 'Original studies'];
const FIELDS: { key: FilterField; title: string; options: string[] }[] = [
  { key: 'instrument', title: 'Instrument', options: ['All', 'Piano', 'Guitar', 'Bass', 'Drums', 'Trumpet', 'Alto Saxophone', 'Tenor Saxophone'] },
  { key: 'style', title: 'Style', options: ['All', 'Swing', 'Ballad', 'Bebop', 'Bossa'] },
  { key: 'key', title: 'Key', options: ['All', 'F', 'B♭', 'E♭', 'C minor'] },
  { key: 'difficulty', title: 'Difficulty', options: ['All', 'Beginner', 'Intermediate'] },
];

function TrackIcon({ name, filled = false }: { name: 'book' | 'chevron' | 'star' | 'filter' | 'search' | 'unavailable' | 'down' | 'close'; filled?: boolean }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (name === 'book') return <svg {...common}><path d="M12 5.4c-2.7-1.6-5.6-1.6-9-1v13.7c3.4-.7 6.3-.6 9 1.1 2.7-1.7 5.6-1.8 9-1.1V4.4c-3.4-.6-6.3-.6-9 1Z" /><path d="M12 5.4v13.8" /></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
  if (name === 'star') return <svg {...common} fill={filled ? 'currentColor' : 'none'}><path d="m12 2.5 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1Z" /></svg>;
  if (name === 'filter') return <svg {...common}><path d="M3 6h18M7 12h10m-7 6h4" /></svg>;
  if (name === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (name === 'unavailable') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6 18.4 18.4" /></svg>;
  if (name === 'down') return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  return <svg {...common}><path d="M5 5 19 19M19 5 5 19" /></svg>;
}

function readFavorites(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '["after-hours"]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function TracksPage() {
  const { charts, setActiveRoutineId } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCharts = useLocation().pathname === '/charts';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Recent');
  const [chartFilter, setChartFilter] = useState<'All' | 'Blues' | 'Other'>('All');
  const [applied, setApplied] = useState<TrackFilter>({ ...EMPTY_FILTER });
  const [draft, setDraft] = useState<TrackFilter>({ ...EMPTY_FILTER });
  const [filterOpen, setFilterOpen] = useState(false);
  const [focusField, setFocusField] = useState<FilterField | null>(null);
  const favoritesKey = FAVORITE_PREFIX + (user?.id ?? 'local');
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(favoritesKey));

  useEffect(() => { setFavorites(readFavorites(favoritesKey)); }, [favoritesKey]);
  useEffect(() => {
    if (!filterOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setFilterOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [filterOpen]);

  const chartResults = useMemo(() => charts.filter(chart => {
    const match = chart.title.toLowerCase().includes(query.trim().toLowerCase());
    const isBlues = chart.title.toLowerCase().includes('blues');
    return match && (chartFilter === 'All' || (chartFilter === 'Blues' ? isBlues : !isBlues));
  }), [charts, query, chartFilter]);

  const catalog = useMemo(() => TRACK_PREVIEWS.flatMap(track => {
    const chart = charts.find(candidate => candidate.id === track.chartId);
    return chart ? [{ ...track, chart }] : [];
  }), [charts]);
  const filtered = useMemo(() => catalog.filter(track => {
    const term = query.trim().toLowerCase();
    if (term && ![track.title, track.subtitle, track.style, track.key, track.chart.title].some(value => value.toLowerCase().includes(term))) return false;
    if (category === 'Favorites' && !favorites.includes(track.id)) return false;
    if (category === 'Standards') return false; // All four approved previews are original studies.
    if (category === 'Blues' && !track.blues) return false;
    if (applied.instrument !== 'All' && !track.instruments.includes(applied.instrument)) return false;
    if (applied.style !== 'All' && track.style !== applied.style) return false;
    if (applied.key !== 'All' && track.key !== applied.key) return false;
    if (applied.difficulty !== 'All' && track.difficulty !== applied.difficulty) return false;
    return true; // All four entries have a real linked seed chart.
  }), [catalog, query, category, favorites, applied]);
  const activeFilterCount = Object.entries(applied).filter(([key, value]) => key !== 'chartOnly' && value !== 'All').length + (applied.chartOnly ? 1 : 0);

  const openFilters = (field: FilterField | null = null) => {
    setDraft({ ...applied });
    setFocusField(field);
    setFilterOpen(true);
  };
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem(favoritesKey, JSON.stringify(next)); } catch { /* Local storage is optional. */ }
  };
  const openChart = (id: string) => {
    setActiveRoutineId(null);
    navigate('/player?chart=' + encodeURIComponent(id));
  };
  const reset = () => {
    setCategory('Recent');
    setQuery('');
    setApplied({ ...EMPTY_FILTER });
    setDraft({ ...EMPTY_FILTER });
  };

  if (isCharts) {
    return (
      <section className="demo-page" aria-label="Charts">
        <header className="demo-header">
          <div><p className="demo-eyebrow">The songbook</p><h1 className="demo-heading">Charts</h1></div>
          <button type="button" className="demo-link" onClick={() => navigate('/tracks')}>Tracks ›</button>
        </header>
        <input className="demo-search" aria-label="Search tracks and charts" placeholder="Search tracks, styles, keys..." value={query} onChange={event => setQuery(event.target.value)} />
        <div className="demo-filter-group" aria-label="Chart categories">
          {(['All', 'Blues', 'Other'] as const).map(value => (
            <button type="button" key={value} className="demo-filter" aria-pressed={chartFilter === value} onClick={() => setChartFilter(value)}>{value === 'All' ? 'Recent' : value === 'Other' ? 'Original studies' : value}</button>
          ))}
        </div>
        <h2 className="demo-section-title">Jazz harmony studies</h2>
        <p className="demo-subtitle" style={{ marginBottom: 12 }}>Choose a chart to open a readable measure grid.</p>
        {chartResults.map(chart => (
          <button type="button" key={chart.id} className="demo-row" onClick={() => openChart(chart.id)}>
            <span><span className="demo-row-title">{chart.title}</span><span className="demo-row-meta">{chart.bars.length} bars · Key {chart.concert_key} · Open chord chart</span></span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
        {!chartResults.length && <p className="demo-subtitle">No matching studies. Try a different search.</p>}
      </section>
    );
  }

  return (
    <section className="t01-page" aria-label="Tracks Library">
      <header className="t01-header">
        <div>
          <p className="t01-eyebrow">THE LISTENING ROOM</p>
          <h1 className="t01-title">Tracks</h1>
        </div>
        <button className="t01-charts-link" type="button" onClick={() => navigate('/charts')}>
          <TrackIcon name="book" /> <span>Charts</span> <TrackIcon name="chevron" />
        </button>
      </header>

      <div className="t01-search-wrap">
        <TrackIcon name="search" />
        <input aria-label="Search tracks" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tracks, styles, keys..." />
        {query && <button type="button" className="t01-search-clear" aria-label="Clear search" onClick={() => setQuery('')}><TrackIcon name="close" /></button>}
      </div>

      <div className="t01-categories" aria-label="Track categories">
        {CATEGORIES.map(value => (
          <button key={value} type="button" className="t01-category" aria-pressed={category === value} onClick={() => setCategory(value)}>
            {value === 'Favorites' && <TrackIcon name="star" />}
            {value}
          </button>
        ))}
      </div>

      <div className="t01-filter-actions">
        <button type="button" className="t01-filter-primary" onClick={() => openFilters()} aria-haspopup="dialog">
          <TrackIcon name="filter" /> Filters {activeFilterCount > 0 && <span className="t01-filter-count">{activeFilterCount}</span>}
        </button>
        <button type="button" className="t01-filter-quick" onClick={() => openFilters('instrument')} aria-haspopup="dialog">
          Instrument <TrackIcon name="down" />
        </button>
        <button type="button" className="t01-filter-quick" onClick={() => openFilters('difficulty')} aria-haspopup="dialog">
          Difficulty <TrackIcon name="down" />
        </button>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="t01-section-header">
            <h2>Pick up a tune</h2>
            <span>{filtered.length} original {filtered.length === 1 ? 'study' : 'studies'}</span>
          </div>
          <div className="t01-track-list">
            {filtered.map(track => {
              const isFavorite = favorites.includes(track.id);
              return (
                <article className="t01-track-card" key={track.id}>
                  <button type="button" className="t01-card-open" aria-label={'Practice ' + track.title + ' with its linked chart'} onClick={() => openChart(track.chart.id)}>
                    <span className="t01-card-title">{track.title}</span>
                    <span className="t01-card-subtitle">{track.subtitle}</span>
                    <span className="t01-card-footer">
                      <span className="t01-status t01-audio"><TrackIcon name="unavailable" /> Audio pending</span>
                      <span className="t01-status t01-chart"><TrackIcon name="book" /> Chart</span>
                      <span className="t01-card-spacer" />
                      <span className="t01-card-tempo">{track.bpm === null ? '' : track.bpm + ' BPM · '}{track.key}</span>
                      <TrackIcon name="chevron" />
                    </span>
                  </button>
                  <button type="button" className={'t01-favorite' + (isFavorite ? ' is-favorite' : '')} aria-label={(isFavorite ? 'Remove ' : 'Add ') + track.title + (isFavorite ? ' from favorites' : ' to favorites')} aria-pressed={isFavorite} onClick={() => toggleFavorite(track.id)}>
                    <TrackIcon name="star" filled={isFavorite} />
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="t01-empty" role="status">
          <div className="t01-empty-symbol"><TrackIcon name="search" /></div>
          <h2>{category === 'Favorites' && !query && !activeFilterCount ? 'No favorite tracks yet' : 'No tracks found'}</h2>
          <p>{category === 'Favorites' && !query && !activeFilterCount ? 'Tap the star beside a track to save it here.' : query ? 'No results for “' + query + '”. Try another search or clear your filters.' : 'No tracks match these filters. Try another category or reset your filters.'}</p>
          <button type="button" className="t01-empty-clear" onClick={() => { setQuery(''); if (!query) setCategory('Recent'); }}><TrackIcon name="close" /> {query ? 'Clear search' : 'Show all tracks'}</button>
          <button type="button" className="t01-empty-reset" onClick={reset}>Reset all filters</button>
        </div>
      )}

      {filterOpen && (
        <div className="t01-filter-overlay">
          <button type="button" className="t01-overlay-backdrop" aria-label="Close filters without applying" onClick={() => setFilterOpen(false)} />
          <div className="t01-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="t01-filter-heading">
            <div className="t01-sheet-top"><h2 id="t01-filter-heading">Filter tracks</h2><button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)}><TrackIcon name="close" /></button></div>
            <div className="t01-sheet-scroll">
              {FIELDS.map(field => (
                <fieldset key={field.key} className={'t01-filter-field' + (focusField === field.key ? ' is-highlighted' : '')}>
                  <legend>{field.title}</legend>
                  <div className="t01-option-row">
                    {field.options.map(option => (
                      <button type="button" key={option} aria-pressed={draft[field.key] === option} className="t01-option" onClick={() => setDraft(old => ({ ...old, [field.key]: option }))}>{option}</button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <label className="t01-chart-only"><input type="checkbox" checked={draft.chartOnly} onChange={event => setDraft(old => ({ ...old, chartOnly: event.target.checked }))} /> Show tracks with charts only</label>
            </div>
            <div className="t01-sheet-footer">
              <button type="button" className="t01-sheet-reset" onClick={() => setDraft({ ...EMPTY_FILTER })}>Reset</button>
              <button type="button" className="t01-sheet-apply" onClick={() => { setApplied({ ...draft }); setFilterOpen(false); }}>Apply filters</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
