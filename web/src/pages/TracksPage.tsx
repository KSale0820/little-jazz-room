import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RECORDED_BACKING_TRACKS, isUsableRecordedTrack } from '../features/recordings/recordingCatalog';
import './DemoPages.css';
import './TracksPage.css';
import './CleanPixelCharts.css';
import './CleanPixelHomeLegacy.css';
import './TracksApproved.css';

type Category = 'All' | 'Standards' | 'Blues' | 'Bossa' | 'Ballad' | 'Up-Tempo' | 'Bookmarked';
type FilterField = 'instrument' | 'style' | 'key' | 'difficulty';
type TrackFilter = { instrument: string; style: string; key: string; difficulty: string; chartOnly: boolean };
const EMPTY_FILTER: TrackFilter = { instrument: 'All', style: 'All', key: 'All', difficulty: 'All', chartOnly: false };
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

const CATEGORIES: Category[] = ['All', 'Standards', 'Blues', 'Bossa', 'Ballad', 'Up-Tempo'];
const FIELDS: { key: FilterField; title: string; options: string[] }[] = [
  { key: 'instrument', title: 'Instrument', options: ['All', 'Piano', 'Guitar', 'Bass', 'Drums', 'Trumpet', 'Alto Saxophone', 'Tenor Saxophone'] },
  { key: 'style', title: 'Style', options: ['All', 'Swing', 'Ballad', 'Bebop', 'Bossa'] },
  { key: 'key', title: 'Key', options: ['All', 'F', 'B♭', 'E♭', 'C minor'] },
  { key: 'difficulty', title: 'Difficulty', options: ['All', 'Beginner', 'Intermediate'] },
];

function TrackIcon({ name, filled = false }: { name: 'book' | 'chevron' | 'star' | 'bookmark' | 'filter' | 'search' | 'unavailable' | 'down' | 'close'; filled?: boolean }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (name === 'bookmark') return <svg {...common} fill={filled ? 'currentColor' : 'none'}><path d="M5 3h14v18l-7-5-7 5z" /></svg>;
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
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function TracksPage() {
  const { charts, setActiveRoutineId } = useApp();
  const [availableRecordings, setAvailableRecordings] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [applied, setApplied] = useState<TrackFilter>({ ...EMPTY_FILTER });
  const [draft, setDraft] = useState<TrackFilter>({ ...EMPTY_FILTER });
  const [filterOpen, setFilterOpen] = useState(false);
  const [focusField, setFocusField] = useState<FilterField | null>(null);
  const favoritesKey = FAVORITE_PREFIX + (user?.id ?? 'local');
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(favoritesKey));

  useEffect(() => { setFavorites(readFavorites(favoritesKey)); }, [favoritesKey]);
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

  const catalog = useMemo(() => {
    const tracks = TRACK_CATALOG.flatMap(track => {
      const chart = track.chartId ? charts.find(candidate => candidate.id === track.chartId) ?? null : null;
      return chart || track.recordingId ? [{ ...track, chart }] : [];
    });
    // Keep every chart discoverable within the same track library without duplicates.
    const linkedChartIds = new Set(tracks.map(track => track.chart?.id).filter((id): id is string => Boolean(id)));
    const chartsWithoutTracks = charts.filter(chart => !linkedChartIds.has(chart.id)).map(chart => ({
      id: 'chart:' + chart.id,
      chartId: chart.id,
      title: chart.title,
      subtitle: chart.bars.length + ' measures · Chord chart',
      style: chart.feel || 'Chart',
      key: chart.concert_key,
      bpm: null,
      difficulty: chart.difficulty ?? 'All',
      instruments: [] as string[],
      blues: /blues/i.test(chart.title),
      standard: false,
      recordingId: null,
      chart,
    }));
    return [...tracks, ...chartsWithoutTracks];
  }, [charts]);
  const filtered = useMemo(() => catalog.filter(track => {
    const term = query.trim().toLowerCase();
    if (term && ![track.title, track.subtitle, track.style, track.key, track.chart?.title ?? ''].some(value => value.toLowerCase().includes(term))) return false;
    if (category === 'Bookmarked' && !favorites.includes(track.id)) return false;
    if (category === 'Standards' && !track.standard && !/^(autumn leaves|blue bossa|song for my father|sandu|all the things you are|how high the moon|ornithology|oleo|tenor madness|so what)$/i.test(track.title)) return false;
    if (category === 'Blues' && !track.blues && !/blues/i.test(track.style)) return false;
    if (category === 'Bossa' && !/bossa/i.test(track.style + ' ' + track.subtitle)) return false;
    if (category === 'Ballad' && !/ballad/i.test(track.style + ' ' + track.subtitle)) return false;
    if (category === 'Up-Tempo' && (track.bpm ?? 0) < 170 && !/up.?tempo|fast/i.test(track.style + ' ' + track.subtitle)) return false;
    if (applied.chartOnly && !track.chart) return false;
    if (applied.instrument !== 'All' && !track.instruments.includes(applied.instrument)) return false;
    if (applied.style !== 'All' && track.style !== applied.style) return false;
    if (applied.key !== 'All' && track.key !== applied.key) return false;
    if (applied.difficulty !== 'All' && track.difficulty !== applied.difficulty) return false;
    return true; // Every visible result has an existing linked chart.
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
  const openChart = (id: string | null, recordingId: string | null = null) => {
    setActiveRoutineId(null);
    if (!id && !recordingId) return;
    navigate('/player?' + (id ? 'chart=' + encodeURIComponent(id) : '') +
      (recordingId ? (id ? '&' : '') + 'recording=' + encodeURIComponent(recordingId) : ''));
  };
  const reset = () => {
    setCategory('All');
    setQuery('');
    setApplied({ ...EMPTY_FILTER });
    setDraft({ ...EMPTY_FILTER });
  };

  return (
    <section className="t01-page t01-approved" aria-label="Tracks and charts library">
      <header className="t01-header t01-pixel-header">
        <h1 className="t01-approved-title">
          <span className="sr-only">Tracks and Charts</span>
          <img src="/visuals/tracks-approved/tracks-title.svg" alt="" aria-hidden="true" />
        </h1>
        <img className="t01-pixel-shelf" src="/visuals/tracks-approved/jazz-study-shelf.svg" alt="" aria-hidden="true" />
      </header>
      <div className="t01-search-wrap">
        <TrackIcon name="search" />
        <input aria-label="Search tracks and charts" type="search" value={query}
          onChange={event => setQuery(event.target.value)} placeholder={'Search tracks, e.g. “Autumn Leaves”'} />
        {query && <button type="button" className="t01-search-clear" aria-label="Clear search"
          onClick={() => setQuery('')}><TrackIcon name="close" /></button>}
        <button type="button" className="t01-advanced-filter" aria-label="Advanced filters"
          aria-haspopup="dialog" onClick={() => openFilters()}><TrackIcon name="filter" />
          {activeFilterCount > 0 && <span aria-label={activeFilterCount + ' active filters'}>{activeFilterCount}</span>}
        </button>
      </div>
      <div className="t01-categories" aria-label="Browse by style">
        {CATEGORIES.map(value => (
          <button key={value} type="button" className="t01-category"
            aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>
        ))}
      </div>
      <button type="button" className="t01-bookmarked-link"
        aria-pressed={category === 'Bookmarked'} onClick={() => { setCategory(old => old === 'Bookmarked' ? 'All' : 'Bookmarked'); setQuery(''); }}>
        <img src="/visuals/tracks-approved/bookmark.png" alt="" aria-hidden="true" />
        <span className="t01-bookmarked-copy"><strong>Bookmarked</strong><small>Saved tracks &amp; charts{favorites.length ? ' · ' + favorites.length : ''}</small></span>
        <TrackIcon name="chevron" />
      </button>
      {category === 'Bookmarked' && <div className="t01-bookmarked-caption">
        <span>Saved for later</span><button type="button" onClick={() => setCategory('All')}>Browse all</button>
      </div>}
      {filtered.length > 0 ? (
        <div className="t01-track-list">
          {filtered.map(track => {
            const isFavorite = favorites.includes(track.id);
            const hasAudio = Boolean(track.recordingId && availableRecordings.includes(track.recordingId));
            const isAvailable = Boolean(track.chart || hasAudio);
            const subtitle = [
              track.style || (track.chart ? 'Chord chart' : 'Track'),
              track.bpm != null ? track.bpm + ' BPM' : null,
              track.key || null
            ].filter(Boolean).join(' · ');
            return (
              <article className="t01-track-card" key={track.id}>
                <img className="t01-record-icon" src="/visuals/tracks-approved/record.png" alt="" aria-hidden="true" />
                <button type="button" className="t01-card-open" disabled={!isAvailable}
                  aria-label={'Open ' + track.title + (track.chart ? ' chord chart' : ' backing track')}
                  onClick={() => openChart(track.chart?.id ?? null, hasAudio ? track.recordingId : null)}>
                  <strong className="t01-card-title">{track.title}</strong>
                  <span className="t01-card-subtitle">{subtitle}</span>
                </button>
                <button type="button" className={'t01-favorite' + (isFavorite ? ' is-favorite' : '')}
                  aria-label={(isFavorite ? 'Remove ' : 'Bookmark ') + track.title}
                  aria-pressed={isFavorite} onClick={() => toggleFavorite(track.id)}>
                  <TrackIcon name="bookmark" filled={isFavorite} />
                </button>
                <button type="button" className="t01-row-play" disabled={!isAvailable}
                  aria-label={(hasAudio ? 'Open track ' : 'Practice chart for ') + track.title}
                  onClick={() => openChart(track.chart?.id ?? null, hasAudio ? track.recordingId : null)}>
                  <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="currentColor"><path d="M7 3v18l14-9z"/></svg>
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="t01-empty" role="status">
          <img src="/visuals/tracks-approved/bookmark-filled.svg" alt="" aria-hidden="true" />
          <h2>{category === 'Bookmarked' ? 'No bookmarks yet' : 'No matching tracks or charts'}</h2>
          <p>{category === 'Bookmarked' ? 'Use the bookmark icon on any track or chart to save it here.' : 'Try another style or search term.'}</p>
          <button type="button" className="t01-empty-clear" onClick={reset}>Browse all tracks &amp; charts</button>
        </div>
      )}

      {filterOpen && (
        <div className="t01-filter-overlay">
          <button type="button" className="t01-overlay-backdrop" aria-label="Close filters without applying" onClick={() => setFilterOpen(false)} />
          <div className="t01-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="t01-filter-heading">
            <div className="t01-sheet-top"><h2 id="t01-filter-heading">Filter library</h2><button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)}><TrackIcon name="close" /></button></div>
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
