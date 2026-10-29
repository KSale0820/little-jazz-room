import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

type ExploreTab = 'routines' | 'exercises' | 'challenges';

const INSTRUMENTS = ['All', 'Piano', 'Guitar', 'Alto Saxophone', 'Tenor Saxophone', 'Trumpet', 'Bass', 'Drums'];

const CATEGORIES = [
  { name: 'Technique', hint: 'Scales, arpeggios' },
  { name: 'Harmony', hint: 'ii–V–I, chord voicings' },
  { name: 'Improvisation', hint: 'Soloing, chord tones' },
  { name: 'Repertoire', hint: 'Jazz forms, melodies' },
  { name: 'Rhythm', hint: 'Swing, time feel' },
  { name: 'Ear Training', hint: 'Listen, imitate' },
];

export function ExplorePage() {
  const { exercises, routines, paths, charts, showToast, setActiveRoutineId } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ExploreTab>('routines');
  const [query, setQuery] = useState('');
  const [instrument, setInstrument] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredRoutines = useMemo(() => {
    const q = query.toLowerCase();
    return routines.filter(r => {
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [routines, query]);

  const filteredExercises = useMemo(() => {
    const q = query.toLowerCase();
    return exercises.filter(ex => {
      if (categoryFilter && ex.category !== categoryFilter) return false;
      if (instrument !== 'All') {
        const mat = ex.suggested_material.toLowerCase();
        const inst = instrument.toLowerCase();
        if (!mat.includes(inst.split(' ')[0]!) && ex.category !== instrument) {
          /* soft filter — show all when no match for demo */
        }
      }
      if (q && !(`${ex.title} ${ex.category} ${ex.level}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [exercises, query, categoryFilter, instrument]);

  const listTitle =
    tab === 'routines' ? 'Featured routines' : tab === 'exercises' ? 'Exercises' : 'Challenges · Preview';

  return (
    <section className="page explore-page pad tight" aria-label="Explore">
      <div className="pageheading">
        <h1>Explore</h1>
        <small>Community · {paths.length} learning paths</small>
      </div>
      <input
        aria-label="Search routines or exercises"
        className="search"
        placeholder="Search routines or exercises…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div className="tabs three" role="tablist">
        {(['routines', 'exercises', 'challenges'] as const).map(t => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'active' : undefined}
            onClick={() => setTab(t)}
          >
            {t === 'routines' ? 'Routines' : t === 'exercises' ? 'Exercises' : 'Challenges'}
          </button>
        ))}
      </div>
      <div className="chipgroup" role="group" aria-label="Instrument filter">
        {INSTRUMENTS.map(inst => (
          <button
            key={inst}
            type="button"
            className={`chip ${instrument === inst ? 'selected' : ''}`}
            onClick={() => {
              setInstrument(inst);
              showToast(`Instrument filter: ${inst} (catalog preview)`);
            }}
          >
            {inst === 'Alto Saxophone' ? 'Alto Sax' : inst === 'Tenor Saxophone' ? 'Tenor Sax' : inst}
          </button>
        ))}
      </div>
      <h3 className="section-title">{listTitle}</h3>
      <div className="results-list">
        {tab === 'routines' &&
          filteredRoutines.map(r => (
            <button
              key={r.id}
              type="button"
              className="minirow row-button"
              onClick={() => {
                setActiveRoutineId(r.id);
                navigate('/practice');
              }}
            >
              <span>
                <h3>{r.title}</h3>
                <small>
                  {r.duration_minutes} min · {r.level}
                  {r.is_seed === false ? ' · yours' : ' · seed sample'}
                </small>
              </span>
              <span aria-hidden>›</span>
            </button>
          ))}
        {tab === 'exercises' &&
          filteredExercises.map(ex => (
            <button
              key={ex.id}
              type="button"
              className="minirow row-button"
              onClick={() => navigate('/create', { state: { editExerciseId: ex.id } })}
            >
              <span>
                <h3>{ex.title}</h3>
                <small>
                  {ex.category} · {ex.duration_minutes} min · {ex.level}
                </small>
              </span>
              <span aria-hidden>›</span>
            </button>
          ))}
        {tab === 'challenges' && (
          <>
            <p className="minirow muted">7 Days of Jazz — Preview · Community feature</p>
            <p className="minirow muted">One Chorus Every Day — Preview · Community feature</p>
          </>
        )}
        {tab === 'routines' && filteredRoutines.length === 0 && (
          <p className="muted">No matches. Try another search.</p>
        )}
        {tab === 'exercises' && filteredExercises.length === 0 && (
          <p className="muted">No matches. Try another search.</p>
        )}
      </div>
      <div className="box">
        <div className="between">
          <div>
            <h3>Jazz harmony charts</h3>
            <p className="muted" style={{ marginTop: 5 }}>
              {charts.length} original blues, bossa, rhythm, songbook and modal studies
            </p>
          </div>
          <button type="button" className="pill" onClick={() => navigate('/practice')}>
            View charts
          </button>
        </div>
      </div>
      <h3 className="section-title">Browse by Category</h3>
      <div className="categories">
        {CATEGORIES.map(c => (
          <button
            key={c.name}
            type="button"
            onClick={() => {
              setTab('exercises');
              setCategoryFilter(c.name);
              setQuery('');
              showToast(`${c.name} exercises selected`);
            }}
          >
            <strong>{c.name}</strong>
            <span>{c.hint}</span>
          </button>
        ))}
      </div>
      <div className="box">
        <h3>Learning paths</h3>
        {paths.map(p => (
          <div key={p.id} className="minirow">
            <div>
              <strong>{p.title}</strong>
              <br />
              <small>
                {p.level} · {p.sessions.length} sessions
              </small>
            </div>
          </div>
        ))}
        <p className="muted" style={{ marginTop: 8 }}>
          Paths are suggested sequences, not streak requirements.
        </p>
      </div>
    </section>
  );
}
