import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { Chart } from '../types/content';
import { RECORDED_BACKING_TRACKS, isUsableRecordedTrack } from '../features/recordings/recordingCatalog';
import './DemoPages.css';
import './TracksPage.css';

type TrackTab = 'Library' | 'Community' | 'My Tracks';
type FilterField = 'style' | 'tempo' | 'key' | 'difficulty' | 'instrument';
type TrackFilter = { style: string; tempo: string; key: string; difficulty: string; instrument: string; chartOnly: boolean };
const EMPTY_FILTER: TrackFilter = { style: 'All', tempo: 'All', key: 'All', difficulty: 'All', instrument: 'All', chartOnly: false };
const FAVORITE_PREFIX = 'little-jazz-room:track-favorites:v1:';

type TrackPreview = {
  id: string;
  chartId: string | null;
  title: string;
  subtitle: string;
  style: string;
  key: string;
  bpm: number | null;
  difficulty: string;
  instruments: string[];
  blues: boolean;
  standard?: boolean;
};
type TrackRow = TrackPreview & { recordingId: string | null; chart: Chart | null };
type TrackShelf = { key: string; title: string; items: TrackRow[] };

// UI-only original-track previews. The linked seed charts remain authoritative
// for notation, and no recorded audio is claimed or played.
const TRACK_PREVIEWS: TrackPreview[] = [
  { id: 'after-hours', chartId: 'blues-f-12', title: 'After-Hours Blues', subtitle: 'Medium swing · 12-bar blues', style: 'Swing', key: 'F', bpm: 92, difficulty: 'Beginner', instruments: ['Piano', 'Guitar', 'Bass', 'Drums', 'Trumpet', 'Tenor Saxophone'], blues: true },
  { id: 'moonlit', chartId: 'rhythm-bb-32', title: 'Moonlit Changes', subtitle: 'Ballad · ii–V–I study', style: 'Ballad', key: 'B♭', bpm: 72, difficulty: 'Intermediate', instruments: ['Piano', 'Guitar', 'Bass', 'Trumpet', 'Tenor Saxophone'], blues: false },
  { id: 'staircase', chartId: 'ballad-eb-16', title: 'Blue Staircase', subtitle: 'Bebop · original study', style: 'Bebop', key: 'E♭', bpm: 124, difficulty: 'Intermediate', instruments: ['Piano', 'Guitar', 'Bass', 'Alto Saxophone', 'Tenor Saxophone'], blues: false },
  { id: 'sunday', chartId: 'minor-bossa-cm-16', title: 'Sunday Walk', subtitle: 'Easy bossa · original study', style: 'Bossa', key: 'C minor', bpm: null, difficulty: 'Beginner', instruments: ['Piano', 'Guitar', 'Bass', 'Drums'], blues: false },
];

/** Include real stereo recordings only when a rights-cleared file is registered. */
const TRACK_CATALOG: Array<TrackPreview & { recordingId: string | null }> = [
  ...TRACK_PREVIEWS.filter(preview => !RECORDED_BACKING_TRACKS.some(item => item.id === preview.id))
    .map(preview => ({ ...preview, recordingId: null })),
  ...RECORDED_BACKING_TRACKS.filter(isUsableRecordedTrack).map(item => ({
    id: item.id, chartId: item.chartId, title: item.title, subtitle: item.subtitle,
    style: item.style, key: item.key, bpm: item.recordedBpm,
    difficulty: item.difficulty, instruments: item.instruments, blues: item.blues,
    standard: item.id === 'autumn-leaves',
    recordingId: item.id,
  })),
];

const LIBRARY_SHELVES = ['Standards', 'Blues & Changes', 'Grooves & Feels', 'Practice Tools', 'Charts & Studies'];

function tabFromUrl(value: string | null): TrackTab {
  if (value === 'community' || value === 'shared') return 'Community';
  if (value === 'my' || value === 'saved' || value === 'favorites') return 'My Tracks';
  return 'Library';
}

function tempoGroup(bpm: number | null): string {
  if (bpm === null) return 'Chart only';
  if (bpm < 100) return 'Slow (under 100 BPM)';
  if (bpm < 160) return 'Medium (100–159 BPM)';
  return 'Fast (160+ BPM)';
}

function trackShelf(track: TrackRow): string {
  const name = track.title.toLowerCase();
  if (track.blues || /blues|rhythm changes|ii.?v.?i|changes in b/.test(name)) return 'Blues & Changes';
  if (track.standard || /^(autumn leaves|blue bossa|song for my father|sandu|all the things you are|how high the moon|ornithology|oleo)$/.test(name)) return 'Standards';
  if (/drone|arpeggio|scales|tempo builder|metronome|cycle|modal study|voicing|exercise/.test(name)) return 'Practice Tools';
  if (/bossa|swing|ballad|groove|bebop|feel/.test(name) || /bossa|swing|ballad|bebop/i.test(track.style)) return 'Grooves & Feels';
  return 'Charts & Studies';
}

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
  const [availableRecordings, setAvailableRecordings] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const urlTab = params.get('tab');
  const [tab, setTab] = useState<TrackTab>(() => tabFromUrl(urlTab));
  const [focusedShelf, setFocusedShelf] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState<TrackFilter>({ ...EMPTY_FILTER });
  const [draft, setDraft] = useState<TrackFilter>({ ...EMPTY_FILTER });
  const [filterOpen, setFilterOpen] = useState(false);
  const [focusField, setFocusField] = useState<FilterField | null>(null);
  const favoritesKey = FAVORITE_PREFIX + (user?.id ?? 'local');
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(favoritesKey));

  useEffect(() => { setFavorites(readFavorites(favoritesKey)); }, [favoritesKey]);
  useEffect(() => { setTab(tabFromUrl(urlTab)); setFocusedShelf(null); }, [urlTab]);
  useEffect(() => {
    let cancelled = false;
    // Static files must really exist; Vite's HTML fallback is not audio.
    void Promise.all(RECORDED_BACKING_TRACKS.filter(isUsableRecordedTrack).map(async recording => {
      try {
        const response = await fetch(recording.src, { method: 'HEAD' });
        const type = response.headers.get('content-type') ?? '';
        return response.ok && (/^audio\//i.test(type) || /application\/octet-stream/i.test(type))
          ? recording.id : null;
      } catch { return null; }
    })).then(ids => {
      if (!cancelled) setAvailableRecordings(ids.filter((id): id is string => id !== null));
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!filterOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setFilterOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [filterOpen]);

  const catalog = useMemo((): TrackRow[] => {
    const tracks: TrackRow[] = TRACK_CATALOG.flatMap(track => {
      const chart = track.chartId ? charts.find(candidate => candidate.id === track.chartId) ?? null : null;
      return chart || track.recordingId ? [{ ...track, chart }] : [];
    });
    // Every chart is discoverable, including user-created charts. No duplicate linked charts.
    const linkedChartIds = new Set(tracks.map(track => track.chart?.id).filter((id): id is string => Boolean(id)));
    const chartsWithoutTracks: TrackRow[] = charts.filter(chart => !linkedChartIds.has(chart.id)).map(chart => ({
      id: 'chart:' + chart.id,
      chartId: chart.id,
      title: chart.title,
      subtitle: chart.bars.length + ' measures · Chord chart',
      style: chart.feel || 'Chart',
      key: chart.concert_key,
      bpm: null,
      difficulty: chart.difficulty ?? 'All',
      instruments: [],
      blues: /blues/i.test(chart.title),
      standard: false,
      recordingId: null,
      chart,
    }));
    return [...tracks, ...chartsWithoutTracks];
  }, [charts]);

  // These dropdowns reflect actual catalog values rather than hard-coded mock tracks.
  const fields = useMemo((): { key: FilterField; title: string; options: string[] }[] => {
    const options = (values: string[]) => ['All', ...Array.from(new Set(values.filter(value => value && value !== 'All'))).sort()];
    const styles = catalog.map(track => track.style.trim())
      .filter(Boolean).map(value => value.charAt(0).toUpperCase() + value.slice(1));
    return [
      { key: 'style', title: 'Style', options: options(styles) },
      { key: 'tempo', title: 'Tempo', options: ['All', 'Slow (under 100 BPM)', 'Medium (100–159 BPM)', 'Fast (160+ BPM)', 'Chart only'] },
      { key: 'key', title: 'Key', options: options(catalog.map(track => track.key)) },
      { key: 'difficulty', title: 'Level', options: options(catalog.map(track => track.difficulty)) },
      { key: 'instrument', title: 'Instrument', options: options(catalog.flatMap(track => track.instruments)) },
    ];
  }, [catalog]);

  const filtered = useMemo(() => catalog.filter(track => {
    const term = query.trim().toLowerCase();
    if (term && !term.split(/\s+/).every(word =>
      [track.title, track.subtitle, track.style, track.key, track.chart?.title ?? '',
        track.chart?.practice_focus ?? '', ...(track.chart?.related_standards ?? [])]
        .some(value => value.toLowerCase().includes(word)))) return false;
    if (applied.chartOnly && !track.chart) return false;
    if (applied.instrument !== 'All' && !track.instruments.includes(applied.instrument) && !track.instruments.includes('All')) return false;
    if (applied.style !== 'All' && track.style.toLowerCase() !== applied.style.toLowerCase()) return false;
    if (applied.tempo !== 'All' && tempoGroup(track.bpm) !== applied.tempo) return false;
    if (applied.key !== 'All' && track.key !== applied.key) return false;
    if (applied.difficulty !== 'All' && track.difficulty !== applied.difficulty) return false;
    return true;
  }), [catalog, query, applied]);

  const sourceShelves = useMemo((): TrackShelf[] => {
    if (tab === 'Community') return []; // Track sharing is not implemented; don't invent public content.
    if (tab === 'My Tracks') return [
      { key: 'saved', title: 'Saved Tracks & Charts', items: filtered.filter(track => favorites.includes(track.id)) },
      { key: 'created', title: 'Created by Me', items: filtered.filter(track => track.chart?.is_custom === true) },
    ];
    return LIBRARY_SHELVES.map(title => ({
      key: title, title, items: filtered.filter(track => trackShelf(track) === title),
    })).filter(shelf => shelf.items.length > 0);
  }, [tab, filtered, favorites]);
  const focused = focusedShelf ? sourceShelves.find(shelf => shelf.key === focusedShelf) : undefined;
  const hasResults = sourceShelves.some(shelf => shelf.items.length > 0);
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
  const openChart = (id: string | null, recordingId: string | null = null) => {
    setActiveRoutineId(null);
    if (!id && !recordingId) return;
    navigate('/player?' + (id ? 'chart=' + encodeURIComponent(id) : '') +
      (recordingId ? (id ? '&' : '') + 'recording=' + encodeURIComponent(recordingId) : ''));
  };
  const resetFilters = () => {
    setQuery('');
    setApplied({ ...EMPTY_FILTER });
    setDraft({ ...EMPTY_FILTER });
    setFocusedShelf(null);
  };
  const switchTab = (next: TrackTab) => {
    setTab(next);
    resetFilters();
    setParams(next === 'Library' ? {} : { tab: next === 'Community' ? 'community' : 'my' });
  };
  const renderCard = (track: TrackRow) => {
    const saved = favorites.includes(track.id);
    const hasAudio = Boolean(track.recordingId && availableRecordings.includes(track.recordingId));
    const isChart = Boolean(track.chart);
    const playable = isChart || hasAudio;
    return (
      <article className="t01-track-card" key={track.id}>
        <button type="button" className="t01-card-open" disabled={!playable}
          aria-label={'Open ' + track.title + (hasAudio ? ' with recording' : ' chart')}
          onClick={() => openChart(track.chart?.id ?? null, hasAudio ? track.recordingId : null)}>
          <span className="t01-card-title">{track.title}</span>
          <span className="t01-card-key">{track.key}</span>
          <span className="t01-card-footer">
            <span className="t01-card-tempo">{track.bpm === null ? 'Chart only' : track.bpm + ' BPM'}</span>
            <span className={'t01-status ' + (hasAudio ? 't01-audio' : 't01-chart')}>
              {hasAudio ? 'Audio' : isChart ? 'Chart' : 'Unavailable'}
            </span>
          </span>
        </button>
        <button type="button" className={'t01-favorite' + (saved ? ' is-favorite' : '')}
          aria-label={(saved ? 'Remove ' : 'Save ') + track.title + (saved ? ' from favorites' : ' to favorites')}
          aria-pressed={saved} onClick={() => toggleFavorite(track.id)}>
          <TrackIcon name="star" filled={saved} />
        </button>
      </article>
    );
  };

  return (
    <section className="t01-page" aria-label="Tracks and charts library">
      <header className="t01-header">
        <h1 className="t01-title">Tracks</h1>
        <p className="t01-subtitle">Play along with jazz tracks, grooves, and standards.</p>
      </header>

      <div className="t01-tabs" role="tablist" aria-label="Track sections">
        {(['Library', 'Community', 'My Tracks'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={tab === value}
            className={tab === value ? 'is-selected' : ''} onClick={() => switchTab(value)}>
            {value}
          </button>
        ))}
      </div>

      <label className="t01-search-wrap">
        <TrackIcon name="search" />
        <span className="t01-sr-only">Search tracks and charts</span>
        <input type="search" value={query} onChange={event => { setQuery(event.target.value); setFocusedShelf(null); }}
          placeholder="Search tracks..." />
        {query && <button type="button" className="t01-search-clear" aria-label="Clear search"
          onClick={() => { setQuery(''); setFocusedShelf(null); }}><TrackIcon name="close" /></button>}
      </label>

      <div className="t01-filter-actions" aria-label="Track filters">
        {fields.slice(0, 4).map(field => (
          <button type="button" key={field.key} className="t01-filter-quick"
            aria-haspopup="dialog" aria-label={'Filter by ' + field.title}
            onClick={() => openFilters(field.key)}>
            <span>{applied[field.key] !== 'All' ? applied[field.key] : field.title}</span>
            <TrackIcon name="down" />
          </button>
        ))}
      </div>

      {focused ? (
        <div className="t01-focused-shelf">
          <button type="button" className="t01-shelf-back" onClick={() => setFocusedShelf(null)}>‹ All categories</button>
          <div className="t01-shelf-heading">
            <h2>{focused.title}</h2><span className="t01-shelf-count">{focused.items.length} items</span>
          </div>
          <div className="t01-focused-grid">{focused.items.map(renderCard)}</div>
        </div>
      ) : (
        <div className="t01-shelves">
          {sourceShelves.map(shelf => (
            <section className="t01-shelf" key={shelf.key} aria-label={shelf.title}>
              <div className="t01-shelf-heading">
                <h2>{shelf.title}</h2>
                {shelf.items.length > 0 && (
                  <button type="button" className="t01-see-all"
                    aria-label={'See all ' + shelf.title + ' tracks and charts'}
                    onClick={() => setFocusedShelf(shelf.key)}>See all <span aria-hidden="true">›</span>
                  </button>
                )}
              </div>
              {shelf.items.length > 0 ? (
                <div className="t01-shelf-scroll" role="region"
                  aria-label={shelf.title + ', scroll horizontally'} tabIndex={0}>
                  {shelf.items.map(renderCard)}
                </div>
              ) : (
                <div className="t01-shelf-empty">
                  {shelf.key === 'saved'
                    ? 'Save tracks or charts from the Library to find them here.'
                    : 'Charts you create will appear here.'}
                </div>
              )}
            </section>
          ))}
          {!hasResults && tab !== 'My Tracks' && (
            <div className="t01-empty" role="status">
              <h2>{tab === 'Community' ? 'Community tracks aren’t available yet' : 'No tracks or charts found'}</h2>
              <p>{tab === 'Community'
                ? 'Community track sharing is not available in the class demo. Your saved tracks and charts are in My Tracks.'
                : 'Try another search or clear your filters.'}</p>
              {(query || activeFilterCount > 0) && <button type="button" className="t01-empty-clear"
                onClick={resetFilters}>Clear filters</button>}
            </div>
          )}
        </div>
      )}

      {tab === 'My Tracks' && (
        <button className="t01-create-button" type="button" onClick={() => navigate('/charts/new')}>
          <span aria-hidden="true">+</span> Create chart
        </button>
      )}

      {filterOpen && (
        <div className="t01-filter-overlay">
          <button type="button" className="t01-overlay-backdrop"
            aria-label="Close filters without applying" onClick={() => setFilterOpen(false)} />
          <div className="t01-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="t01-filter-heading">
            <div className="t01-sheet-top">
              <h2 id="t01-filter-heading">Filter tracks &amp; charts</h2>
              <button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)}>
                <TrackIcon name="close" />
              </button>
            </div>
            <div className="t01-sheet-scroll">
              {fields.map(field => (
                <fieldset key={field.key} className={'t01-filter-field' + (focusField === field.key ? ' is-highlighted' : '')}>
                  <legend>{field.title}</legend>
                  <div className="t01-option-row">
                    {field.options.map(option => (
                      <button type="button" key={option} className="t01-option"
                        aria-pressed={draft[field.key] === option}
                        onClick={() => setDraft(current => ({ ...current, [field.key]: option }))}>
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <label className="t01-chart-only">
                <input type="checkbox" checked={draft.chartOnly}
                  onChange={event => setDraft(current => ({ ...current, chartOnly: event.target.checked }))} />
                Show entries with charts only
              </label>
            </div>
            <div className="t01-sheet-footer">
              <button type="button" className="t01-sheet-reset" onClick={() => setDraft({ ...EMPTY_FILTER })}>Reset</button>
              <button type="button" className="t01-sheet-apply" onClick={() => {
                setApplied({ ...draft }); setFocusedShelf(null); setFilterOpen(false);
              }}>Apply filters</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
